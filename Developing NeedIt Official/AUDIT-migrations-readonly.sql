-- Exprifi — read-only migration audit
-- Aug 1, 2026. Paste into the Supabase SQL editor and run the whole thing.
--
-- READ-ONLY. No DDL, no DML, no role changes. Safe to run any time, on production.
-- Purpose: prove that what the live database actually contains matches the
-- migration ledger in build-log.md. The ledger is a claim; this is evidence.
--
-- Read every row of every result. A missing object is the failure mode this
-- project has hit three times (0003 functions, 0004 trigger, 0017 pending) —
-- always because a migration was run in parts and believed complete.

-- ============================================================
-- 1. TABLES — expect all of these to be present
-- ============================================================
select 'TABLE' as kind, tablename as name, rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;

-- Expected (0002–0017): card_refs, card_set_refs, card_sets, cards,
-- card_data_providers, deals, demand_alerts, notifications, offers, profiles,
-- requests, seller_inventory, stripe_events.
-- rls_enabled must be TRUE on every one of them. A false here is a leak.

-- ============================================================
-- 2. THE 0017 QUESTION — is the free-alert migration actually run?
-- ============================================================
-- NOTE (corrected after reading 0017 on disk): the build-log ledger says 0017
-- adds profiles.notify_demand_match. It does not — that column shipped in
-- 0012_account_settings and is already live. 0017 adds ONLY
-- last_demand_digest_at plus the cap function and trigger. So the first count
-- below will read 1 whether or not 0017 has run; the last three are the ones
-- that actually answer the question.
select
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name='notify_demand_match')      as from_0012_not_0017,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='profiles'
       and column_name='last_demand_digest_at')    as has_last_demand_digest_at,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='enforce_free_alert_limit')
                                                    as has_limit_function,
  (select count(*) from pg_trigger
     where not tgisinternal and tgname ilike '%free_alert%')
                                                    as has_limit_trigger;

-- All four must be 1. If the columns are 1 but the function/trigger are 0,
-- that is EXACTLY the run-in-parts failure from 0003 and 0004 — the feature
-- will appear to work and silently enforce nothing.

-- ============================================================
-- 3. FUNCTIONS — every SECURITY DEFINER function the app depends on
-- ============================================================
select p.proname as function_name,
       p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- Expect at minimum: accept_offer, decline_offer, counter_offer,
-- notify_offer_change, notify_demand_match, offers_count_sync,
-- admin_metrics, resolve_login_email, handle_new_user,
-- enforce_free_alert_limit (0017), plus the card_sets_name_resync /
-- cards_set_name_fill pair from 0014.
-- security_definer must be TRUE on accept/decline/counter, admin_metrics,
-- resolve_login_email and both notify_* functions.

-- ============================================================
-- 4. TRIGGERS — the objects most often missing
-- ============================================================
select c.relname as on_table, t.tgname as trigger_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
order by c.relname, t.tgname;

-- ============================================================
-- 5. RLS POLICIES — full inventory, and the 0015 profiles question
-- ============================================================
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- Specifically check:
--   * profiles SELECT policies — 0015 dropped ALL of them and rebuilt two.
--     If a third exists, something re-added it and it OR's in permissively.
--   * profiles INSERT/UPDATE ("own") from 0011 must still be present —
--     onboarding is load-bearing on them.
--   * card_refs / card_set_refs should have RLS enabled and ZERO policies
--     (service-role only, by design).
--   * seller_inventory must be owner-only on all four verbs.

-- ============================================================
-- 5b. THE 0002/0015 COLLISION — which version of "requests readable" is live?
-- ============================================================
select policyname, roles, cmd
from pg_policies
where schemaname='public' and tablename='requests' and policyname='requests readable';

-- roles MUST include anon. Both 0002 and 0015 create a policy of this exact
-- name; 0015's version is the one that grants anonymous read. If roles reads
-- {authenticated} only, migration 0002 was re-run after 0015 and public
-- browsing is silently OFF — the logged-out board renders empty and the
-- sitemap points at pages nobody can load.

-- ============================================================
-- 6. COLUMN PRIVILEGES — 0015's real teeth
-- ============================================================
select table_name, grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon','authenticated')
  and table_name = 'profiles'
order by grantee, column_name;

-- anon must appear ONLY for: id, username, display_name, created_at,
-- is_seller, profile_public, allow_indexing.
-- If anon has select on is_admin, stripe_account_id, any notify_* column or
-- deletion_requested_at, migration 0015's grant block did not fully apply.
-- RLS filters rows; it cannot hide columns. This is the check that matters.

-- ============================================================
-- 7. ANON TABLE-LEVEL ACCESS — should be empty for the private tables
-- ============================================================
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in ('offers','deals','notifications','demand_alerts',
                     'seller_inventory','stripe_events','card_refs',
                     'card_set_refs')
order by table_name, privilege_type;

-- Expect ZERO ROWS. Any row here is a hole 0015 was written to close.

-- ============================================================
-- 8. WEBHOOK PIPELINE HEALTH — the seam that has failed twice
-- ============================================================
select status_code, count(*) as calls,
       min(created) as first_seen, max(created) as last_seen
from net._http_response
where created > now() - interval '14 days'
group by status_code
order by calls desc;

-- Any 404 = a stale host in a Supabase Database Webhook (the Aug 1 outage).
-- Any 401 = a secret mismatch between the webhook header and Vercel env.
-- Any 307 = an allowlist proxy has been redeployed. That one is an emergency.

-- ============================================================
-- 9. BOARD STATE — for the seeding gate
-- ============================================================
select
  count(*) filter (where visibility='public' and status='open') as live_needs,
  count(*) filter (where visibility='private')                  as private_wants,
  count(*)                                                      as all_requests
from requests;
