-- ============================================================
-- EXPRIFI — migration 0016: provider-agnostic card references
-- Jul 29, 2026.  Run this whole file in the Supabase SQL Editor.
-- Safe to run more than once.
--
-- (Originally drafted as "0015" in a parallel session; renumbered to 0016 on
-- Jul 29 2026 because 0015 was already taken by 0015_public_browsing_rls.sql.
-- Apply order: 0015 first, then this file. They touch disjoint objects.)
--
-- Depends on 0014 (card_sets, cards, seller_inventory) already applied.
-- ============================================================
--
-- WHY THIS EXISTS
--
-- 0014 gave card_sets and cards a single `(source, source_key)` pair. That
-- assumes exactly one upstream vendor forever. We now know we will likely use
-- two at once — a catalog source and a price source — and may swap either:
--
--   * TCDb        — deepest checklist data, no prices, no images, no search
--                   endpoint, and a licence that forbids persisting their
--                   card attributes (see LICENCE NOTE below)
--   * PriceCharting / SportsCardsPro — real text search, prices in integer
--                   pennies across every grade, daily CSV, $49/mo
--   * CardHedge   — price history + ML forecasting, $500–1,000/mo
--
-- With one source column, adding or swapping a vendor is a migration that
-- touches every table holding a card reference. With this migration it is an
-- INSERT. That is the entire point.
--
-- SHAPE
--
--   card_data_providers  — one row per vendor. Adding a vendor = one INSERT.
--                          Each row also records what that vendor's licence
--                          lets us do, so the rules live next to the data
--                          instead of in a person's memory.
--   card_refs            — (card_id, provider, provider_id). Many per card.
--   card_set_refs        — same, for card_sets.
--
-- Everything else in the app keeps pointing at `cards.id` and `card_sets.id`.
-- Nothing outside these two tables should ever store a vendor's ID again.
--
-- LICENCE NOTE — the rule that is easy to break and expensive to unwind
--
-- TCDb's API License Agreement §3.6(a) permits storing their Record IDs
-- permanently, but permits NO other field to persist outside a 30-day cache
-- (§3.7). §4.6 requires deleting all their Data within 30 days of termination.
--
-- Therefore: a vendor lookup LINKS a card, it never FILLS one. The attributes
-- on `cards` (player, parallel, card_number, set_name) must originate from the
-- buyer's own typing or our own seeding — not copied out of a vendor response —
-- unless that vendor's row below says `allows_attr_storage = true`.
--
-- Get this backwards and cancelling a subscription blanks the card names on
-- your own board. Get it right and cancelling is a DELETE from card_refs while
-- `cards` survives untouched.
--
-- §3.6(c) additionally forbids making Record IDs available in any manner that
-- would let a third party enumerate the vendor's data. That is why card_refs
-- and card_set_refs have RLS enabled with NO policies: service role only, the
-- browser can never read them. Do not add a public select policy to these.
-- ============================================================


-- ===== card_data_providers ==================================================
-- Adding a vendor is an INSERT into this table. The licence columns are not
-- decoration: the ingest job reads them to decide whether it may persist
-- attributes and for how long.
create table if not exists card_data_providers (
  id                  text primary key,                    -- 'pricecharting'
  name                text not null,                       -- 'PriceCharting'
  is_active           boolean not null default false,

  -- May we persist this vendor's descriptive fields (player, set, number,
  -- parallel) in our own tables? False means link-only: store their ID,
  -- re-query at point of need, never copy their text into `cards`.
  allows_attr_storage boolean not null default false,

  -- If attributes may be stored, how long before they must be refreshed or
  -- discarded? Null = indefinite. TCDb = 30 (their §3.7 cache cap).
  attr_retention_days integer check (attr_retention_days is null
                                     or attr_retention_days > 0),

  -- May their record IDs be exposed to unauthenticated clients? Almost always
  -- false — see §3.6(c) note above. Governs RLS decisions, not enforced here.
  allows_public_ids   boolean not null default false,

  -- Free-text: contract status, clause references, open questions.
  notes               text,
  created_at          timestamptz not null default now()
);

-- Seed the four we have actually looked at. Terms marked UNVERIFIED default to
-- the restrictive answer on purpose — the safe default is link-only.
insert into card_data_providers
  (id, name, is_active, allows_attr_storage, attr_retention_days, allows_public_ids, notes)
values
  ('manual', 'Manual / buyer-entered', true, true, null, true,
   'Our own data. Buyer free-text and hand-seeded rows. No third-party licence attaches. This is the default provenance for cards.'),

  ('tcdb', 'Trading Card Database', false, false, 30, false,
   'Token-based, ~$0.005/call unit. Test Mode account provisioned Jul 29 2026. Licence read in full: §3.6(a) Record IDs may persist, no other field may; §3.7 30-day cache cap; §3.4/3.5 no bulk pulling; §4.6 delete all Data within 30 days of termination; §3.14 attribution may be required; §3.15 no ML training; §4.8 audit rights over logs AND architecture. No prices, no images (§2.1). No search endpoint.'),

  ('pricecharting', 'PriceCharting', false, false, null, false,
   'UNVERIFIED — $49/mo Legendary tier. API + daily full CSV. Has real text search (/api/products?q=), prices in integer pennies across every grade. No price history or past sales. ToS not yet reviewed: allows_attr_storage stays false until CSV retention rights are confirmed in writing.'),

  ('sportscardspro', 'SportsCardsPro', false, false, null, false,
   'UNVERIFIED — PriceCharting sister site; sports card data lives here rather than on pricecharting.com. Open question: does one Legendary token cover both, or is this a separate subscription? Separate provider row so the answer can be recorded either way.'),

  ('cardhedge', 'CardHedge AI', false, false, null, false,
   'UNVERIFIED — $500-1,000/mo, commercial agreement, call required before terms are shown. Only source of the three with price history and past sales. Parked: revisit when high-end singles revenue exists.')
