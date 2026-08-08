# Plan: Rework the Post a Need screen — chip-first form, comp price mode, board tags

**One-line goal:** posting a need on a phone becomes a screen of tappable choices instead of a stack of text boxes and native dropdowns, and two new buyer signals — a verbatim `AT COMP` price and up to three structured tags — appear on the live board where sellers read them.

Date: 2026-08-08. Repo: `~/Desktop/NeedIt/needit`. Target: Milestone 1 (Lane 2), pre-launch.

---

## Classification

**Track:** UI build. The deliverable is judged by looking at and tapping through `/post` on a phone, with a small schema change carried along because two of the new controls need somewhere to live.

**Parked secondary asks, by name:**

- **Wax / sealed as a third `type`.** The mockup showed a three-way `Single · Bulk · Wax` segment. Not built. `type` is constrained to `('single','bulk')` in the app action (verified: `app/post/actions.ts:31`) and in `demand_alerts` (verified: `0008_demand_alerts.sql:16`), and `TYPES` in `lib/board-filters.ts:34` drives the rail. Adding a third value touches the form, the action, the alert table, the rail, the facet counts and the row badge. It is a separate ticket, not a rider on this one.
- **Live board-row preview** (direction C from the mockups). Kyle chose A. Kept as an optional cuttable phase — see Phase 9.
- **Card catalog autocomplete on the title field.** Lane 1 / M2 territory. Untouched.
- **Offer-side condition field.** Sellers still type condition free-text on their offer (verified: `app/request/[id]/actions.ts:103`). Out of scope; this plan only restructures the *buyer's* side.

---

## Interview Ledger

| Q | Fork | Outcome |
|---|---|---|
| Q1 | One screen vs. multi-step flow | Deferred into Q2 once mockups existed |
| Q2 | Direction A (one screen) / B (guided steps) / C (one screen + live row) | **A** — accepted |
| Q3 | Grade as its own two-part control vs. more tags | **Two-part control** — accepted |

Volunteered by Kyle without being asked: "comp" is a **verbatim label with no data behind it**; heavy **phone** posting expected; **camera access** required on photo upload; grade needs an **accessible** spot covering graded/not-graded plus grade numbers.

**Questions spent: 3.** Interview closed early on Kyle's "go for it" — every remaining fork is defaulted and tagged in the Assumptions Ledger below.

---

## Goal & Success Criteria

1. On a 390×844 phone, a buyer can post a complete need — title, photo, kind, sport, price, grade, tags, duration — **without the keyboard opening more than twice** (title, and the price number if they use one).
2. There are **zero native `<select>` elements** left on `/post`. Today there are two (verified: `components/post/post-need-form.tsx:98` sport, `:176` expiry).
3. Tapping "Take photo" on iOS Safari opens the **camera**, not the file browser. Tapping "Choose" opens the library. Both land in the same upload.
4. A buyer who taps **Comp** posts a need with no dollar figure, and the board row renders `AT COMP` in the same slot where `$140 max` would sit.
5. A buyer who picks **Graded → PSA 9+** produces a board chip reading `GRADED · PSA 9+`, and `requests.grade_min` holds `PSA 9+`.
6. Up to **three** tags picked on the form appear as green chips on the board row. A fourth cannot be selected.
7. Every chip group is reachable and operable **with a keyboard alone**, and each group announces its name to a screen reader.
8. Editing an existing need at `/request/[id]/edit` **preserves** tags, price mode and grade — it does not silently blank them.

---

## Current State

