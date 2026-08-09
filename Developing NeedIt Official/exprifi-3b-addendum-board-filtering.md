# Exprifi — 3b Addendum: Board filtering (docked rail replaces Refine sheet on desktop)

**Date:** 2026-07-29
**Amends:** `exprifi-3b-facelift-and-access-spec.md` §1.3 ("Kill the facet bar") and §8 Block C
**Status:** proposed — Kyle's call
**Mockups:** `design-mockups/exprifi-3b-rail-mockups.html`
**Does not touch:** locked 3a tokens, board row anatomy, access model (Part 3), fee/account decisions

---

## 0. Why this addendum exists

Kyle raised two things:

1. **A legal worry** — the "Refine" pattern feels borrowed from eBay, and could invite a claim.
2. **A design idea** — put filters on the left and have the board recompute automatically.

The legal worry turns out to be the wrong thing to fear (§1). The design idea turns out to be right for a reason that has nothing to do with legal (§2). This addendum resolves both and specifies the build.

---

## 1. The legal question, resolved

*Not legal advice — Kyle should run §1.3 past counsel alongside the Block A policy pages.*

### 1.1 Filtering UI is not something eBay can own

| Theory | Why it fails |
|---|---|
| **Copyright** | Protects expression, not function or layout ideas. Faceted filtering is ubiquitous prior art — Amazon, Walmart, Zillow, Kayak, every Shopify storefront. eBay neither invented nor holds it. |
| **Trademark on the word "Refine"** | Generic descriptive verb used across the entire web. Not registrable as a mark for this use, and eBay has not tried. |
| **Trade dress** | Requires a distinctive, **non-functional** overall look plus likelihood of consumer confusion. A horizontal row of native `<select>` elements is neither distinctive nor non-functional, and no one confuses a card-demand board with eBay. |
| **Patent** | eBay's portfolio is on backend transaction mechanics (proxy bidding, checkout, fraud scoring), not filter chrome. |

**Conclusion: do not slow the build down over this.** No plausible claim exists on the filter pattern.

### 1.2 Where real exposure actually lives

These are worth an audit, and none of them are UI:

1. **Literal text.** Policy pages, help articles, tooltip and error copy lifted verbatim from eBay *is* copyrightable. Audit `legal-drafts-for-review.md` and every Block A page — all copy must be original.
2. **Assets.** No eBay SVG icons, no fonts licensed to them, no CSS copied out of devtools.
3. **Their data — the actual landmine.** Scraping eBay listings or sold-comps to build a catalog or price signal violates their User Agreement and API terms, and they enforce it. This is a live risk against `card-catalog-and-automatch-spec.md`, not against the board. Any comps feature must come from a licensed vendor (see `card-data-vendor-comparison.md`).
4. **Their name in marketing.** Internal shorthand ("not eBay") is fine. "Better than eBay" in a paid ad invites a fight with no upside.

### 1.3 Cheap insurance to adopt now

- **Own the vocabulary.** Exprifi says *needs*, *hunts*, *offers*, *demand*, *the board* — never *listings*, *watchlist*, *Buy It Now*, *feedback score*. This is brand hygiene that happens to eliminate the entire class of concern.
- **Write every word from scratch.** Including microcopy.
- **Keep this file.** A dated design-rationale document showing independent derivation is exactly what you'd want to hold if anyone ever asked.

---

## 2. The design change

### 2.0 Direction of travel — the thing that governs every screen below

Stated explicitly because it was ambiguous enough to confuse the person who designed the product:

| | |
|---|---|
| **The board** | Contains **only demand**. Every row is a buyer saying "I want this." |
| **Who filters it** | **Sellers.** Filtering the board means "find demand I can fill." It is always a seller-side act. |
| **How buying works** | By **posting a need** — never by searching. There is no "search for cards to buy" on Exprifi. Adding one rebuilds eBay and discards the thesis. |
| **Your own activity** | Needs you posted and offers you sent live on a **dashboard**, not as a filter of the board. |
| **The catch** | The beachhead is buyer *and* seller in one person, so the same account posts needs *and* filters the board — but never in the same surface. Two doors, always. |

Any future copy, empty state or onboarding line that implies you can "search for cards" on the board is a bug against this table.

### 2.1 What changes vs. §1.3

§1.3 was right to kill the seven-control strip. It was right for a reason worth restating: **the beachhead is a 45+ collector who bounces off moving parts.** Any replacement must show fewer controls at rest, not the same controls rotated 90°.