on conflict (id) do nothing;


-- ===== card_refs ============================================================
create table if not exists card_refs (
  id             uuid primary key default gen_random_uuid(),
  card_id        uuid not null references cards(id) on delete cascade,
  provider       text not null references card_data_providers(id),
  provider_id    text not null,

  -- Deep link back to the vendor's page, where one exists. Useful for manual
  -- verification during the coverage audit; never shown to members.
  provider_url   text,

  -- How this link was established. 'exact' = matched on a stable key (UPC,
  -- set+number), 'search' = best hit from a text query, 'manual' = a human
  -- confirmed it, 'import' = came in via CSV/bulk load. Anything not 'exact'
  -- or 'manual' should be treated as provisional by the match engine.
  match_method   text not null default 'manual'
                   check (match_method in ('exact','search','manual','import')),

  last_synced_at timestamptz,
  created_at     timestamptz not null default now()
);

do $$
begin
  -- One vendor record maps to at most one of our cards. Without this, a
  -- re-ingest that fuzzy-matches differently silently forks the catalog.
  if not exists (select 1 from pg_constraint where conname = 'card_refs_provider_uniq') then
    alter table card_refs
      add constraint card_refs_provider_uniq unique (provider, provider_id);
  end if;

  -- One reference per vendor per card. Two PriceCharting IDs on the same card
  -- means the catalog has a duplicate that needs merging, not two refs.
  if not exists (select 1 from pg_constraint where conname = 'card_refs_card_provider_uniq') then
    alter table card_refs
      add constraint card_refs_card_provider_uniq unique (card_id, provider);
  end if;
end $$;

create index if not exists card_refs_card_idx     on card_refs (card_id);
create index if not exists card_refs_provider_idx on card_refs (provider, last_synced_at);


-- ===== card_set_refs ========================================================
create table if not exists card_set_refs (
  id             uuid primary key default gen_random_uuid(),
  set_id         uuid not null references card_sets(id) on delete cascade,
  provider       text not null references card_data_providers(id),
  provider_id    text not null,
  provider_url   text,
  last_synced_at timestamptz,
  created_at     timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'card_set_refs_provider_uniq') then
    alter table card_set_refs
      add constraint card_set_refs_provider_uniq unique (provider, provider_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'card_set_refs_set_provider_uniq') then
    alter table card_set_refs
      add constraint card_set_refs_set_provider_uniq unique (set_id, provider);
  end if;
end $$;

create index if not exists card_set_refs_set_idx      on card_set_refs (set_id);
create index if not exists card_set_refs_provider_idx on card_set_refs (provider, last_synced_at);


-- ===== provenance on cards and card_sets ====================================
-- `attr_source` answers: where did THIS row's descriptive text come from? It is
-- the flag that makes the licence rule enforceable instead of aspirational.
--
--   'manual'  — buyer typed it, or we seeded it. Ours. Keep forever.
--   any other — a provider id. Attributes are licensed, and `attrs_expire_at`
--               says when they must be refreshed or blanked.
--
-- Default is 'manual' because that is the only safe assumption and because
-- every row that exists today came from us.
alter table cards
  add column if not exists attr_source     text not null default 'manual'
    references card_data_providers(id),
  add column if not exists attrs_expire_at timestamptz;

alter table card_sets
  add column if not exists attr_source     text not null default 'manual'
    references card_data_providers(id),
  add column if not exists attrs_expire_at timestamptz;

-- Sweep target: licensed attributes past their retention window. A scheduled
-- job refreshes or blanks these. Partial index so it costs nothing until rows
-- actually carry an expiry.
create index if not exists cards_attrs_expiring_idx
  on cards (attrs_expire_at)
  where attrs_expire_at is not null;

create index if not exists card_sets_attrs_expiring_idx
  on card_sets (attrs_expire_at)
  where attrs_expire_at is not null;


-- ===== backfill from the old single-source columns ==========================
-- 0014's (source, source_key) becomes the first row in the new tables. Runs
-- clean on an empty catalog and is idempotent if the catalog is already loaded.
-- Unknown provider strings are skipped rather than silently inserted, so a
-- typo in old data surfaces in the VERIFY output instead of hiding.
insert into card_refs (card_id, provider, provider_id, match_method)
select c.id, c.source, c.source_key, 'import'
  from cards c
  join card_data_providers p on p.id = c.source
 where c.source is not null
   and c.source_key is not null
