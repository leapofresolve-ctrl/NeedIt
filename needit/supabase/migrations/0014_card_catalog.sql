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
