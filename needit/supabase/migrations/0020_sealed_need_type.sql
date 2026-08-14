-- ============================================================
-- EXPRIFI — migration 0020: "wax & sealed" as a third need type
-- Aug 9, 2026.  Run this whole file in the Supabase SQL Editor.
-- Safe to run more than once.
--
-- ⚠️  THIS FILE TOUCHES NO POLICY ON `requests`, DELIBERATELY.
--     Migrations 0002 and 0015 both create a policy named "requests readable".
--     Re-running 0002 silently kills public browsing. Nothing below drops,
--     creates or alters a policy.
--
-- ⚠️  RUN THIS BEFORE THE APP CODE THAT USES IT, NOT AFTER.
--     Widening the type can't break an existing row — every current 'single'
--     and 'bulk' still passes. Shipping a form that can emit 'sealed' before
--     the type accepts it fails the insert. DB first is the only safe order.
--
-- ⚠️  THIS IS A ONE-WAY DOOR.
--     Postgres has no `ALTER TYPE ... DROP VALUE`. Removing 'sealed' later
--     means creating a replacement enum, rewriting every column that uses
--     request_type, and swapping them over. Adding it is cheap; un-adding it
--     is a migration with downtime. Kyle approved it explicitly on Aug 9.
--
-- WHY THIS EXISTS
--
-- 3b addendum §2.3 specifies three options under "What kind": Bulk & lots ·
-- Single cards · Wax & sealed. Only two were ever built. Unopened wax is a
-- large and distinct slice of the hobby, and a seller with boxes had to file
-- them under "bulk" — wrong in a way that shows on the board, and wrong in a
-- way that makes the type facet less useful the more sealed demand appears.
--
-- WHAT THE PREVIOUS DRAFT OF THIS FILE GOT WRONG
--
-- It assumed `requests.type` was text with a check constraint, because that is
-- how `demand_alerts.type` models the same vocabulary (see 0008) and because
-- there is no 0001 migration to read — the base `requests` table was created
-- in the Supabase dashboard, so its shape is not in this repo.
--
-- It is an ENUM: `request_type`, values ('single','bulk'). A probe run against
-- production found NO check constraint on requests.type at all, which is the
-- tell. The draft had a guard that raised rather than proceeding on a wrong
-- assumption, and the guard is what caught it. Keeping that lesson here:
-- when the base schema isn't in the repo, verify the shape before writing the
-- ALTER, and make the migration refuse rather than silently no-op.
--
-- THE TWO TABLES STILL DISAGREE
--
-- `requests.type` is an enum; `demand_alerts.type` is text + check. Same
-- vocabulary, two mechanisms, nothing keeping them in step — exactly the drift
-- that bites when someone widens one and forgets the other. Section 2 widens
-- the check to match. Unifying them properly is its own ticket.
-- ============================================================


-- ===== 1. The enum ==========================================================
-- `if not exists` makes this re-runnable. Note the new value is NOT used
-- anywhere else in this file — Postgres 12+ allows ALTER TYPE ... ADD VALUE
-- inside a transaction block only as long as the value isn't referenced in the
-- same transaction, and the SQL Editor wraps statements in one.
alter type request_type add value if not exists 'sealed';


-- ===== 2. The demand_alerts twin ============================================
-- 0008 declared its own copy: `type text check (type in ('single','bulk'))`.
-- Easy to miss, and the symptom is not a board bug — it's a seller saving an
-- alert for sealed wax and getting a raw Postgres error at insert time.
-- null still means "any type", unchanged.
--
-- The old constraint is found by definition rather than by name: 0008 didn't
-- name it, so Postgres generated `demand_alerts_type_check`, and generated
-- names are not something to hardcode.
do $$
declare old_name text;
begin
  for old_name in
    select c.conname from pg_constraint c
     where c.conrelid = 'public.demand_alerts'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ~ '\mtype\M'
       and pg_get_constraintdef(c.oid) like '%bulk%'
  loop
    raise notice 'dropping existing demand_alerts type constraint: %', old_name;
    execute format('alter table demand_alerts drop constraint %I', old_name);
  end loop;

  if not exists (
    select 1 from pg_constraint where conname = 'demand_alerts_type_chk'
  ) then
    alter table demand_alerts add constraint demand_alerts_type_chk
      check (type is null or type in ('single', 'bulk', 'sealed'));
  end if;
end $$;


-- ===== 3. Comments ==========================================================
comment on column requests.type is
  'request_type enum: ''single'' | ''bulk'' | ''sealed''. Widened in 0020 to match 3b addendum §2.3. The vocabulary also lives in TYPES in lib/board-filters.ts and, as text + check, on demand_alerts.type — change all three in one commit.';

comment on column demand_alerts.type is
  'null = any. Otherwise ''single'' | ''bulk'' | ''sealed''. Text + check here, but an ENUM on requests.type — same vocabulary, two mechanisms. Widening one without the other is the known trap.';


-- ============================================================
-- VERIFY — run after the file above and eyeball the output.
-- Expect: enum lists single, bulk, sealed — and the check lists all three.
-- ============================================================
select 'request_type enum' as item,
       (select string_agg(e.enumlabel, ', ' order by e.enumsortorder)
          from pg_enum e join pg_type t on t.oid = e.enumtypid
         where t.typname = 'request_type') as state
union all
select 'demand_alerts.type check',
       coalesce((select pg_get_constraintdef(oid) from pg_constraint
                  where conname = 'demand_alerts_type_chk'), 'MISSING')
union all
select 'policies on requests',
       (select string_agg(policyname, ', ') from pg_policies
         where schemaname = 'public' and tablename = 'requests');

-- Nothing should be outside the vocabulary. Expect zero rows.
select id, title, type from requests
 where type::text not in ('single', 'bulk', 'sealed');
