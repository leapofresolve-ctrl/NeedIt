-- 0017 — Free-tier limits on seller demand alerts
--
-- 0008 shipped demand alerts as unlimited, instant and specific. That is the
-- substance of what M2 / Lane 1 is meant to sell, given away in the MVP. Kyle's
-- call (Aug 1): keep the feature, trim the free version so the paid one has
-- room. Nothing is taken away from anyone — the free version gets slower,
-- smaller, and deliberately vague.
--
--   FREE  — 3 saved alerts; one email every few days; the email never names the
--           card, it only says there is new matching demand.
--   M2    — unlimited, instant, specific, matched against real inventory.
--
-- The in-app bell is untouched: it is on-site, so it does not spend the
-- "free = you come look" boundary.
--
-- Two changes:
--   1. profiles.last_demand_digest_at — throttle bookkeeping, claimed
--      atomically by the email route so two simultaneous publishes can't both
--      send.
--   2. a BEFORE INSERT trigger capping demand_alerts at 3 per seller. The
--      server action checks this too (for a friendly message), but the action
--      is not the only path to an insert and the limit is a business rule, so
--      it belongs in the database.
--
-- Safe to re-run.

-- ===== 1. Throttle bookkeeping =============================================

alter table profiles
  add column if not exists last_demand_digest_at timestamptz;

comment on column profiles.last_demand_digest_at is
  'Last time a demand-alert email was sent to this seller. Claimed atomically by /api/notifications/email to enforce the free-tier cadence. Null = never sent.';

-- ===== 2. Free alert cap ===================================================

create or replace function public.enforce_free_alert_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing int;
begin
  select count(*) into existing
  from public.demand_alerts
  where seller_id = NEW.seller_id;

  -- Keep this number in sync with FREE_ALERT_LIMIT in lib/alerts.ts.
  if existing >= 3 then
    raise exception 'FREE_ALERT_LIMIT'
      using hint = 'Free accounts can keep up to 3 demand alerts. Delete one to add another.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists demand_alerts_free_limit on demand_alerts;
create trigger demand_alerts_free_limit
  before insert on demand_alerts
  for each row execute function public.enforce_free_alert_limit();

-- ===== 3. Verify ===========================================================
-- Existing sellers already over the cap are left alone deliberately: the
-- trigger only blocks NEW inserts, so nobody loses an alert they already have.
-- They simply can't add a fourth until they delete one.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'last_demand_digest_at'
  ) then
    raise exception 'MIGRATION 0017 FAILED: profiles.last_demand_digest_at missing';
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'demand_alerts_free_limit'
  ) then
    raise exception 'MIGRATION 0017 FAILED: demand_alerts_free_limit trigger missing';
  end if;
end $$;
