-- ============================================================
-- EXPRIFI — run this whole file in the Supabase SQL Editor.
-- Combines migrations 0012 + 0013 (Jul 27, 2026) + 0014 (Jul 28, 2026).
-- Safe to run more than once.
-- ============================================================

-- 0012 — Account settings (3b)
--
-- Settings was a single "email me about activity" checkbox. This adds the
-- columns behind a real settings surface: identity, per-event notification
-- control, buying/selling defaults, privacy, and a safe account-closure path.
--
-- Design notes:
--  * Per-event notification prefs are individual boolean columns rather than a
--    jsonb blob, so they're cheap to filter on from the notification triggers
--    and can't drift into malformed shapes.
--  * `email_notifications` is retained as the master switch. An event email
--    sends only when the master switch AND the per-event switch are on, so the
--    existing opt-out keeps working exactly as it does today.
--  * Account deletion is a *request* with a grace period, not an immediate
--    hard delete: the account deactivates at once (profile hidden, needs
--    pulled from the board) but the row survives long enough to undo a
--    mistake or resolve a deal that was in flight.

alter table public.profiles
  -- Identity
  add column if not exists display_name          text,
  add column if not exists username_changed_at   timestamptz,

  -- Account type: one account always; "seller" is a reversible upgrade, never
  -- a separate signup path. See exprifi-3b-facelift-and-access-spec.md §4.2.
  add column if not exists is_seller             boolean not null default false,

  -- Per-event email notifications (gated by email_notifications master switch)
  add column if not exists notify_offer_received boolean not null default true,
  add column if not exists notify_counter        boolean not null default true,
  add column if not exists notify_your_move      boolean not null default true,
  add column if not exists notify_offer_decided  boolean not null default true,
  add column if not exists notify_match          boolean not null default true,
  add column if not exists notify_demand_match   boolean not null default true,
  add column if not exists notify_expiring       boolean not null default true,
  add column if not exists notify_digest         boolean not null default true,
  add column if not exists notify_product        boolean not null default false,

  -- Buying defaults (prefill the post-a-need form)
  add column if not exists default_expiry_hours  integer,
  add column if not exists default_sport         text,
  add column if not exists default_private       boolean not null default false,

  -- Selling profile
  add column if not exists ships_from_state      text,
  add column if not exists handling_time_days    integer,

  -- Privacy
  add column if not exists profile_public        boolean not null default true,
  add column if not exists allow_indexing        boolean not null default true,

  -- Account closure (grace period, see note above)
  add column if not exists deletion_requested_at timestamptz;

-- Guard rails on the free-text/numeric fields. Named constraints added
-- conditionally so this migration stays re-runnable.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_len') then
    alter table public.profiles
      add constraint profiles_display_name_len
      check (display_name is null or char_length(display_name) between 1 and 40);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_default_expiry_valid') then
    alter table public.profiles
      add constraint profiles_default_expiry_valid
      check (default_expiry_hours is null or default_expiry_hours in (24, 72, 168));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_handling_time_valid') then
    alter table public.profiles
      add constraint profiles_handling_time_valid
      check (handling_time_days is null or handling_time_days between 1 and 30);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_ships_from_len') then
    alter table public.profiles
      add constraint profiles_ships_from_len
      check (ships_from_state is null or char_length(ships_from_state) <= 40);
  end if;
end $$;

-- Deactivated accounts must disappear from public surfaces immediately, even
-- though the row is retained through the grace period.
create index if not exists profiles_deletion_requested_idx
  on public.profiles (deletion_requested_at)
  where deletion_requested_at is not null;

comment on column public.profiles.is_seller is
  'Seller mode. One account always does both; this only gates seller tooling and the Pro upgrade path.';
comment on column public.profiles.deletion_requested_at is
  'Set when the member closes their account. Account is deactivated immediately; hard deletion happens after the grace period.';
comment on column public.profiles.username_changed_at is
  'Last username change. Enforces the 30-day cooldown — usernames are the trust anchor and silent swapping is a scam vector.';


