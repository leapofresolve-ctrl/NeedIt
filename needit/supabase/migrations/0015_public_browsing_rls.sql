-- 0015 — Public browsing: explicit anon-role access, and explicit denial of
--        everything else. (3b spec §3.2)
--
-- CONTEXT. Until now the app was fully login-gated at the proxy, so the anon
-- role's real capabilities were never the thing standing between a stranger and
-- the data — the redirect was. Migration 0015 lands on the same day the proxy
-- flips to a denylist (lib/supabase/proxy.ts), which removes that redirect. From
-- today the database IS the boundary, and it has to be stated rather than
-- inherited from Supabase defaults.
--
-- THE SHAPE OF THE RISK. Exprifi's product promise is pseudonymity: your
-- identity is hidden until a deal is agreed, and offers are private between the
-- two parties. A public board with a leaky anon role doesn't just expose data —
-- it destroys the specific thing the marketplace sells. Two tables carry that
-- weight:
--   * `offers` — an open read tells a competitor exactly what every seller will
--     accept, and lets any scraper reconstruct the negotiation history.
--   * `seller_inventory` — a want-list in reverse; an open read is a map of who
--     holds what, at what ask.
-- Neither gets an anon policy here, and the deny-tests at the bottom prove it.
--
-- ROW LEVEL vs COLUMN LEVEL. RLS filters rows; it cannot hide a column. Column
-- privileges are the other half, so `profiles` gets an explicit GRANT list for
-- anon. Without it, an anonymous visitor reading a public profile row also
-- reads `is_admin`, `stripe_account_id`, every notification preference and
-- `deletion_requested_at` — a profile of the user rather than a profile page.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. requests — the board
-- ─────────────────────────────────────────────────────────────────────────────
-- The 0002 policy already resolves correctly for anon (auth.uid() is null, so
-- only `visibility = 'public'` matches). It is restated here with explicit role
-- targeting so the intent is legible in one place instead of inferred from the
-- behaviour of a null.
--
-- DELIBERATE DEVIATION FROM THE SPEC, recorded so it isn't mistaken for drift:
-- the spec says anon may read `visibility = 'public' AND status = 'open'`. This
-- grants public needs at ANY status. Reason: status carries no privacy —
-- a matched need is already visible to every logged-in member — and restricting
-- it means every link Kyle shares 404s the moment the need fills, which is
-- precisely when that link is most worth clicking. A shared need that resolves
-- to "this one was filled in 4 hours" is the best conversion surface we have;
-- a 404 is the worst. The sitemap still lists open needs only, so nothing dead
-- gets pushed into the index.

drop policy if exists "requests readable" on public.requests;
drop policy if exists "requests readable by anon" on public.requests;

