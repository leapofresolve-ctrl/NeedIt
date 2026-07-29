# Card Data Vendor Comparison — CardHedge AI vs. TCDb vs. PriceCharting

**Date:** July 29, 2026
**Context:** Evaluating card catalog + pricing data sources for Exprifi. Board at 0, launch Sep 26, payments paused. Catalog is on the do-not-build-yet list.
**Verified against:** CardHedge email from River; TCDb API License Agreement (read in full, logged in); PriceCharting public API docs + Pro pricing page.

---

## Exprifi's actual pricing requirement (locked this session)

Pricing on Exprifi is a **soft "suggested range" icon**, not a valuation engine:

- Shows a *range* — roughly what the last ~5 sales looked like. Deliberately imprecise.
- **Individual card orders only.** Nobody is pricing 200 cards one at a time.
- **Bulk lots get heuristics, not per-card prices** — suggestions keyed to year range, sleeved vs. toploaded vs. raw, condition tier. No vendor data required for this at all.
- **$20+ singles** are where specific card prices start to matter.

**Why this matters:** a soft range has low accuracy requirements. That kills the argument for expensive precision data. The cheapest adequate source wins.

---

## At a glance

| | CardHedge AI | TCDb | PriceCharting |
|---|---|---|---|
| **Cost** | $500–1,000/mo | $10 → $500 one-time token packs (~$0.005/call unit) | $49/mo (Legendary tier) |
| **Commitment** | Commercial contract, call required | None; tokens carry over, non-refundable | Monthly sub, cancel anytime |
| **Card catalog** | Yes | Best breadth in the hobby | Thin but functional |
| **Card images** | Unclear — ask | **No** (§2.1 excludes) | Unclear — ask |
| **Current prices** | Yes, all grades + raw | **No** | Yes, all grades + raw |
| **Price history / past sales** | **Yes** — the only one | No | **No** — explicitly excluded |
| **ML / predictive pricing** | Yes | No | No |
| **Text search endpoint** | Presumably (ask) | **No** — hierarchy only | **Yes** — `/api/products?q=` |
| **Bulk export** | Structured downloads | Forbidden (§3.4) | Daily CSV of all prices |
| **Local storage rights** | Ask | **Record IDs only**; 30-day cache max | Not stated in docs — check ToS |
| **Rate limit** | Ask | Token budget | 1 call/sec; CSV 1 per 10 min |
| **Sports coverage** | Ask — clients are TCG-leaning | All major sports, deep | **Lives on sportscardspro.com** — confirm token covers it |
| **Support / SLA** | White glove, named contact | None; no SLA (§5.3) | Email support, no SLA stated |
| **Conflict of interest** | None | None | **Runs its own marketplace** |

---

## CardHedge AI

**Pros**

- The only one of the three with **price history and past sales** — the literal input for "last 5 sales."
- Predictive/ML pricing, real-time updates, structured downloads, custom endpoints.
- Commercial agreement explicitly permits website and app use.
- White-glove support with a real human (River) already responsive.
- Reference clients with credibility: Arena Club, Mantel, Courtyard.io.
- Willing to shape a custom API around the use case.

**Cons**

- **$6,000–12,000/year, pre-revenue.** Payments aren't even on yet.
- Terms are entirely unseen until after a sales call — caching rights, volume caps, exit terms all unknown.
- Named clients skew TCG/vaulting; **sports card depth unconfirmed.**
- Likely annual commitment and a real exit cost.
- Buying ML forecasting to render a fuzzy range icon is paying for precision the product throws away.

---

## TCDb (Trading Card Database)

**Pros**

- **Strongest catalog in the hobby** — 16 categories, all major sports, deep set/parallel/checklist data, community-maintained.
- **Absurdly cheap.** $10 = 2,000 tokens. Categories, Years, and Hello cost 0 tokens. A checklist pull is 5 tokens (~2.5¢).
- No subscription, no contract, no renewal to forget. Unused tokens carry over.
- Test Mode account already provisioned (Client ID in hand) — can explore before spending.
- §3.6 explicitly permits **permanently storing their Record IDs** against your own rows. Correct integration pattern, blessed in writing.

**Cons**

- **No pricing at all.** §2.1 excludes pricing data from the definition of card metadata.
- **No images.** Same clause. Bigger gap than it first appears.
- **No search endpoint.** Categories → Years → Sets → Set → ChecklistPull. You navigate to a set you already know. Autocomplete across the hobby isn't possible within the terms.
- §3.6(a): **only** the Record ID may persist. Player name, set, year, parallel cannot live permanently in your DB.
- §3.7: cache capped at **30 days**. §3.4/3.5: no bulk pulling, no pattern-based retrieval approximating a full copy.
- §4.6: on termination, **delete all Data within 30 days.** Stop paying and your board's card labels go blank while orphan IDs remain.
- §3.15: no using the Data to train or develop ML/AI models without written consent.
- §4.8: audit rights over API logs **and application architecture**, 5 business days' notice.
- §5.3 no SLA. §3.14 attribution may be required. Louisiana law, mandatory negotiation then AAA arbitration.
- Purchases final and non-refundable.

---

## PriceCharting

**Pros**