-- 0013 — Sign in with username OR email (3b)
--
-- Supabase Auth is keyed on email, so signing in with a username needs a
-- username → email resolver. This is trivially easy to build as an accidental
-- data breach, so the guard rails below are not optional.
--
-- THREAT: an unauthenticated caller invokes the resolver in a loop with common
-- usernames and walks away with an email list for every member on the platform.
-- On a marketplace whose entire premise is pseudonymity — where the whole point
-- is that your identity is hidden until a deal is agreed — that is the single
-- worst leak available.
--
-- DEFENCES, all three required:
--   1. SECURITY DEFINER with a pinned empty search_path (our standing pattern).
--   2. EXECUTE revoked from anon AND authenticated. The only caller is the
--      server action, going through the service-role client. The browser can
--      never reach this function.
--   3. The calling action returns an identical message and burns identical time
--      whether the username is unknown or the password is wrong, so failures
--      are indistinguishable. Rate limiting lives with the action.

create or replace function public.resolve_login_email(identifier text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(identifier))
    and p.deletion_requested_at is null
  limit 1;
$$;

comment on function public.resolve_login_email(text) is
  'Username → email for sign-in. SERVER-SIDE ONLY: execute is revoked from anon and authenticated. Exposing this to the browser turns it into a member email-enumeration endpoint.';

-- Lock it down. `public` is included because Postgres grants EXECUTE to PUBLIC
-- on new functions by default — without this revoke, the two below are moot.
revoke all on function public.resolve_login_email(text) from public;
revoke all on function public.resolve_login_email(text) from anon;
revoke all on function public.resolve_login_email(text) from authenticated;

-- Case-insensitive uniqueness on usernames. Without this, "Kyle" and "kyle"
-- can both exist and the resolver's lower() match becomes ambiguous — which is
-- also a straightforward impersonation vector.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));


-- ============================================================
-- 0014 — Card catalog foundation (Jul 28, 2026)
-- Schema only. No ingest, no UI, no match engine.
-- ============================================================

-- 0014 — Card catalog foundation (Lane 1 groundwork)
--
-- SCHEMA ONLY. No ingest, no third-party API/CSV logic, no picker UI, no
-- inventory UI, no match engine. Every one of those is gated on the pending
-- licensing confirmation and later build phases. See
-- card-catalog-and-automatch-spec.md §2.
--
-- Three tables plus two nullable columns on `requests`:
--  * card_sets  — a release (2021 Topps Chrome Baseball). Identified upstream
--                 by (source, source_key) so re-ingest upserts instead of
--                 duplicating.
--  * cards      — one row per printed card. A parallel is its OWN row, not a
--                 flag: a Gold /50 is a different object with a different
--                 price than the base card, and matching has to treat it that
--                 way.
--  * seller_inventory — what a seller physically has, with an ask in integer
--                 cents. Locked down hard (see RLS note at the bottom).
--
-- ⚠️ Run this WHOLE file in the SQL Editor, then verify the tables, the three
-- indexes, and the policies. (Recurring gotcha: partially-run migrations leave
-- tables without their triggers/indexes.)

-- ===== Extensions ===========================================================
-- pg_trgm powers the player-name autocomplete. Supabase installs extensions
-- into the `extensions` schema; if it's already present elsewhere we leave it
-- where it is and resolve the operator class dynamically further down.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    if exists (select 1 from pg_namespace where nspname = 'extensions') then
      execute 'create extension pg_trgm with schema extensions';
    else
      execute 'create extension pg_trgm';
    end if;
  end if;
end $$;

-- ===== card_sets ============================================================
create table if not exists card_sets (
  id         uuid primary key default gen_random_uuid(),
  sport      text,
  year       int,
  brand      text,                                  -- Topps, Panini, Upper Deck…
  name       text,                                  -- "Chrome", "Prizm Draft Picks"
  source     text,                                  -- which feed this came from
  source_key text,                                  -- that feed's stable id
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'card_sets_source_key_uniq') then
    alter table card_sets
      add constraint card_sets_source_key_uniq unique (source, source_key);
  end if;