- `/post` is a full page rendering `<PostNeedForm/>`, not a modal (verified: `app/post/page.tsx`, 39 lines).
- The form is 8 stacked shadcn fields: title, description textarea, file input, `type` radios, `sport` native select, `budget` number, `condition_pref` free text (60 chars), visibility radios, `expiry` native select (verified: `components/post/post-need-form.tsx`, 202 lines).
- The server action reads those, converts dollars to integer cents, uploads to the `request-photos` bucket, inserts into `requests`, and redirects (verified: `app/post/actions.ts`, 102 lines).
- `requests` today carries: `buyer_id, title, description, type, sport, budget_cents, condition_pref, image_url, status, visibility, expires_at, offer_count, card_id, grade_min` (verified across `0002`, `0007`, `0014` and the insert at `app/post/actions.ts:75`).
- **`grade_min` exists and is dead.** Added by `0014_card_catalog.sql:192`; zero reads or writes anywhere in `app/`, `lib/`, `components/` (verified: repo-wide grep).
- `condition_pref` is free buyer-typed text that renders **directly** as a board chip (verified: `app/page.tsx:496`), as a profile chip (`app/u/[username]/page.tsx:118`), and as a badge on the need detail page (`app/request/[id]/page.tsx:360`). The mobile Refine sheet filters it with `ilike '%…%'` (verified: `app/page.tsx:209`).
- Board row anatomy: type badge → sport chip → condition chip · offer count / title / budget anchor · countdown · @poster (verified: `app/page.tsx:470-539`).
- Price filtering uses `.gte("budget_cents", …)` / `.lte(…)` and "Highest budget" sorts with `nullsFirst: false` (verified: `app/page.tsx:223-238`).
- Latest migration is `0017_free_alert_limits.sql`. Next number is **0018**.
- The board is at **0 open needs** (user, standing context) — so no production data is at risk in this change.

---

## Scope (v1)

Rebuild `components/post/post-need-form.tsx` as direction A — one screen, chip-first, with a collapsed "Add detail" section — plus the matching server-action, schema, board-row and edit-form changes needed to make the new fields real end to end.

### The screen, top to bottom

| Block | Control | Notes |
|---|---|---|
| **What are you after** | Single-line text input | Unchanged behaviour, larger target |
| **Photo** | Two buttons: `Take photo` / `Choose` + thumbnail preview | Camera button hidden on `pointer: fine` |
| **Kind** | Segmented radio: `Single card` · `Bulk lot` | Wax parked |
| **Sport** | Chip radio group, 7 chips (`SPORTS` from `lib/board-filters.ts`) | Plus an implicit "any" = none selected |
| **What you'll pay** | `$` number input **or** a `Comp` toggle chip | Mutually exclusive; picking Comp clears and disables the number |
| **Condition** | Segmented radio: `Any` · `Raw only` · `Graded` | Picking `Graded` reveals the next row |
| **Grade floor** | Chip radio group, revealed only when `Graded` | `PSA 10 · PSA 9+ · PSA 8+ · SGC 9+ · BGS 9.5+ · Any 9+ · Any grade` |
| **Tags** | Chip checkbox group, max 3 | Vocabulary below |
| **Open for** | Segmented radio: `24 hours` · `3 days` · `7 days` | Replaces the native select |
| **Add detail** | `<details>` disclosure | Description textarea · "Save as a private want" toggle |
| **Submit** | Full-width primary button | Label flips to "Save private want" when private |

### Tag vocabulary — locked for v1, ten values

Stored as slugs, rendered as labels. Hobby-native language, per `Board-Reference/glossary.md`.

| Slug | Board label |
|---|---|
| `accepting-multiple` | Accepting multiple |
| `set-building` | Set building |
| `player-collection` | Player collection |
| `team-lot` | Team lot |
| `any-parallel` | Any parallel |
| `numbered-only` | Numbered only |
| `rookies-only` | Rookies only |
| `vintage-only` | Vintage only |
| `low-grade-ok` | Low grade OK |
| `repeat-buyer` | Repeat buyer |

`Raw only` and `Slabs only` are deliberately **not** tags — they are the Condition control. Duplicating them would let a buyer post a contradiction (`Raw only` tag on a `Graded` need).

---

## Out of Scope & Parked Items

- **No board rail filter for tags.** The rail is untouched in this pass. A `tags` GIN index ships so a future rail group is a query change, not a migration. Reason: the rail doesn't even render below 15 open needs (verified: `RAIL_MIN_NEEDS = 15`), and the board is at 0 — a tag facet would be a column of zeros.
- **No comp lookup, no comp number, no vendor call.** "Comp" is a word on a chip. Every card-data provider row is `is_active = false` (verified: `0016_card_refs.sql`), and scraping sold-comps is the live legal risk flagged in `exprifi-3b-addendum-board-filtering.md` §1.2. This design deliberately needs none of it.
- **No new price-filter behaviour for comp needs.** Postgres excludes `NULL` from `>=`/`<=`, so a comp need simply drops out of any price-banded board view and sorts last under "Highest budget" (verified: `app/page.tsx:223-238`). That is the honest answer and needs no code.
- **No changes to offers, counters, deals, notifications, payments, or RLS.**
- **No design-token changes.** 3a is locked.