on conflict (provider, provider_id) do nothing;

insert into card_set_refs (set_id, provider, provider_id)
select s.id, s.source, s.source_key
  from card_sets s
  join card_data_providers p on p.id = s.source
 where s.source is not null
   and s.source_key is not null
on conflict (provider, provider_id) do nothing;


-- ===== RLS ==================================================================
-- Enabled with NO policies: service role only. This is deliberate and is the
-- single most important line in this file.
--
-- TCDb §3.6(c) forbids making their Record IDs available in any manner that
-- would let a third party enumerate or reconstruct their data. A public select
-- policy on card_refs would do exactly that — anyone could walk our board and
-- dump the vendor's ID space. It would also hand a competitor a free mapping
-- between our catalog and theirs.
--
-- Server-side code reaches these tables through the service-role client. The
-- browser never does. Do not add a select policy here without re-reading the
-- provider's agreement.
alter table card_data_providers enable row level security;
alter table card_refs           enable row level security;
alter table card_set_refs       enable row level security;


-- ===== deprecate the old columns ============================================
-- Kept, not dropped: 0014's unique constraints on (source, source_key) are what
-- the not-yet-written ingest upsert would target, and dropping columns in the
-- same migration that replaces them makes rollback ugly. New code must not read
-- or write them. Drop in a later migration once ingest is live on card_refs.
comment on column cards.source is
  'DEPRECATED as of 0016 — use card_refs. Retained only so 0014''s unique constraint survives. Do not read or write from new code.';
comment on column cards.source_key is
  'DEPRECATED as of 0016 — use card_refs.provider_id.';
comment on column card_sets.source is
  'DEPRECATED as of 0016 — use card_set_refs.';
comment on column card_sets.source_key is
  'DEPRECATED as of 0016 — use card_set_refs.provider_id.';


-- ===== comments =============================================================
comment on table card_data_providers is
  'One row per upstream card data vendor. Adding a vendor is an INSERT here, not a migration. The licence columns are read by the ingest job — they are enforcement, not documentation.';
comment on column card_data_providers.allows_attr_storage is
  'False = link-only: store the vendor ID, re-query at point of need, never copy their descriptive text into cards. Defaults false because that is the safe answer when terms are unread.';
comment on column card_data_providers.attr_retention_days is
  'How long stored attributes may persist before refresh or deletion. TCDb = 30 per their §3.7 cache cap. Null = indefinite.';

comment on table card_refs is
  'Maps our cards to vendor record IDs, many providers per card. RLS on with no policies: SERVICE ROLE ONLY. A public read here would let anyone enumerate a licensed vendor''s ID space (TCDb §3.6(c)) and would hand a competitor our catalog mapping for free.';
comment on column card_refs.match_method is
  'How the link was made. Anything other than ''exact'' or ''manual'' is provisional and should not be trusted by the match engine without review.';
comment on table card_set_refs is
  'Vendor record IDs for card_sets. Same service-role-only posture as card_refs.';

comment on column cards.attr_source is
  'Provenance of this row''s descriptive text. ''manual'' = ours, keep forever. Any provider id = licensed, subject to that provider''s retention window in attrs_expire_at.';
comment on column cards.attrs_expire_at is
  'When licensed attributes must be refreshed or blanked. Null for ''manual'' rows. Swept by a scheduled job.';


-- ============================================================
-- VERIFY — run this after the file above and eyeball the output.
-- Expect: 3 tables, 5 provider rows, 4 new columns, 6 indexes,
--         RLS true on all 3 new tables, 0 orphaned sources.
-- ============================================================
select 'table' as kind, tablename as name
  from pg_tables where schemaname = 'public'
   and tablename in ('card_data_providers','card_refs','card_set_refs')
union all
select 'provider', id from card_data_providers
union all
select 'new col', table_name || '.' || column_name
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('cards','card_sets')
   and column_name in ('attr_source','attrs_expire_at')
union all
select 'index', indexname from pg_indexes
 where schemaname = 'public'
   and indexname in ('card_refs_card_idx','card_refs_provider_idx',
                     'card_set_refs_set_idx','card_set_refs_provider_idx',
                     'cards_attrs_expiring_idx','card_sets_attrs_expiring_idx')
order by 1, 2;

-- RLS must be ON for all three, and every one of them must have ZERO policies.
select c.relname,
       c.relrowsecurity              as rls_enabled,
       count(p.policyname)           as policy_count  -- must be 0
  from pg_class c
  left join pg_policies p
         on p.tablename = c.relname and p.schemaname = 'public'
 where c.relname in ('card_data_providers','card_refs','card_set_refs')
 group by c.relname, c.relrowsecurity;

-- Backfill sanity: any legacy source string that is not a known provider did
-- NOT get migrated. Expect zero rows. Non-zero means fix the data, add the
-- provider row, and re-run this file.
select 'cards' as tbl, source, count(*)
  from cards
 where source is not null
   and source not in (select id from card_data_providers)
 group by source
union all
select 'card_sets', source, count(*)
  from card_sets
 where source is not null
   and source not in (select id from card_data_providers)
 group by source;