The amendment is narrow:

> **§1.3 as written:** one "Refine" button → right slide-over on desktop, bottom sheet on mobile.
>
> **§1.3 as amended:** the same filter component renders **docked in the left gutter at ≥1024px**, and as a **bottom sheet behind one "Refine" button below 1024px**. Filters auto-apply on change (debounced); the "Apply" / "Show N results" commit button exists only in the sheet.

One component, two presentations. No new logic, no new data model.

### 2.2 Why the rail is better, independent of the legal question

- **It fills real dead space.** §1.4 already flags the 780px board panel floating in a 1518px viewport as reading unfinished. The rail is the missing left column.
- **It changes the grammar of the page.** Persistent rail + live recompute is *screener* grammar — Kayak, stock screeners, job boards. That is what Exprifi is. A facet bar above a grid is retail-catalog grammar, which is what it isn't.
- **Zero native `<select>` on the page.** §Part 0 named this as the single loudest amateur signal. The rail removes the last of them. — **Correction, Aug 8:** it didn't. The rail removed the ones in the *rail*; four survived in the mobile sheet (`refine-panel.tsx`: type, sport, condition) and in `sort-select.tsx`, because the sheet predates the rail and was never brought forward. All four were replaced with `components/ui/chip-group` on Aug 8 and the goal now holds **on the board**. Five remain elsewhere in the app — `settings-panels.tsx` (2), `create-alert-form.tsx` (2), `app/u/[username]/page.tsx` (1) — and are out of scope for this addendum. *Lesson: "the rail removes the last of them" was written about a component that didn't exist yet. A goal stated as already-achieved doesn't get checked.*
- **Counts per option are demand data.** "Basketball · 11" tells a seller where the money is before they click. A retail filter shows supply; this shows demand. Same widget, opposite meaning — and it's visible at a glance.
- **No Apply = no form feel.** The board reads as a live instrument rather than a search results page.

### 2.3 Rail contents (Phase 1)

Groups, in this order. Every row is a 44px checkbox — no selects, no dropdowns:

| Group | Options | Notes |
|---|---|---|
| **What kind** | Bulk & lots · Single cards · Wax & sealed | Multi-select |
| **Sport** | Basketball · Football · Baseball · TCG (+ more as categories open) | Multi-select |
| **Buyer's max** | two mono inputs, min / max | Integer cents in the DB, dollars in the UI |
| **Closing** | Under 24 hours · No offers yet | The two filters a seller hunting for winnable deals actually wants |

Rail footer: live match count (mono, left) + "Reset all" text link (right).

### 2.3a The locked header — search and rail, divided

The board gets a **sticky header** carrying the search field, the active-filter chips, and sort. It does not scroll away, so a seller scanning forty rows never loses their controls. It condenses to ~52px (logo · slim search · "N filters" chip · sort · Post a need) after 120px of scroll so the board stays the largest thing on screen.

Two filter surfaces are only safe with a hard rule:

| Surface | Owns | Never does |
|---|---|---|
| **Search** (header) | Free text across need title + description — player, set, brand, year, team | Never parses price, sport, condition or dates. No NLP. |
| **Rail** (left) | Every structured field: type, sport, price band, closing window, offer state | Never accepts free text |

They compose with **AND**. Both serialize into `searchParams`. The header renders the text query as a **dashed** chip so it reads as a different kind of filter from the solid structured ones.

This rule is what makes Option D's search box safe to adopt: typing "under 500" performs a literal text search and finds nothing, which is honest and self-correcting, rather than a silent mis-parse that reads as the site being broken. **Sort stays inline in the header, right-aligned** — unchanged from §1.3, because sort is not a filter.

> **Amended Aug 8.** "Sort stays inline in the header" was implemented as `hidden sm:block`, which meant **no sort control existed at all below 640px**. Sort now lives inside the Refine sheet under 1024px — behind a divider, under its own legend, marked "not a filter" — and inline in the header at and above 1024px, where the rail docks and the sheet doesn't exist. The two surfaces are exact complements: one sort control at every width, never two, never none. The *rule* is unchanged and still binding: sort is excluded from the active-filter badge, never renders as a removable chip, and survives "Reset all".

### 2.4 Phase 2 — "Saved views" (passive bookmarks only)