---

## Approach

Three layers, built bottom-up so each is verifiable before the next sits on it.

1. **Schema (0018).** Two new columns on `requests` — `price_mode` and `tags` — plus check constraints that make illegal states unrepresentable (a comp need can't carry a budget; a grade floor can't exist without `condition_pref = 'graded'`; tags can't exceed three or contain a value outside the vocabulary). `grade_min` is adopted rather than added. `condition_pref` is narrowed from free text to `'raw' | 'graded' | null`.

2. **One accessible chip primitive.** A single `<ChipGroup>` component in `components/ui/chip-group.tsx` renders a `<fieldset>` with a visible `<legend>`, and one visually-hidden `<input type="radio">` or `type="checkbox"` per option wrapped in a `<label>` styled as a chip. This is the same shape the board rail already uses, so keyboard behaviour, focus rings and screen-reader announcement come from the browser rather than from hand-rolled ARIA. Every chip group on the form is an instance of it. *Executor's choice: internal prop naming and file layout.*

3. **Consumers.** The form, the server action, the board row, the profile row, the need detail page and the edit form all read the same three new signals. The edit form is not optional — shipping the post form without it means the first edit blanks a buyer's tags.

Building order is deliberately: schema → primitive → form → action → read surfaces → edit parity. The riskiest assumption (that narrowing `condition_pref` doesn't strand existing rows) is checked in Phase 1 before anything is built on it.

---

## Requirements

| # | Requirement | Acceptance check |
|---|---|---|
| R1 | WHEN the buyer taps **Comp** THE SYSTEM SHALL clear the dollar input, disable it, and submit `price_mode='comp'` with `budget_cents = null`. | Post a comp need; row shows `AT COMP`; DB row has null budget. |
| R2 | WHEN `price_mode='comp'` THE SYSTEM SHALL render the literal text `AT COMP` in the board row's price slot, with no `max` suffix. | Visual check on `/`. |
| R3 | WHEN the buyer selects a 4th tag THE SYSTEM SHALL refuse the selection and leave the first three intact. | Tap 4 chips; only 3 turn green; a hint reads "3 of 3 used". |
| R4 | WHEN `condition_pref='graded'` AND `grade_min` is set THE SYSTEM SHALL render one board chip of the form `GRADED · PSA 9+`. | Visual check. |
| R5 | WHEN `condition_pref='raw'` THE SYSTEM SHALL render one board chip reading `RAW ONLY` and SHALL NOT accept a `grade_min`. | DB constraint rejects the pair. |
| R6 | WHEN the buyer taps **Take photo** on a touch device THE SYSTEM SHALL open the rear camera. | Manual test, iOS Safari + Android Chrome. |
| R7 | WHEN the buyer taps **Choose** THE SYSTEM SHALL open the photo library. | Manual test. |
| R8 | THE SYSTEM SHALL render no `<select>` element on `/post`. | `document.querySelectorAll('select').length === 0`. |
| R9 | WHEN a buyer edits an existing need THE SYSTEM SHALL pre-fill and preserve `tags`, `price_mode`, `condition_pref` and `grade_min`. | Post → edit → save → re-read; all four unchanged. |
| R10 | THE SYSTEM SHALL make every chip group reachable by Tab and selectable by Space/Arrow keys, with a visible focus ring and a group name announced to assistive tech. | Keyboard-only pass; VoiceOver rotor lists each `<legend>`. |
| R11 | THE SYSTEM SHALL reject, server-side, any tag outside the ten-value vocabulary and any tag array longer than three. | Craft a POST with 5 tags; action returns an error; DB constraint is the backstop. |
| R12 | A board row SHALL display at most 2 tag chips inline, with `+N` for the remainder; the need detail page shows all of them. | Post a 3-tag need; row shows 2 chips + `+1`. |

---

## Key Decisions

- **Direction A, one screen** — (user, Q2)
- **"Comp" is a verbatim label with no data behind it** — (user)
- **Grade is a two-part control, not a tag** — (user, Q3)
- **Camera capture on photo upload** — (user)
- **`grade_min` reused rather than a new column** — (verified: `0014_card_catalog.sql:192` and repo-wide grep showing it unused)
- **`condition_pref` narrowed to `'raw' | 'graded' | null`** — [assumed: default narrow it — if wrong: keep it free text and add a separate `condition_mode` column, at the cost of two fields meaning the same thing and a board chip that can still say anything] [A1]
- **Tags as a Postgres `text[]` with a check constraint, not a join table** — [assumed: default `text[]` — if wrong at scale: a `need_tags` join table, but a fixed 10-value vocabulary capped at 3 does not justify a join today] [A2]
- **Tag cap = 3** — [assumed: default 3 — if wrong: raise the constant; the row already carries a type badge, a sport chip and a grade chip, so 3 tags puts a busy row at 6 chips] [A3]
- **Board row shows 2 tags + `+N`** — [assumed: default truncate at 2 — if wrong: show all 3 and let the row wrap on mobile] [A4]
- **Wax deferred** — decision, not omission (see Classification)
- **Visibility and description move into "Add detail"** — [assumed: default collapse both — if wrong: promote visibility back to the main scroll; it is a decision most posters make once] [A5]
- **Expiry stays 24h / 3d / 7d, default 7d** — (verified: `app/post/actions.ts:8-12`), presentation change only

---

## Data & State Changes

Migration **0018**. Paste this whole block into the Supabase SQL editor. It is idempotent.

**Read the danger note first.** The `update` in step 2 **blanks** any `condition_pref` value that isn't already `raw` or `graded` — that is irreversible for those rows. The board is at 0, so this is expected to hit zero or a handful of test rows, but run step 1 alone first and look at the output before running the rest.

```sql
-- ── STEP 1 — LOOK BEFORE YOU LEAP. Run this alone, read the output. ──────────
-- Any row listed here will have its condition_pref BLANKED by step 2.
-- Expect zero rows. If you see rows you care about, stop and copy them out.
select id, title, condition_pref, created_at
  from requests
 where condition_pref is not null
   and condition_pref not in ('raw','graded')
 order by created_at desc;
```

```sql
-- ============================================================
-- 0018 — Post a need: structured tags, comp price mode, grade floor
-- Aug 8 2026. Idempotent — safe to run more than once.
--
-- DOES NOT TOUCH ANY POLICY ON `requests`. Migrations 0002 and 0015 both
-- create a policy named "requests readable"; re-running 0002 silently kills
-- public browsing. Nothing below drops, creates or alters a policy.
-- ============================================================

-- ── 1. New columns ──────────────────────────────────────────────────────────
alter table requests
  add column if not exists price_mode text not null default 'max',
  add column if not exists tags       text[] not null default '{}';

-- ── 2. Normalise condition_pref before constraining it ──────────────────────
-- Free-typed values ("Raw, PSA 9+, any") have no structured equivalent, so
-- they become null rather than a wrong guess. See the STEP 1 query above.
update requests
   set condition_pref = 'raw'
 where lower(trim(condition_pref)) in ('raw','raw only','ungraded');

update requests
   set condition_pref = 'graded'
 where lower(trim(condition_pref)) in ('graded','graded only','slab','slabs','slabs only');

update requests
   set condition_pref = null
 where condition_pref is not null
   and condition_pref not in ('raw','graded');

-- ── 3. Constraints — make illegal states unrepresentable ────────────────────
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'requests_price_mode_chk') then
    alter table requests add constraint requests_price_mode_chk
      check (price_mode in ('max','comp'));
  end if;

  -- A comp need carries no number. That is the whole point of it.
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

  -- Max three tags, and only from the locked vocabulary. The server action
  -- validates too; this is the backstop for anything that isn't the action.
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

-- ── 4. Index — costs nothing today, makes a future tag facet a query change ──
create index if not exists requests_tags_idx on requests using gin (tags);

-- ── 5. Comments ─────────────────────────────────────────────────────────────
comment on column requests.price_mode is
  '''max'' = budget_cents is a ceiling. ''comp'' = the buyer named no number and the row reads AT COMP; sellers propose a price. Verbatim label only — no comp data is fetched, stored or implied.';
comment on column requests.tags is
  'Up to 3 slugs from a locked 10-value vocabulary, rendered as chips on the board row. Adding a value means editing requests_tags_chk AND lib/need-tags.ts — keep them in step.';
comment on column requests.condition_pref is
  'Narrowed from free text to ''raw'' | ''graded'' | null (=any) in 0018. Renders as a board chip; a ''graded'' row may also carry grade_min.';
comment on column requests.grade_min is
  'Grade floor as hobby shorthand (''PSA 9+''). Only valid when condition_pref = ''graded''. Added dead in 0014, first used in 0018.';
```

```sql
-- ── VERIFY — run after the block above. ─────────────────────────────────────
-- Expect: 2 new columns, 5 constraints, 1 index, and 0 rows from the last query.
select 'column' as kind, column_name as name
  from information_schema.columns
 where table_schema='public' and table_name='requests'
   and column_name in ('price_mode','tags')
union all
select 'constraint', conname from pg_constraint
 where conname in ('requests_price_mode_chk','requests_comp_no_budget_chk',
                   'requests_condition_pref_chk','requests_grade_min_chk',
                   'requests_tags_chk')
union all
select 'index', indexname from pg_indexes
 where schemaname='public' and indexname='requests_tags_idx'
order by 1,2;

-- Public browsing must still work. Expect the "requests readable" policy to be
-- present and unchanged — 0018 does not touch it, this is a paranoia check.
select policyname, cmd from pg_policies
 where schemaname='public' and tablename='requests';
```

**Rollback.** Nothing in the app reads the new columns until Phase 4, so reverting is dropping the five constraints, the index and the two columns. The one thing rollback does **not** restore is the free-text `condition_pref` values blanked in step 2 — hence the STEP 1 look-first query.

---

## Interfaces, Integrations & Credentials

- **No external APIs. No new dependencies. No new secrets.** Storage continues to use the existing `request-photos` Supabase bucket via the server action's authenticated client (verified: `app/post/actions.ts:66`).
- **New shared module `lib/need-tags.ts`** — single source for the tag vocabulary, the grade-floor list and the condition values, imported by the form, the action, the board row, the profile row and the detail page. Same pattern and same reasoning as `lib/board-filters.ts`, whose header comment records what happens when a validated list has two copies: "a filter that silently returns nothing."

```ts
export const NEED_TAGS = [
  { slug: "accepting-multiple", label: "Accepting multiple" },
  { slug: "set-building",       label: "Set building" },
  { slug: "player-collection",  label: "Player collection" },
  { slug: "team-lot",           label: "Team lot" },
  { slug: "any-parallel",       label: "Any parallel" },
  { slug: "numbered-only",      label: "Numbered only" },
  { slug: "rookies-only",       label: "Rookies only" },
  { slug: "vintage-only",       label: "Vintage only" },
  { slug: "low-grade-ok",       label: "Low grade OK" },
  { slug: "repeat-buyer",       label: "Repeat buyer" },
] as const;

export const MAX_TAGS = 3;

export const GRADE_FLOORS = [
  "PSA 10", "PSA 9+", "PSA 8+", "SGC 9+", "BGS 9.5+", "Any 9+", "Any grade",
] as const;

export const CONDITIONS = [
  { value: "",       label: "Any" },
  { value: "raw",    label: "Raw only" },
  { value: "graded", label: "Graded" },
] as const;

export const isTag        = (v: string) => NEED_TAGS.some((t) => t.slug === v);
export const isGradeFloor = (v: string) => (GRADE_FLOORS as readonly string[]).includes(v);
export const tagLabel     = (slug: string) =>
  NEED_TAGS.find((t) => t.slug === slug)?.label ?? slug;
```

**The vocabulary now lives in two places** — this file and the `requests_tags_chk` constraint. That is deliberate (the DB is the backstop for any write that isn't the action), and it is the one drift risk in this plan. The column comment on `requests.tags` says so out loud.

---

## Edge Cases & Failure Handling

Default posture: fail loudly with a clear message. No silent coercion.

| Case | Behaviour |
|---|---|
| Comp selected **and** a dollar amount posted (crafted request) | Action returns "Pick a max price or Comp, not both." DB constraint is the backstop. |
| Tag not in the vocabulary | Action drops it silently *only* if it came from a stale client; a full array of unknowns returns "Those tags aren't available." |
| More than 3 tags posted | Action returns "Pick up to 3 tags." |
| `grade_min` sent without `condition_pref='graded'` | Action clears `grade_min`. A raw need has no grade floor. |
| Buyer switches `Graded → Raw` after picking a floor | Client clears the floor and collapses the row; the value never reaches the server. |
| Neither price nor Comp | Allowed. `price_mode='max'`, `budget_cents=null` — same as today. Row shows no price anchor. |
| Photo upload fails | Existing behaviour: "Couldn't upload the image. Please try again." The rest of the form state is preserved by `useActionState`. |
| Image over 8MB or non-image | Existing checks retained verbatim (`app/post/actions.ts:59-63`). Camera photos on modern phones can exceed 8MB — see A6. |
| Board row with 3 tags on a 375px screen | 2 chips + `+1`; full list on the detail page. |
| Legacy need with free-text condition | Blanked by migration step 2 → renders no condition chip. Not an error state. |
| `prefers-reduced-motion` | Chip transitions stay within the 3a rule: 150ms on border/background only, no transform. |

---

## Risks, Landmines & Adaptations

- **Migration 0002/0015 policy collision.** Both create a policy named `"requests readable"`; re-running 0002 kills public browsing. → 0018 contains **no policy statement of any kind**, and the VERIFY block re-lists `pg_policies` on `requests` as a paranoia check.
- **Narrowing `condition_pref` destroys data.** → A look-first `select` is a separate step before the `update`, the two safe mappings (`raw only`→`raw`, `slabs`→`graded`) run before the blanking, and the rollback note states plainly that blanked text does not come back.
- **The mobile Refine sheet filters `condition` with `ilike`** (verified: `app/page.tsx:209`). Once values are `raw`/`graded`, a free-text `?condition=PSA` returns nothing. → Honest, not broken — same posture as the search box's "under 500" case in `exprifi-3b-addendum-board-filtering.md` §2.3a. Converting that input into a two-chip picker is a one-line follow-up on the rail, noted but not built here.
- **Comp needs vanish from price-banded board views.** → Verified as correct-by-default: `.gte`/`.lte` exclude NULL and `order(…, nullsFirst: false)` sinks them. No code needed. Recorded so nobody later "fixes" it.
- **Chip pickers are the classic accessibility regression** — divs with click handlers, invisible to keyboard and screen reader. → Mitigated structurally: `ChipGroup` is a `<fieldset>` + real hidden inputs + `<label>`, so this cannot regress without deleting the primitive. R10 tests it.
- **Editing blanks the new fields.** `edit-need-form.tsx` (183 lines) is a near-copy of the post form and will not know about tags. → Phase 7 is edit parity and is **not** cuttable.
- **Camera photos are large.** iPhone HEIC/JPEG frequently exceeds the existing 8MB cap. → See A6; client-side downscale before upload is Phase 5's second step.
- **This is polish while the board is at 0.** Guardrail check: it is the funnel *for* the thing at 0, and Kyle's standing preference is fix-on-sight rather than defer. It does not consume seeding time; if it ever competes with seeding, seeding wins.

---

## Assumptions Ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Narrowing `condition_pref` to `raw`/`graded`/null strands no rows worth keeping | Board is at 0 (user) | Free-text condition on old test needs is lost | Phase 1, STEP 1 query |
| A2 | `text[]` + check constraint beats a join table for a fixed 10-value, max-3 vocabulary | Simplicity; GIN index covers future faceting | Adding tag metadata later needs a migration | Phase 1 |
| A3 | 3 is the right tag cap | Row already carries 3 non-tag chips; 6 total is the ceiling before a 375px row wraps twice | Rows look busy, or buyers feel constrained | Phase 8, 375px screenshot |
| A4 | Truncating to 2 tags + `+N` on the row reads better than wrapping | Preserves the single-line chip row in the shipped anatomy | Buyers' third tag is less visible | Phase 8, visual |
| A5 | Description and visibility belong inside "Add detail" | Both are decisions most posters make once; the 3b rule is fewer controls at rest | A buyer misses the private-want option | Phase 8, post one of each |
| A6 | Camera photos need client-side downscale to clear the existing 8MB cap | Modern phone cameras routinely exceed it; the cap is verified at `app/post/actions.ts:62` | Camera posts fail with "Image is too large" — the exact flow Kyle asked for | Phase 5, step 2: shoot a real photo on a real phone |
| A7 | The ten tag labels are the right hobby vocabulary | Drawn from `Board-Reference/glossary.md` and the bulk/breaker beachhead | Wording feels off to the audience | Kyle's veto pass, Phase 2 |
| A8 | `AT COMP` is the right board wording | Kyle specified "comp" verbatim; `AT` disambiguates it from a comp *value* | Sellers misread it as a price | Phase 6, read the row cold |

---

## Open Items (none blocking)

- **Tag wording.** Proceed with the ten in the table unless Kyle names replacements. Changing one is a two-line edit (`lib/need-tags.ts` + the constraint) as long as both move together.
- **A "Wax / sealed" third type.** Proceed without it. Separate ticket.
- **Turning the mobile Refine sheet's condition input into a two-chip picker.** Proceed without it; note it on the rail backlog.
- **Tag facet in the board rail.** Proceed without it. Revisit when open needs clear `RAIL_MIN_NEEDS = 15`.

---

## Verification

Run from `~/Desktop/NeedIt/needit`:

```bash
npx tsc --noEmit
npx eslint .
npm run build
```

Then, with the dev server up:

1. **No selects:** open `/post`, run `document.querySelectorAll('select').length` in the console → `0`. (R8)
2. **Keyboard only:** unplug the mouse. Tab from the title field to the submit button. Every chip group is reachable, Space toggles, the focus ring is visible, and nothing is skipped. (R10)
3. **Screen reader:** VoiceOver rotor → form controls. Each group announces its `<legend>` ("Sport", "Tags", "Grade floor"). (R10)
4. **Camera, on a real phone:** `Take photo` opens the rear camera; `Choose` opens the library; shoot a full-resolution photo and confirm it uploads without hitting the 8MB error. (R6, R7, A6)
5. **Comp:** post a need with Comp selected → board row reads `AT COMP`, no `max` suffix; `select price_mode, budget_cents from requests order by created_at desc limit 1` → `comp, null`. (R1, R2)
6. **Grade:** post `Graded → PSA 9+` → board chip reads `GRADED · PSA 9+`; `grade_min` = `PSA 9+`. (R4)
7. **Tag cap:** tap four tag chips → only three activate, hint reads "3 of 3 used". Then craft a 5-tag POST with curl → action returns an error. (R3, R11)
8. **Row truncation:** post a 3-tag need → row shows 2 chips + `+1`; the detail page shows all three. (R12)
9. **Edit parity:** post a need with 3 tags + comp + a grade floor, open `/request/[id]/edit`, change only the title, save, re-read the row → all four fields intact. (R9)
10. **Public browsing didn't break:** open `/` in a logged-out private window and confirm needs are visible. (Policy paranoia check.)
11. **Screenshots at 375, 390, 1024 and 1440** of `/post` and `/`, before and after.

**How Kyle personally confirms done:** on his phone, post one bulk need at comp with two tags and one graded single at PSA 9+, in under a minute each, without the keyboard opening more than twice — then look at the board and read both rows without tapping in.

---

## Build Phases

- [ ] **Phase 1: Apply migration 0018 and confirm nothing was stranded**
      Done when: the VERIFY block returns 2 columns, 5 constraints, 1 index, and `pg_policies` still lists `"requests readable"` on `requests`.
      Steps:
      - Run the STEP 1 look-first `select` alone. Read the output. If it lists rows Kyle cares about, copy them out before continuing.
      - Run the 0018 block in the Supabase SQL editor.
      - Run the VERIFY block; eyeball all three counts.
      - Open `/` logged out and confirm needs still render.
      Covers: data layer for R1–R5, R11; checks: A1, A2

- [ ] **Phase 2: Ship `lib/need-tags.ts` and get the wording vetoed or blessed**
      Done when: the module exports compile and Kyle has seen the ten labels rendered as chips.
      Steps:
      - Create `lib/need-tags.ts` exactly as specified above.
      - Render the ten chips on a scratch route (or in Storybook-less isolation) and screenshot for Kyle.
      - Apply any wording changes to **both** the module and `requests_tags_chk` in the same commit.
      Covers: R11; checks: A7

- [ ] **Phase 3: Build the accessible `ChipGroup` primitive**
      Done when: a keyboard-only user can operate a demo instance of each variant, and VoiceOver announces the group name.
      Steps:
      - Create `components/ui/chip-group.tsx`: `<fieldset>` + `<legend>` + one visually-hidden `input` per option inside a `<label>`.
      - Support `mode: "radio" | "checkbox"`, an optional `max` for checkbox mode, and a `columns`/wrap layout.
      - Style with 3a tokens only: `--radius: 2px`, selected = `--primary` border + tint, 44px minimum target, 150ms border/background transition, no transform.
      - Verify focus ring visibility against `--background` in both light and dark.
      Covers: R10

- [ ] **Phase 4: Rebuild `post-need-form.tsx` as direction A**
      Done when: `/post` renders every block in the scope table, `document.querySelectorAll('select').length === 0`, and the Graded row reveals and collapses correctly.
      Steps:
      - Replace the sport select and the expiry select with `ChipGroup` instances.
      - Replace the type radios with a segmented `ChipGroup`.
      - Add the price row: `$` number input + a `Comp` toggle chip that clears and disables the number when active.
      - Add the Condition segment; conditionally render the Grade floor group only when `graded`, clearing `grade_min` on collapse.
      - Add the Tags group with `max={MAX_TAGS}` and an "N of 3 used" hint.
      - Move description and visibility into a `<details>` "Add detail" disclosure; keep the submit label flip.
      Covers: R3, R8; checks: A3, A5

- [ ] **Phase 5: Camera capture and image downscale**
      Done when: on a real phone, `Take photo` opens the camera and a full-resolution shot uploads successfully.
      Steps:
      - Render two file inputs: one `accept="image/*" capture="environment"` behind "Take photo", one `accept="image/*"` behind "Choose". Both write to the same state and a single hidden field, so the action's contract is unchanged.
      - Hide the camera button under `@media (pointer: fine)` — it degrades to a file picker on desktop, which is confusing next to "Choose".
      - **Verify A6 first:** shoot a photo on a real phone and check its byte size against the 8MB cap at `app/post/actions.ts:62`. If it exceeds, add a canvas downscale to max 2000px on the long edge, JPEG quality 0.85, before upload. Fallback if canvas is unavailable: submit as-is and let the existing error message fire.
      - Add a thumbnail preview with a "Remove" control.
      Covers: R6, R7; checks: A6

- [ ] **Phase 6: Wire the server action**
      Done when: posting each of comp / max / raw / graded-with-floor / 3-tag writes the expected row, and every edge case in the table returns its stated message.
      Steps:
      - Read `price_mode`, `tags[]`, `condition_pref`, `grade_min` from `FormData`.
      - Validate against `lib/need-tags.ts`: unknown tags rejected, array capped at `MAX_TAGS`, `grade_min` cleared unless `condition_pref === 'graded'`, comp-plus-budget rejected.
      - Keep money as integer cents; keep the private-want expiry rule (`expires_at = null` until published) untouched.
      - Extend the insert with the four fields.
      Covers: R1, R5, R11

- [ ] **Phase 7: Read surfaces — board row, profile row, detail page**
      Done when: a comp need reads `AT COMP`, a graded need shows `GRADED · PSA 9+`, and a 3-tag need shows 2 chips + `+1`.
      Steps:
      - Add `price_mode, tags, grade_min` to the three `select(…)` column lists (`app/page.tsx:198`, `app/u/[username]/page.tsx:300/356/380`, `app/request/[id]/page.tsx:256`).
      - Update `formatBudget` call sites: when `price_mode === 'comp'`, render `AT COMP` in the same mono/live-green slot with no `max` suffix.
      - Render the condition chip as `RAW ONLY` or `GRADED · <grade_min>` in place of the raw `condition_pref` string.
      - Append up to 2 tag chips (green fill, `#1E2A24` bg / `--primary-live` text) plus `+N`; show all tags on the detail page.
      Covers: R2, R4, R12; checks: A4, A8

- [ ] **Phase 8: Edit parity and the full verification pass**
      Done when: every numbered check in the Verification section passes.
      Steps:
      - Bring `components/post/edit-need-form.tsx` and `app/request/[id]/actions.ts` to parity: same `ChipGroup`s, same validation, pre-filled from the existing row.
      - Run `npx tsc --noEmit`, `npx eslint .`, `npm run build`.
      - Walk Verification steps 1–11 in order, including the real-phone camera test and the keyboard-only pass.
      - Capture the before/after screenshots at all four widths.
      Covers: R9, and acceptance for R1–R12; checks: A3, A5

- [ ] **Phase 9 (optional, cuttable): the live board-row preview**
      Done when: a collapsed one-line preview of the row sits above the form and updates as chips are tapped.
      Steps:
      - Extract the row's chip + price + title rendering into a shared presentational component so the preview and the board cannot drift.
      - Pin it above the form, condensing on scroll using the same pattern as the board's sticky header.
      - Cut this phase without hesitation if it competes with seeding.
      Covers: nothing required — pure teaching aid (direction C, parked at Q2)