end $$;

create index if not exists card_sets_sport_year_idx on card_sets (sport, year);

-- ===== cards ================================================================
-- `set_name` is a DENORMALIZED copy of card_sets.name. It exists only because
-- a generated column can't reach another table, and the search vector has to
-- include the set name ("2021 chrome trout" must find the card). It is kept in
-- sync by the trigger below — treat card_sets.name as canonical and never
-- write set_name by hand.
create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  set_id      uuid not null references card_sets(id) on delete cascade,
  card_number text,
  player      text,
  parallel    text,                                 -- null = base card
  print_run   int,                                  -- null = unserialized
  set_name    text,                                 -- denormalized, see above
  attrs       jsonb not null default '{}'::jsonb,   -- rookie flag, auto/relic, etc.
  search      tsvector generated always as (
                setweight(to_tsvector('simple', coalesce(player, '')),      'A') ||
                setweight(to_tsvector('simple', coalesce(parallel, '')),    'B') ||
                setweight(to_tsvector('simple', coalesce(card_number, '')), 'B') ||
                setweight(to_tsvector('simple', coalesce(set_name, '')),    'C')
              ) stored,
  source      text,
  source_key  text,
  created_at  timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cards_source_key_uniq') then
    alter table cards
      add constraint cards_source_key_uniq unique (source, source_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'cards_print_run_positive') then
    alter table cards
      add constraint cards_print_run_positive
      check (print_run is null or print_run > 0);
  end if;
end $$;

create index if not exists cards_set_idx on cards (set_id);

-- Full-text search over the generated vector.
create index if not exists cards_search_idx on cards using gin (search);

-- Trigram index for typeahead on player names. gin_trgm_ops lives wherever
-- pg_trgm was installed, so schema-qualify it from the catalog rather than
-- assuming `public` or `extensions`.
do $$
declare
  trgm_schema text;
begin
  select n.nspname into trgm_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pg_trgm';

  execute format(
    'create index if not exists cards_player_trgm_idx on cards using gin (player %I.gin_trgm_ops)',
    trgm_schema
  );
end $$;

-- Keep the denormalized set_name honest.
create or replace function cards_sync_set_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if TG_TABLE_NAME = 'cards' then
    select s.name into NEW.set_name from public.card_sets s where s.id = NEW.set_id;
    return NEW;
  else
    update public.cards set set_name = NEW.name
      where set_id = NEW.id and set_name is distinct from NEW.name;
    return null;
  end if;
end;
$fn$;

drop trigger if exists cards_set_name_fill on cards;
create trigger cards_set_name_fill
  before insert or update of set_id on cards
  for each row execute function cards_sync_set_name();

drop trigger if exists card_sets_name_resync on card_sets;
create trigger card_sets_name_resync
  after update of name on card_sets
  for each row execute function cards_sync_set_name();