The rail gains a top section holding **saved views**: a named, bookmarked filter state ("Basketball bulk," "Any Jordan lot"). Selecting one drives the board; the filter groups below become "editing this view." A "+ Save this view" button converts any ad-hoc filter state into one. A "3 new" badge appears **when the user is already on the site**.

#### 2.4.1 Why this was cut down — the M2 collision

An earlier draft of this addendum specified saved searches **with email notifications**, called "My hunts." Kyle rejected it on the grounds that it collides with the M2 paid automatic-matching feature. He is right, and this is worth recording as a near-miss:

A standing search that emails a seller when matching demand appears **is Lane 1 matching**, hand-built and given away free in the MVP. It would have spent M2's entire value proposition before M2 shipped, leaving the paid product to argue "...but ours is automatic" — a much weaker pitch than "we tell you when someone wants your stuff" from a standing start. This is precisely the failure mode the standing guardrail *"talk me out of adding Lane 1 before Lane 2 liquidity is proven"* exists to prevent, and the addendum author walked into it.

#### 2.4.2 The boundary rule — adopt this permanently

> **Free = you come look. Paid (M2) = it comes to you.**
> The test is not *whether* we contact a seller — it's **whether the message does their matching for them.**

Refined Aug 1, after discovering `demand_alerts` already shipped (§2.4.4). A vague nudge that sends you to the board is still *you coming to look*. Naming the card in the email is handing over the match, and that is the paid product.

| | Free | M2 / paid |
|---|---|---|
| Saved alerts | 3 | Unlimited |
| Email cadence | At most one every ~3 days | Instant |
| Email content | "There's new demand matching your alerts" | Names the need, links straight to it |
| Matching basis | Criteria the seller typed | Real inventory, auto-matched |
| Mechanic | — | Broadcast → race → atomic claim |

Saved views (the rail feature) still ship with **no outbound anything** — badges only, on-site. They're a navigation convenience, not a notification channel.

#### 2.4.3 Implemented Aug 1

Migration `0017_free_alert_limits.sql` + `lib/alerts.ts`:

- `FREE_ALERT_LIMIT = 3`, enforced in `app/alerts/actions.ts` (friendly message) **and** by a `before insert` trigger on `demand_alerts` (the action isn't the only path to an insert). Sellers already over the cap keep what they have; they just can't add a fourth.
- `DIGEST_INTERVAL_DAYS = 3`, enforced in `app/api/notifications/email/route.ts` by an **atomic conditional update** on `profiles.last_demand_digest_at` — several needs can publish in the same second and each POSTs the webhook independently, so whichever request wins the update sends and the rest skip.
- `demand_match` email copy is now generic, links to the **board** rather than the need, and skips the title lookup entirely.
- The route now also respects `profiles.notify_demand_match`, which it previously ignored — a seller who turned demand alerts off in Settings was still getting them. Fixed on sight.
- The in-app **bell stays instant and specific**. It's on-site, so it doesn't spend the boundary — you only see it once you've already arrived.
- Upsell copy in the email is a marked `TODO`, not written. Nothing to sell and no checkout yet (Block E constraint holds).

#### 2.4.4 The near-miss that ran the other way

While starting the build, `demand_alerts` turned up **already shipped** — `/alerts`, migration `0008`, a DB trigger firing `demand_match` notifications, and an instant email naming the card and saying *"Get there before another seller does."* Free, unlimited, live.

So the thing this addendum had just resolved not to build already existed. Migration `0008`'s own header drew the line in a different place — *"criteria-only — NO inventory/catalog (that's Lane 1 / M2)"* — which is defensible, but it's not the line §2.4.2 drew, and it meant M2's headline benefit was already being given away in weaker form.

Resolved by trimming rather than removing (§2.4.3). Two things made that the right call: the board is at 0, so **nobody is receiving these emails today** — deciding now costs nothing and deciding in six months means taking something away from sellers who rely on it; and a slower, vaguer free tier creates an upgrade ladder instead of a cliff.

**Process note:** two specs an hour apart contradicted shipped code in the same feature area, in opposite directions. Read `supabase/migrations/` and the relevant `app/` route before locking any decision about what is free.

#### 2.4.5 What the cut-down version is still worth

