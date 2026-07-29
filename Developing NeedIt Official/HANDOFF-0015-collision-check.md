# Handoff prompt — reconcile a possible duplicate migration 0015

Copy everything below the line into a fresh Cowork chat. It is written to be
self-contained for someone with zero context.

---

## Task

I may have two Cowork sessions that each wrote a migration numbered **0015** for
my Supabase project. I need you to find out, tell me what collided, and fix the
numbering — **without applying anything to the database.**

**Do not run any SQL. Do not modify `RUN-THIS-IN-SUPABASE.sql`. Do not delete any
file.** Read first, report, then wait for my go-ahead before renaming or editing
anything.

## Project context

- Product: **Exprifi** (internal codename "needit") — a reverse marketplace for
  sports cards. Buyers post the card or lot they want; sellers bring it to them.
- Stack: Next.js App Router + TypeScript on Vercel, Supabase (Postgres / Auth /
  RLS / Storage) via `@supabase/ssr`, Tailwind + shadcn/ui.
- Working folder: `~/Desktop/NeedIt/Developing NeedIt Official`. **Mount
  `~/Desktop/NeedIt` first** — if you don't, the app code is unreachable.
- Money is always integer cents. Never put a secret key in a `NEXT_PUBLIC_` var.

## Migration convention in this project

There is **no `migrations/` directory and no Supabase CLI workflow.** SQL is
written to a `.sql` file in the working folder and pasted by hand into the
Supabase SQL Editor. Files are numbered by prefix (0012, 0013, 0014, …) and every
file is written to be **safe to re-run** (`if not exists`, `on conflict do
nothing`, conditional constraint blocks, and a `VERIFY` query at the bottom).

Known history:

- `RUN-THIS-IN-SUPABASE.sql` bundles **0012** (account settings), **0013**
  (username-or-email sign-in) and **0014** (card catalog foundation).
- **0014** created `card_sets`, `cards`, `seller_inventory`, and added
  `requests.card_id` + `requests.grade_min`. `cards` and `card_sets` each got a
  single `(source, source_key)` unique pair.

## What the OTHER session (this one, on Jul 29 2026) produced

File: **`0015-card-refs.sql`** in the working folder. Purpose: replace 0014's
single-vendor `(source, source_key)` assumption with a provider-agnostic
reference layer, so adding or swapping a card-data vendor is an INSERT rather
than a migration. It contains:

1. **`card_data_providers`** — one row per upstream vendor, seeded with
   `manual`, `tcdb`, `pricecharting`, `sportscardspro`, `cardhedge`. Carries
   licence columns (`allows_attr_storage`, `attr_retention_days`,
   `allows_public_ids`) that the future ingest job reads.
2. **`card_refs`** — `(card_id, provider, provider_id)`, plus `provider_url`,
   `match_method`, `last_synced_at`. Unique on `(provider, provider_id)` and on
   `(card_id, provider)`.
3. **`card_set_refs`** — the same, for `card_sets`.
4. **`cards.attr_source` + `cards.attrs_expire_at`**, and the same two columns
   on `card_sets`, both FK'd to `card_data_providers(id)`, defaulting to
   `'manual'`. Partial indexes on the expiry columns.
5. **Backfill** of 0014's `(source, source_key)` into the new ref tables.
6. **RLS enabled with ZERO policies** on all three new tables — service role
   only, deliberately. TCDb's API licence §3.6(c) forbids exposing their record
   IDs in any way that lets a third party enumerate their data, and a public
   read would also hand a competitor a free mapping between our catalog and
   theirs. The `VERIFY` block asserts policy count is 0.
7. **Deprecation comments** on `cards.source`, `cards.source_key`,
   `card_sets.source`, `card_sets.source_key` — kept, not dropped, so 0014's
   unique constraints survive until the ingest job is live.

## What I need from you

1. **Mount `~/Desktop/NeedIt`** and list every `.sql` file in the working folder
   and any subfolders, with modification timestamps. Identify every file whose
   prefix is `0015` or higher, and anything that looks like a migration but
   isn't prefixed.
2. **If the repo is under git**, check `git status` and `git log` for recently
   added or modified `.sql` files — the other session may have written into the
   app repo rather than the docs folder.
3. **Read each candidate 0015 in full** and report, per file: what tables,
   columns, indexes, constraints, policies, and functions it creates or alters.
4. **Report the collision precisely.** I need to know which of these it is:
   - **Same intent, two drafts** — both are the ref-table migration. Pick the
     better one, tell me what the loser has that the winner lacks, and propose a
     merge.
   - **Different intent, same number** — two unrelated migrations both called
     0015. Renumber the later one to 0016 and tell me the correct apply order.
   - **Actual conflict** — both touch the same table, column, or constraint in
     incompatible ways (e.g. one drops `cards.source` while the other relies on
     it, or one adds an RLS policy to a table the other deliberately leaves
     policy-free). Flag every specific clash. **This is the case that can
     actually break things, so look for it hardest.**
5. **Tell me whether either has already been applied.** This is the crux —
   renaming a file is cosmetic, but if one version already ran against Supabase
   then the other may fail or, worse, half-succeed. Give me a **read-only**
   query I can paste into the Supabase SQL Editor that reports which of these
   objects currently exist: tables `card_data_providers`, `card_refs`,
   `card_set_refs`; columns `cards.attr_source`, `cards.attrs_expire_at`,
   `card_sets.attr_source`, `card_sets.attrs_expire_at`; and the policy count on
   each new table. Do not write anything.
6. **Then stop and give me a short reconciliation plan** — which file wins, what
   gets renumbered to what, what needs merging, and what I should run and in
   what order. Wait for my approval before touching a single file.

## Guardrails

- Build vertical slices end-to-end before polishing.
- Talk me out of adding escrow, catalog ingest, or Lane 1 (instant price-match)
  before Lane 2 (the open request board) has proven liquidity. The board is
  currently at zero posts and launch is targeted at **Sep 26, 2026**. Schema
  groundwork is fine; ingest, pickers, and match engines are not the priority.
- If you think both files should be thrown away and rewritten as one, say so
  plainly — but say why, and don't do it unasked.