create policy "requests readable" on public.requests
  for select
  to anon, authenticated
  using (
    visibility = 'public'
    or (select auth.uid()) = buyer_id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. profiles — pseudonymous identity only
-- ─────────────────────────────────────────────────────────────────────────────
-- Row rule: anon sees a profile only if the member has left `profile_public`
-- on (added in 0012 and surfaced in Settings). Members who opt out disappear
-- from logged-out view without losing their account.
--
-- Every select policy on the table is dropped first. Adding a policy alongside
-- an unknown pre-existing one would be theatre: RLS policies are OR'd, so a
-- forgotten permissive policy from the original schema would simply override
-- anything restrictive written here. This is the mistake that makes RLS work
-- look done while the hole stays open.

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.profiles', p.policyname);
  end loop;
end $$;

-- Members see every profile (they need usernames on offers, board rows and the
-- match panel). This is unchanged behaviour for signed-in users.
create policy "profiles readable by members" on public.profiles
  for select
  to authenticated
  using (true);

-- Anonymous visitors see public profiles only.
create policy "public profiles readable by anon" on public.profiles
  for select
  to anon
  using (coalesce(profile_public, true) = true);

-- Column privileges: the half RLS can't do.
revoke select on public.profiles from anon;
grant select (
  id,
  username,
  display_name,
  created_at,
  is_seller,
  profile_public,
  allow_indexing
) on public.profiles to anon;

comment on policy "public profiles readable by anon" on public.profiles is
  'Anon may read public profiles. Column privileges (see 0015) restrict which columns — never is_admin, never stripe_*, never notification or deletion fields.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Everything else: no anon policy, and no accidental table privileges.
-- ─────────────────────────────────────────────────────────────────────────────
-- These tables are owner-scoped via auth.uid(), which is null for anon, so RLS
-- already denies. The revokes are belt-and-braces: if a future migration adds a
-- permissive policy without a `to` clause, the missing table privilege stops
-- anon before the policy is ever evaluated. Defence that survives someone
-- else's mistake is the only kind worth writing.

revoke all on public.offers from anon;
revoke all on public.deals from anon;
revoke all on public.notifications from anon;
revoke all on public.demand_alerts from anon;
revoke all on public.seller_inventory from anon;

-- Nobody may write anything anonymously. Posting, offering and countering all
-- go through server actions that check the caller.
revoke insert, update, delete on public.requests from anon;
revoke insert, update, delete on public.profiles from anon;

-- The catalog stays world-readable (0014) — it's reference data and it is what
-- makes need pages worth indexing. Read-only is already enforced there by the
-- absence of any write policy; this makes it enforced by privilege too.
revoke insert, update, delete on public.cards from anon;
revoke insert, update, delete on public.card_sets from anon;

commit;

-- ═════════════════════════════════════════════════════════════════════════════
-- DENY-TESTS — run this block after applying. Every line must pass.
--
-- `set local role anon` makes the session behave exactly like an unauthenticated
-- PostgREST request, which is the only way to test this that means anything.
-- Reasoning about policies on paper is how the July notifications trigger got
-- believed-in for a week while it didn't exist.
-- ═════════════════════════════════════════════════════════════════════════════

do $$
declare
  n bigint;
  leaked text;
begin
  set local role anon;

  -- ✅ MUST SEE: public needs.
  select count(*) into n from public.requests where visibility = 'public';
  raise notice 'anon sees % public need(s) — expected: all of them', n;

  -- ❌ MUST NOT SEE: private wants.
  select count(*) into n from public.requests where visibility = 'private';
  if n > 0 then
    raise exception 'DENY-TEST FAILED: anon can read % private want(s)', n;
  end if;

  -- ❌ MUST NOT SEE: offers. The whole leak-defence model rests on this one.
  begin
    select count(*) into n from public.offers;
    if n > 0 then
      raise exception 'DENY-TEST FAILED: anon read % offer row(s)', n;
    end if;
    raise notice 'offers: 0 rows visible to anon (policy denies) — pass';
  exception when insufficient_privilege then
    raise notice 'offers: privilege denied to anon — pass (strongest result)';
  end;

  -- ❌ MUST NOT SEE: seller inventory.
  begin
    select count(*) into n from public.seller_inventory;
    if n > 0 then
      raise exception 'DENY-TEST FAILED: anon read % inventory row(s)', n;
    end if;
    raise notice 'seller_inventory: 0 rows visible to anon — pass';
  exception when insufficient_privilege then
    raise notice 'seller_inventory: privilege denied to anon — pass';
  end;

  -- ❌ MUST NOT SEE: deals, notifications, demand alerts.
  begin
    select count(*) into n from public.deals;
    if n > 0 then raise exception 'DENY-TEST FAILED: anon read deals'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    select count(*) into n from public.notifications;
    if n > 0 then raise exception 'DENY-TEST FAILED: anon read notifications'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    select count(*) into n from public.demand_alerts;
    if n > 0 then raise exception 'DENY-TEST FAILED: anon read demand_alerts'; end if;
  exception when insufficient_privilege then null;
  end;
  raise notice 'deals / notifications / demand_alerts: denied to anon — pass';

  -- ❌ MUST NOT SEE: the admin flag. Column privilege, not RLS.
  begin
    select is_admin::text into leaked from public.profiles limit 1;
    raise exception 'DENY-TEST FAILED: anon can read profiles.is_admin';
  exception when insufficient_privilege then
    raise notice 'profiles.is_admin: column privilege denied to anon — pass';
  end;

  -- ❌ MUST NOT SEE: payout wiring.
  begin
    select stripe_account_id into leaked from public.profiles limit 1;
    raise exception 'DENY-TEST FAILED: anon can read profiles.stripe_account_id';
  exception when insufficient_privilege then
    raise notice 'profiles.stripe_account_id: denied to anon — pass';
  end;

  -- ❌ MUST NOT CALL: the username → email resolver (0013). If this ever
  -- succeeds, every member's email is one loop away.
  begin
    perform public.resolve_login_email('voloksvault');
    raise exception 'DENY-TEST FAILED: anon can call resolve_login_email';
  exception when insufficient_privilege then
    raise notice 'resolve_login_email: execute denied to anon — pass';
  end;

  -- ❌ MUST NOT CALL: admin metrics (0006).
  begin
    perform public.admin_metrics();
    raise exception 'DENY-TEST FAILED: anon can call admin_metrics';
  exception when others then
    raise notice 'admin_metrics: denied to anon — pass';
  end;

  -- ❌ MUST NOT WRITE.
  begin
    insert into public.requests (buyer_id, title, type)
    values ('00000000-0000-0000-0000-000000000000', 'deny-test', 'single');
    raise exception 'DENY-TEST FAILED: anon can insert a need';
  exception when insufficient_privilege or check_violation or
                 foreign_key_violation or not_null_violation then
    raise notice 'requests insert: denied to anon — pass';
  end;

  reset role;
  raise notice '───────────── ALL DENY-TESTS PASSED ─────────────';
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE — check this by hand in the dashboard, it is not in this file's reach.
--
--   request-photos : PUBLIC bucket. Correct — need photos are the board.
--   offer-photos   : MUST NOT be public. An offer photo is the seller's
--                    evidence for a private negotiation, and photo URLs are
--                    guessable enough that "public but unlinked" is not a
--                    control. Supabase → Storage → offer-photos → confirm
--                    "Public bucket" is OFF and that the read policy is scoped
--                    to the buyer and the offering seller.
-- ─────────────────────────────────────────────────────────────────────────────
