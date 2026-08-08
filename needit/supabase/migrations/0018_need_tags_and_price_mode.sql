-- ============================================================
-- EXPRIFI — migration 0018: structured tags, comp price mode, grade floor
-- Aug 8, 2026.  Run this whole file in the Supabase SQL Editor.
-- Safe to run more than once.
--
-- ⚠️  RUN THE "LOOK BEFORE YOU LEAP" QUERY AT THE BOTTOM OF THIS HEADER FIRST.
--     Section 2 BLANKS any condition_pref value that isn't already 'raw' or
--     'graded'. That is not reversible.
--
-- ⚠️  THIS FILE TOUCHES NO POLICY ON `requests`, DELIBERATELY.
--     Migrations 0002 and 0015 both create a policy named "requests readable".
--     Re-running 0002 silently kills public browsing. Nothing below drops,
--     creates or alters a policy, and the VERIFY block re-lists pg_policies as
--     a paranoia check.
--
-- WHY THIS EXISTS
--
-- The Post a Need screen shipped with two native <select>s and a 60-character
-- free-text "condition preference" box whose contents rendered STRAIGHT ONTO
-- THE BOARD as a chip. So a board chip could say literally anything a buyer
-- typed, and nothing about a need was filterable beyond type/sport/price.
--
-- This migration gives three buyer signals a structured home:
--
--   price_mode    'max' | 'comp'.  'comp' means the buyer named no number.
--   tags          up to 3 slugs from a locked 10-value vocabulary.
--   condition_pref  narrowed from free text to 'raw' | 'graded' | null.
--   grade_min     already existed (0014) and was never read or written by
--                 anything. First used here.
--
-- ON THE WORD "COMP" — read this before building anything on it
--
-- 'comp' is a VERBATIM LABEL. The board row reads "AT COMP" and sellers name
-- a price through the existing offer/counter flow. No comparable-sales data is
-- fetched, stored, derived or implied anywhere. Every row in
-- card_data_providers is is_active = false, and pulling sold-comps off a
-- marketplace violates their terms — the live risk recorded in
-- exprifi-3b-addendum-board-filtering.md §1.2. If a future change makes this
-- word depend on real pricing data, that is a licensed-vendor decision, not a
-- UI change.
--
-- A comp need carries budget_cents = null, which means Postgres excludes it
-- from any `>=` / `<=` price filter and sorts it last under "Highest budget".
-- That is CORRECT AND DELIBERATE: a need with no number has no business
-- appearing in a "$0–100" view. Do not "fix" it.
-- ============================================================


-- ============================================================
-- LOOK BEFORE YOU LEAP — run this ALONE first and read the output.
-- Every row listed here has its condition_pref BLANKED by section 2.
-- Expect zero rows (the board is at 0). If you see rows you care about,
-- stop and copy them out.
-- ============================================================
--
--   select id, title, condition_pref, created_at
--     from requests
--    where condition_pref is not null
--      and condition_pref not in ('raw','graded')
--    order by created_at desc;


-- ===== 1. New columns =======================================================
alter table requests
  add column if not exists price_mode text   not null default 'max',
  add column if not exists tags       text[] not null default '{}';


-- ===== 2. Normalise condition_pref before constraining it ===================
-- The two obvious spellings map. Everything else ("Raw, PSA 9+, any") has no
-- structured equivalent and becomes null rather than a wrong guess — a chip
-- that says the wrong thing about condition is worse than no chip.
update requests
   set condition_pref = 'raw'
 where lower(trim(condition_pref)) in ('raw','raw only','ungraded');

update requests
   set condition_pref = 'graded'
 where lower(trim(condition_pref)) in
       ('graded','graded only','slab','slabs','slabs only');

update requests
   set condition_pref = null
 where condition_pref is not null
   and condition_pref not in ('raw','graded');