- A breaker checking the board each morning stops re-clicking the same four filters, and the badge gives them a reason to open the tab. Real retention, zero M2 risk.
- It becomes the **on-ramp** to Lane 1 rather than a substitute for it: when M2 ships, a saved view is the natural upgrade prompt — *"you check this view every day, want us to just tell you?"*
- Saved views are the cleanest available signal of what a seller stocks, which is the data Lane 1 needs to match against anyway. Building them now collects that data for free.

**Correction to the earlier draft:** it claimed hunts were the mechanism for waking sellers up during the seeding sprint. With alerts removed, seeding-sprint outreach is a **manual founder job** — Kyle emails people himself. That is the right answer at 0 needs regardless, and it does not need to be a product feature.

Phase 2 needs a `saved_views` table (owner, name, filter JSON, `last_seen_at`) with owner-only RLS. **No notify column** — leaving the field out prevents it from quietly growing an alert later. **Do not start it until Phase 1 is shipped and the board has real rows** — a saved-view rail over an empty board is worse than no rail.

### 2.5 Options considered and not taken

All four are mocked in `design-mockups/exprifi-3b-rail-mockups.html`. Recorded here so the reasoning survives.

| | **A · Docked rail** | **B · Saved views** | **C · Profile-shaped** | **D · Zero-chrome** |
|---|---|---|---|---|
| **What** | Same filters, moved to the left gutter, auto-applying | Rail led by bookmarked filter states, no alerts | No filters — plain-language setup questions on your profile | One search box + chips, no rail |
| **Best at** | Power scanning; fills dead space; no new data | Returning to the same slice without re-clicking | Friendliest for the 45+ collector; board right on arrival | Cheapest build; identical desktop/mobile |
| **Costs** | Still a familiar filter UI, not distinctive | Must stay passive or it eats M2 | Traps power users; friction at signup | Depends on free-text parsing |
| **Build** | ~1 day, presentation only | ~1 day, small table | ~2 days + onboarding flow | ~half a day |
| **Verdict** | **Phase 1** | **Phase 2, declawed** (§2.4) | Later, layered on A | Rejected alone — **search bar adopted into Phase 1** (§2.3a) |

**Locked build = A + D's header.** The rail from A, the pinned search bar from D, divided by the rule in §2.3a.

**C (profile-shaped) — deferred, not dead.** It's the most obviously not-a-store option and the kindest to the beachhead. Two problems make it wrong *first*: a breaker hunting one specific thing today has no way to slice, so the "show everything" escape hatch must be loud or they feel trapped in a box they set months ago; and it front-loads friction onto signup, which is the worst place to add friction while the board is at 0 and every account counts. **Layer it on top of A once accounts are flowing** — the setup answers then also seed notification preferences for B.

**D (zero-chrome) — rejected as a whole, adopted in part.** Two disqualifiers *as a replacement for the rail*: it only works if free-text parsing is good, and "basketball bulk under 500" is a real NLP problem with no data to tune against — every parse miss reads as the site being broken. More fundamentally, a search box assumes the seller already knows what they want, but the point of a demand board is **browsing what buyers want**; search hides the inventory of demand. **Resolved by §2.3a:** the search field is adopted into Phase 1 as a *dumb text* filter alongside the rail, and its pinned-header treatment becomes the board's locked header. D's chrome, A's brains.

### 2.5a Rail visibility — permanent, with two exceptions

**The rail is always visible at ≥1024px.** "Refine" is the mobile presentation of the component, never a desktop control. Reveal-on-click was considered and rejected:

- **Hidden filters are unused filters.** The two most valuable options — *closing under 24 hours* and *no offers yet* — are how a seller finds a winnable deal rather than one with six offers on it. Nobody discovers those behind a button they have no reason to press.
- **The counts are content.** "Basketball · 11" is demand data and, once seeded, the best at-a-glance proof the board is alive. Behind a click it does nothing.
- **It re-opens §1.4.** The original complaint was a 780px panel floating in a 1518px window looking unfinished. A collapsed rail is that again.

The §1.3 "too many moving parts" concern was about seven native selects stacked *horizontally above* the board, in the reading path. A left rail sits outside that path — the eye tracks down the board column.

Two exceptions:

1. **Collapsed by choice.** A "Hide filters" text link at the rail foot, persisted in `localStorage` and restored on return. Collapsed state = a 44px ink tab on the left edge showing the active filter count; active filters remain visible as header chips so nothing is lost.
2. **Volume threshold — rail renders at ≥15 open needs.** Below that it doesn't render at all: full-width board, search bar retained, one honest line ("Everything open right now — small enough to read top to bottom") in place of filters. A rail full of zeros makes the board look emptier than it is. Keep the threshold as a single constant, tunable once there's real behaviour to look at — **not** a user setting.

