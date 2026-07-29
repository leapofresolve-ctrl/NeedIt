# Card catalog + auto-match spec (Lane 1 foundation)

One-line goal: a canonical card database inside Exprifi so sellers can list inventory and the system can auto-match it against buyer needs — with the catalog built NOW (Kyle's call, Jul 27 2026) and the matching *product* still gated on the Sep 14 liquidity gate.

## Classification
Track: feature (integration-heavy). Parked: escrow/payments (M3), semantic bulk matching (later roadmap item).

## Prioritization decision (Kyle, Jul 27 2026)
Kyle wants the app to launch at "full go, not half capacity" (user). The catalog moves UP the priority list. The honest reconciliation with the locked "earn Lane 1 with Lane 2" guardrail:

- **Catalog data + ingest is Claude-lane work** — it consumes zero Kyle hours and doesn't compete with the P3 seeding sprint (Aug 25–Sep 14). Safe to pull forward.
- **The card picker on post-a-need ships pre-gate** — it isn't Lane 1; it makes Lane 2 needs *structured*, which is exactly the data auto-matching will need later, and better needs = better seeding.
- **Seller inventory UI ships pre-gate too** (behind `profiles.is_seller`) — sellers stocking their vault before launch means matching has supply on day one.
- **The match engine itself (broadcast → race → final confirm) stays behind the Sep 14 gate.** It's the one piece that's pointless on an empty board and the one piece the guardrail actually protects.

Net: at launch (Sep 26 target) the catalog, picker, and seller vault are live; the matching switch flips as soon as the gate passes — "full go" without betting build-weeks against liquidity that isn't proven yet.

## Current state
- Needs are free-text `title` + coarse facets (`type`, `sport`, `budget_cents`, `condition_pref`) (verified: `app/u/[username]/page.tsx`, `app/page.tsx`).
- No card/catalog tables exist; `demand_alerts` is the closest thing to matching — keyword + facet filters (verified: profile page query).
- Stack: Supabase Postgres w/ RLS, Next.js App Router (verified: repo).

## What "a database of cards" actually requires

### 1. Data source (the hard part — verify before building anything)
Nobody hand-enters a million cards. Options found Jul 2026 (all [assumed: current terms — verify in Phase 1 by contacting each]):

- **SportsCardsPro / PriceCharting** — paid subscription unlocks a token-auth API (1 call/sec) and per-set CSV price lists (Retail tier and up; full CSV dump at Legendary tier). Prices come back as integer pennies, which matches our integer-cents rule exactly. Closest fit found.
- **TCDB (Trading Card Database)** — set listings + checklists by sport/year via API; no player-name search endpoint. Community data; licensing for commercial use must be confirmed in writing.
- **Card Hedge AI** — commercial API, millions of cards, filter by player/year/set/grade with fuzzy matching. Enterprise pricing unknown.
- **Ximilar** — visual AI that identifies cards from photos; a later add-on for "snap a photo → identified card", not a catalog source.

Decision rule: we need **checklist data** (identity: set, year, number, player, parallel) more than price data at first. Price feeds matter at Lane 1 time ("suggest opening offer at cheapest ask" wants comps). Budget one paid source, ingest to our own tables, never hot-serve their API per pageview.

**Image rights landmine:** catalog images from these sources are almost certainly not licensed for our redistribution. Ship the catalog text-only; card photos stay user-uploaded (already our pattern). Do not scrape images.

### 2. Schema (migration `0012_card_catalog.sql`, next free prefix — 0010/0011 both used)
```sql
card_sets(
  id uuid pk, sport text, year int, brand text, name text,
  source text, source_key text, unique(source, source_key)
)
cards(
  id uuid pk, set_id uuid fk, card_number text, player text,
  parallel text null,            -- base row has null; each parallel = own row
  print_run int null, attrs jsonb default '{}',
  search tsvector generated,     -- player + set + number + parallel
  source text, source_key text, unique(source, source_key)
)
seller_inventory(
  id uuid pk, seller_id uuid fk profiles, card_id uuid fk cards,
  grade_company text null, grade text null, condition text null,
  ask_cents int not null check (ask_cents >= 0),
  qty int not null default 1 check (qty > 0),
  status text not null default 'available',  -- available|claimed|sold|withdrawn
  created_at, updated_at
)
-- requests gains: card_id uuid null fk cards, grade_min text null
```
Indexes: GIN on `cards.search` + `pg_trgm` on `player` for autocomplete; `(card_id, status, ask_cents)` on inventory for the match scan. RLS: catalog tables world-readable; `seller_inventory` readable only by owner pre-match (leak defense — inventory is a want-list leak in reverse), surfaced to buyers only through the match flow.

Ingest: staging table per source → normalize (trim, unify parallel naming, dedupe on `(source, source_key)`) → upsert. Rerunnable script in `scripts/`, run on a schedule later.

### 3. Product surfaces (build order)
1. **Card picker on `/post`** — autocomplete against `cards`; picking one fills `requests.card_id` + auto-titles the need. Free-text stays as fallback (bulk lots and oddballs never map to a catalog row — bulk remains pure Lane 2, matching is singles-only by design).
2. **Seller vault** — `/inventory`: add cards via the same picker, set ask (integer cents), grade, qty; CSV import for breakers later. Gated by `is_seller` toggle (3b account model).
3. **Match engine (post-gate)** — the locked Lane 1 mechanic: buyer sets max → scan `seller_inventory` for `card_id` match, grade ≥ min, `ask_cents <= budget_cents` → suggest opening offer at cheapest ask → notify matching sellers (existing notifications + Resend pipeline) → sellers race, first accept claims → **final confirm** (seller re-confirms possession + buyer's final yes) commits atomically.

### 4. The no-double-sell mechanism (load-bearing, per locked decision)
A single SECURITY DEFINER Postgres function per transition, `SELECT … FOR UPDATE` on the inventory row, plus a partial unique index — one live claim per inventory row:
```sql
create unique index one_live_claim on matches(inventory_id)
  where status in ('claimed','confirming');
```
Claim expires (e.g. 15 min) if final confirm doesn't complete; expiry releases the row to the next seller in the race. State machine mirrors the Stripe webhook pattern already built (idempotent transitions, no client-trusted state).

## Out of scope
Escrow/payments wiring (M3) · semantic/bulk matching · price-comp suggestions beyond cheapest-ask (needs price feed maturity) · photo-recognition listing · reviews/trust chips (separate 3a spec item).

## Key decisions
- Catalog is **our own Postgres tables**, sources ingested — never a live third-party dependency in the request path. [assumed — if wrong: nothing; this is the only sane shape]
- Singles-only matching; bulk stays request-board. (user, locked lanes)
- Money integer cents everywhere. (locked)
- Text-only catalog, user-uploaded photos. [assumed: source images unlicensed — if wrong: revisit]

## Risks
- **Licensing/coverage** is the whole ballgame — if the chosen source lacks the junk-wax/bulk-era depth our beachhead crowd hunts, the picker feels broken. Phase 1 is a coverage audit against 50 real cards from Kyle's world before any code.
- Parallel explosion (one card → dozens of parallels) makes the picker overwhelming — default to base card, parallels behind a secondary select.
- Catalog staleness (new releases weekly) — scheduled re-ingest, not one-shot.

## Build phases
- [ ] Phase 1: Pick + verify the data source. Contact SportsCardsPro/PriceCharting (and one backup) for commercial terms; run the 50-card coverage audit; confirm license to store checklist data. Done when: source chosen, terms in writing, coverage ≥ 45/50.
- [ ] Phase 2: Migration 0012 + ingest script; load one sport/era slice end-to-end. Done when: autocomplete query returns the right card for 10 test searches in SQL.
- [ ] Phase 3: Card picker on `/post` (+ `requests.card_id`). Done when: a need posted via picker shows structured card data on the board.
- [ ] Phase 4: Seller vault at `/inventory` behind `is_seller`. Done when: test seller adds 5 cards with asks; RLS deny-test passes for other users.
- [ ] Phase 5 (POST-GATE): match scan + broadcast + race + final-confirm function with the one-live-claim index. Done when: two sellers racing on one card can never both claim it (concurrent test), and an expired claim releases.

Phases 1–2 are pure Claude-lane and can start immediately without touching the launch plan. Phase 3–4 slot into P2 (facelift block, Aug 11–24). Phase 5 waits for Sep 14.