-- ===== seller_inventory =====================================================
-- Money is integer cents. Never floats. (Locked project rule.)
create table if not exists seller_inventory (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references profiles(id) on delete cascade,
  card_id       uuid not null references cards(id) on delete cascade,
  grade_company text,                               -- PSA, BGS, SGC… null = raw
  grade         text,                               -- '10', '9.5' — text, half grades
  condition     text,                               -- raw condition when ungraded
  ask_cents     int not null check (ask_cents >= 0),
  qty           int not null default 1 check (qty > 0),
  status        text not null default 'available'
                  check (status in ('available', 'claimed', 'sold', 'withdrawn')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists seller_inventory_seller_idx on seller_inventory (seller_id);

-- The future match scan: given a card, find available copies cheapest-first.
create index if not exists seller_inventory_match_idx
  on seller_inventory (card_id, status, ask_cents);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  NEW.updated_at = now();
  return NEW;
end;
$fn$;

drop trigger if exists seller_inventory_touch on seller_inventory;
create trigger seller_inventory_touch
  before update on seller_inventory
  for each row execute function set_updated_at();

-- ===== requests: optional link to a catalog card =============================
-- Nullable on purpose. Bulk lots and oddballs never map to a catalog row and
-- stay free-text — that's Lane 2 and it isn't going anywhere.
alter table requests
  add column if not exists card_id   uuid references cards(id) on delete set null,
  add column if not exists grade_min text;

create index if not exists requests_card_idx on requests (card_id) where card_id is not null;

-- ===== RLS ==================================================================
-- Catalog: world-readable, client-unwritable. Reference data everyone needs to
-- search, including logged-out visitors on public board pages. No insert/
-- update/delete policies exist, so writes are only possible via the service
-- role (i.e. the future ingest job).
alter table card_sets enable row level security;
alter table cards     enable row level security;

drop policy if exists "card sets are public" on card_sets;
create policy "card sets are public" on card_sets
  for select using (true);

drop policy if exists "cards are public" on cards;
create policy "cards are public" on cards
  for select using (true);

-- Seller inventory: owner-only, all four verbs. This is deliberate leak
-- defense, not caution — a seller's inventory is a want-list in reverse, and
-- an open read would let anyone scrape who holds what and at what ask. Buyers
-- must only ever see inventory through the (not-yet-built) match engine, which
-- will surface a single matched result via SECURITY DEFINER. Nothing should
-- ever query this table cross-user directly.
alter table seller_inventory enable row level security;

drop policy if exists "own inventory select" on seller_inventory;
create policy "own inventory select" on seller_inventory
  for select using ((select auth.uid()) = seller_id);

drop policy if exists "own inventory insert" on seller_inventory;
create policy "own inventory insert" on seller_inventory
  for insert with check ((select auth.uid()) = seller_id);

drop policy if exists "own inventory update" on seller_inventory;
create policy "own inventory update" on seller_inventory
  for update using ((select auth.uid()) = seller_id)
  with check ((select auth.uid()) = seller_id);

drop policy if exists "own inventory delete" on seller_inventory;
create policy "own inventory delete" on seller_inventory
  for delete using ((select auth.uid()) = seller_id);

-- ===== Comments =============================================================
comment on table  cards is
  'Canonical card checklist. One row per printed card; each parallel is its own row.';
comment on column cards.set_name is
  'Denormalized copy of card_sets.name so the generated search vector can include it. Maintained by trigger — card_sets.name is canonical.';
comment on column cards.attrs is
  'Open-ended per-card facts (rookie, auto, relic, variation notes) that are not worth a column each.';
comment on table  seller_inventory is
  'What a seller holds. Owner-only by RLS: inventory is a reverse want-list and must reach buyers only through the match engine.';
comment on column seller_inventory.ask_cents is
  'Integer cents. Never floats.';
comment on column requests.card_id is
  'Optional link to a catalog card. Null for bulk lots and free-text needs, which remain first-class.';


-- ============================================================
-- VERIFY — run this after the file above and eyeball the output.
-- Expect: 3 tables, 2 request columns, 6 indexes, 6 policies.
-- ============================================================
select 'table' as kind, tablename as name
  from pg_tables where schemaname='public'
   and tablename in ('card_sets','cards','seller_inventory')
union all
select 'requests col', column_name
  from information_schema.columns
 where table_schema='public' and table_name='requests'
   and column_name in ('card_id','grade_min')
union all
select 'index', indexname from pg_indexes
 where schemaname='public'
   and indexname in ('cards_search_idx','cards_player_trgm_idx',
                     'seller_inventory_match_idx','cards_set_idx',
                     'card_sets_sport_year_idx','requests_card_idx')
union all
select 'policy', policyname from pg_policies
 where schemaname='public'
   and tablename in ('card_sets','cards','seller_inventory')
order by 1,2;

-- RLS must be ON for all three.
select relname, relrowsecurity from pg_class
 where relname in ('card_sets','cards','seller_inventory');