### 2.6 Empty and zero states — non-negotiable

The board is at 0 today, so this is the default experience until seeding lands, not an edge case.

- Options with 0 matches render **dimmed, with their real count shown**. Never hidden (makes the board look smaller than it is), never faked (unrecoverable trust violation).
- 0 total needs → board shows `● LIVE  0 open` + "The board opens with founding members" + a single ink "Post the first need" CTA. Matches §2.1.
- 0 needs *after filtering* → "Nothing matches yet" + "Reset all" + offer to save it as a hunt (Phase 2) so they get told when something appears.

---

## 3. Build notes

- **`searchParams` remains the single source of truth.** The rail reads from and writes to the URL exactly as the facet bar does today. Presentation change only.
- **Debounce 250ms** on checkbox toggles, 400ms on the price inputs. Coalesce rapid toggles into one navigation.
- **Optimistic count** in the rail footer; reconcile on response. Never show a stale number without a pending state.
- **No layout shift** while recomputing. Keep the panel height, dim rows to ~0.6 opacity during fetch. Honour `prefers-reduced-motion` (transitions already limited to 150ms border/bg per 3a).
- **`aria-live="polite"`** on the match count so auto-apply is announced to screen readers — auto-apply without this is an accessibility regression, which is the one way this change could go backwards.
- **Keyboard:** rail is a `<fieldset>` per group with a visible `<legend>`; visible focus rings (already a Block C item); Escape closes the mobile sheet and restores focus to the Refine button.
- **Option counts** come from one aggregate query per facet group against the *unfiltered-on-that-facet* set (standard facet counting), not N queries. If that's slow at scale, cache for 30s — counts don't need to be to-the-second.
- **Breakpoint:** dock at ≥1024px. Below that, sheet. Verify at 375×667 (iPhone SE) as well as 390×844 — the beachhead is not all on new phones.
- **Search:** debounce 350ms, minimum 2 characters, case- and accent-insensitive `ILIKE`/`websearch_to_tsquery` against title + description only. Add a trigram or FTS index before shipping — this runs on every keystroke. Empty result from a text query shows "Nothing matches *jordan rookei*" with the query echoed back, so typos are visible.
- **Locked header:** `position: sticky; top: 0` with a backdrop blur, condensing at 120px of scroll. The rail sticks below it (`top: <header height>`) and scrolls independently when taller than the viewport. On mobile the header condenses to search + Refine only; the post-a-need CTA moves to the bottom bar.
- **Never persist search text into a saved view's name** — the name is user-authored. Autofilled suggestions are fine, silent naming is not.

---

## 4. Effect on Block C

Block C's line item changes from *"Refine sheet replaces facet bar"* to:

> **Board filtering** — locked header (dumb text search + chips + sort, condensing on scroll) · docked left rail ≥1024px / bottom sheet below · auto-apply with debounce + `aria-live` count · dimmed-with-real-count zero options · empty-state rebuild.

Everything else in Block C is untouched. Block ordering is untouched — Block A (legitimacy) still goes first.

**Verify:** side-by-side screenshots at 375px, 390px, 1024px and 1440px before/after · toggle a filter with the keyboard only and confirm the count is announced · confirm zero-count options are visible and dimmed · confirm a shared filtered URL reproduces the exact board for a signed-out visitor · type "under 500" into search and confirm it returns an honest empty state with the query echoed, not a wrong guess · confirm the header stays pinned and the rail sticks beneath it through a 40-row board.

---

## 5. What this addendum does *not* do

Guardrail check, explicitly:

- No escrow, no catalog, no Lane 1. This is Lane 2 presentation.
- **No outbound notifications of any kind.** The boundary rule in §2.4.2 is now a standing constraint on this project, not just on this addendum: free = you come look, paid = it comes to you. Any future spec proposing to email a seller about matching demand is proposing Lane 1 and must be checked against M2 first.
- No billing. Saved-views-as-upgrade-prompt is future rationale only.
- No new dependency on card data vendors.
- Does not pull the seeding sprint's protected time. If this competes with seeding, **seeding wins** — an empty board with a beautiful rail is still an empty board.