- **$49/month** for API access plus a daily full-price CSV. An order of magnitude under CardHedge.
- **Real text search** — `/api/products?q=charizard #4` returns top 20 matches with IDs. The thing TCDb can't do.
- One call returns **every grade tier**: ungraded, PSA 10/9/8, BGS 10, CGC 10, SGC 10, and more.
- **Prices are integer pennies.** Matches the money-as-cents rule with zero conversion.
- Daily CSV sidesteps the 1-call/sec limit for anything bulk.
- Extras: `sales-volume` (yearly units), UPC, eBay ePID, Amazon ASIN.
- Cancel monthly. Low switching cost, low regret.

**Cons**

- **No price history, no past sales.** Stated explicitly: current values only. Does not directly serve "last 5 sales."
- **Sports cards live on sportscardspro.com**, a sister site. PriceCharting's own nav links out to it. Must confirm whether one token covers both.
- 1 call per second is slow for interactive lookups; forces CSV-plus-local-cache architecture.
- Catalog depth on sports parallels is unverified and likely thinner than TCDb.
- **They operate their own marketplace** with a full selling API. Renting data from an adjacent marketplace operator.
- ToS not yet reviewed — caching, retention, and display rights unknown.

---

## How to actually build the "suggested range"

The mechanic wanted — a range off roughly the last 5 sales — is served directly by only CardHedge, at $500–1,000/mo. Four cheaper paths get to the same UI:

1. **Grade spread as the range (free with PriceCharting).** One call returns ungraded through PSA 10. Showing "raw ~$14, PSA 9 ~$38" *is* a range, and it's arguably more useful to a buyer than a sales average, because it tells them what condition assumption they're making.
2. **Roll your own history from the daily CSV.** Snapshot PriceCharting's CSV each day into your own table. After two weeks you have a trailing series and can show "$12–17 over the last 30 days." Smoother and less noisy than 5 raw sales. **Contingent on PriceCharting's ToS permitting retention — verify before relying on it.**
3. **Exprifi's own closed-deal data.** Once deals are closing, what buyers actually paid on Exprifi is more relevant than any external comp, costs nothing, and compounds into a moat no vendor can sell a competitor. Chicken-and-egg early, but this is the right long-run answer.
4. **eBay sold comps.** Their Marketplace Insights API exposes ~90 days of sold data, which is literally the desired input. Access is approval-gated and non-trivial to obtain. Worth investigating, not worth blocking on.

**For bulk lots: no vendor needed.** Year-range bands, sleeved/toploaded/raw, condition tier — all heuristics from domain knowledge already in hand. Ship a hardcoded suggestion table and refine it from real posts. Zero dollars, zero contracts, zero terms risk.

---

## Recommendation

**Now (through launch): buy nothing.**

Bulk and filter requests — the whole MVP — need no card database and no pricing feed. The board is at zero. Every dollar and hour spent on data plumbing before liquidity exists is spent on the wrong problem.

Two cheap moves that cost nearly nothing and preserve every option:

- **Spend the $10 on TCDb tokens.** Not to ship — to see real card data, learn whether their set/parallel structure can carry a request, and find out what their checklist JSON actually looks like. Best $10 of education available.
- **Build a provider-agnostic `card_refs` table now.** Your own card row is the source of truth (buyer's free-text description always retained). Vendor IDs go in a side table keyed by `provider` + `provider_id`. Adding, swapping, or running two vendors later becomes an INSERT, not a migration. This is the single highest-leverage decision in this whole comparison, and it's free today.

**When singles start mattering (Lane 1 / Milestone 2): PriceCharting at $49/mo.**

Best fit for the actual requirement. It has search, it has every grade tier, it's priced like a tool rather than a partnership, and it cancels monthly. Pair it with self-snapshotting for the trailing range. Two things to confirm before paying: does the token cover sportscardspro.com, and does their ToS allow retaining CSV snapshots.

**CardHedge: keep warm, sign nothing.**

Revisit only when the 5% finder's fee on high-end singles is producing revenue *and* there's evidence that price history or forecasting measurably moves conversion. Take the call now purely for intel — learn what commercial terms in this space look like, ask about a startup tier, and bank the relationship. A vendor you've had a good call with is easier to buy from in six months than a cold inbox.

**On switching costs generally:** these three are not mutually exclusive. TCDb is a catalog with no prices. PriceCharting is prices with a thin catalog. CardHedge is both, expensively. With the `card_refs` pattern in place, switching or stacking is cheap forever. Without it, every vendor decision becomes permanent.

---

## Open questions to send

**CardHedge (River)**

- Sports depth — baseball/basketball/football, raw and graded? One category or several under your pricing?
- Startup or pre-revenue tier? Sandbox or trial?
- Caching and local storage rights?
- Call volume caps and overage pricing at entry tier?
- What does onboarding look like for a smaller client?

**PriceCharting**

- Does the $49 Legendary token cover sportscardspro.com sports card data, or is that separate?
- May daily CSV snapshots be retained to build a trailing price series?
- Are card images available?
- How deep is sports parallel/variation coverage?

**TCDb**

- Is there any path to a search or player-lookup endpoint?
- Are images licensable separately?
- Would the 30-day cache cap be extended for a marketplace referencing cards long-term?