-- ===== 3. Constraints — make illegal states unrepresentable =================
-- The server action validates all of this too. These are the backstop for any
-- write that ISN'T the server action, which is the only kind of write that can
-- put nonsense on the board without anyone noticing.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'requests_price_mode_chk') then
    alter table requests add constraint requests_price_mode_chk
      check (price_mode in ('max','comp'));
  end if;

  -- A comp need carries no number. That is the entire meaning of it, and a
  -- hidden ceiling on a row that says "AT COMP" would be a lie told to sellers.
  if not exists (select 1 from pg_constraint where conname = 'requests_comp_no_budget_chk') then
    alter table requests add constraint requests_comp_no_budget_chk
      check (price_mode <> 'comp' or budget_cents is null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'requests_condition_pref_chk') then
    alter table requests add constraint requests_condition_pref_chk
      check (condition_pref is null or condition_pref in ('raw','graded'));
  end if;

  -- A grade floor only means something on a graded need.
  if not exists (select 1 from pg_constraint where conname = 'requests_grade_min_chk') then
    alter table requests add constraint requests_grade_min_chk
      check (
        grade_min is null
        or (condition_pref = 'graded'
            and grade_min in ('PSA 10','PSA 9+','PSA 8+','SGC 9+',
                              'BGS 9.5+','Any 9+','Any grade'))
      );
  end if;

  -- Max three tags, only from the locked vocabulary.
  -- ⚠️  This list is duplicated in lib/need-tags.ts. That duplication is the
  --     one drift risk in this feature: change a slug in one place and the
  --     chip renders fine but the insert fails. Change both in one commit.
  if not exists (select 1 from pg_constraint where conname = 'requests_tags_chk') then
    alter table requests add constraint requests_tags_chk
      check (
        coalesce(array_length(tags, 1), 0) <= 3
        and tags <@ array[
          'accepting-multiple','set-building','player-collection','team-lot',
          'any-parallel','numbered-only','rookies-only','vintage-only',
          'low-grade-ok','repeat-buyer'
        ]::text[]
      );
  end if;
end $$;


-- ===== 4. Index =============================================================
-- Costs nothing at 0 needs. Makes a future tag facet in the board rail a query
-- change rather than another migration.
create index if not exists requests_tags_idx on requests using gin (tags);


-- ===== 5. Comments ==========================================================
comment on column requests.price_mode is
  '''max'' = budget_cents is a ceiling. ''comp'' = the buyer named no number and the row reads AT COMP; sellers propose a price through the normal offer flow. VERBATIM LABEL ONLY — no comparable-sales data is fetched, stored or implied. Comp needs have budget_cents null and therefore drop out of price-banded board views by design.';

comment on column requests.tags is
  'Up to 3 slugs from a locked 10-value vocabulary, rendered as chips on the board row. The vocabulary also lives in lib/need-tags.ts — changing one without the other breaks inserts.';

comment on column requests.condition_pref is
  'Narrowed from free text to ''raw'' | ''graded'' | null (= any) in 0018. Before that it was a 60-char box rendered straight onto the board, so a chip could say anything. A ''graded'' row may also carry grade_min.';

comment on column requests.grade_min is
  'Grade floor as hobby shorthand (''PSA 9+''). Only valid when condition_pref = ''graded''. Added dead in 0014, first read or written in 0018.';


-- ============================================================
-- VERIFY — run after the file above and eyeball the output.
-- Expect: 2 columns, 5 constraints, 1 index.
-- ============================================================
select 'column' as kind, column_name as name
  from information_schema.columns
 where table_schema = 'public' and table_name = 'requests'
   and column_name in ('price_mode','tags')
union all
select 'constraint', conname from pg_constraint
 where conname in ('requests_price_mode_chk','requests_comp_no_budget_chk',
                   'requests_condition_pref_chk','requests_grade_min_chk',
                   'requests_tags_chk')
union all
select 'index', indexname from pg_indexes
 where schemaname = 'public' and indexname = 'requests_tags_idx'
 order by 1, 2;

-- Public browsing must still work. 0018 does not touch policies; this is the
-- paranoia check for the 0002/0015 "requests readable" collision.
select policyname, cmd from pg_policies
 where schemaname = 'public' and tablename = 'requests';

-- Nothing should violate the new shape. Expect zero rows.
select id, title, price_mode, budget_cents, condition_pref, grade_min, tags
  from requests
 where (price_mode = 'comp' and budget_cents is not null)
    or (grade_min is not null and condition_pref is distinct from 'graded')
    or coalesce(array_length(tags, 1), 0) > 3;
