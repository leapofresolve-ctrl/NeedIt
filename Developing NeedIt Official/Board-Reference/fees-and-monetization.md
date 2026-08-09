# Fees & Monetization

## Current state
**MVP charges nothing.** Liquidity first. Billing code is M4.

## ✅ RESOLVED — Kyle's decision, Jul 27 2026 · amended Aug 2, 2026

> **Aug 2, 2026 amendment (Kyle):** the 5% applies to **all single-card deals**, not only high-end singles. The dividing line is *format* (single vs. bulk lot), not *value*. This removes the "high-end single" dollar threshold as an open question — there is no threshold. Bulk lots and filter requests remain fee-free, permanently. **Bulk lots ship marked "Beta."**
The Model A / Model B tension is closed. The model is the synthesis:

| | **Buyer** | **Seller** |
|---|---|---|
| Cost to join | Free, forever | Free, forever |
| Fee on a completed deal | **5% finder's fee — SINGLE CARDS ONLY.** No fee on bulk lots or filter requests, ever. | **$0. Sellers keep 100%.** |
| Paid tier | — | **Exprifi Pro** (monthly) — gates *tools*, not access |

**Exprifi Pro unlocks (all M2 territory):** unlimited demand alerts (free cap: 3) · Lane 1 instant price-match when it ships · seller inventory upload + Showcase · priority position on contested needs · seller analytics (fill rate, response time, missed demand) · bulk-lane flat rate.

**Why this shape:**
- Keeps the loudest recruiting line intact — *"eBay takes ~13% from the seller; on Exprifi the seller keeps 100%."*
- The 5% never touches bulk, because bulk margins are thin and bulk is the beachhead. A 5% tax on a $60 lot of commons kills the exact volume the liquidity test needs. This is the model, not a promo.
- The line is **single vs. bulk**, not cheap vs. expensive. A single card is a discrete, priceable item where a 5% convenience fee is legible to the buyer; a bulk lot is a thin-margin volume play where it is not. No value threshold to explain, argue about, or revisit.
- The subscription monetizes *capability*, not access — so it can never suppress the supply-side participation that liquidity depends on.
- Two rails: recurring revenue from serious sellers, transactional revenue from high-value singles (where the money actually is on the up-market climb).

**Worked examples (use verbatim in marketing and on `/plans`):**
- *$1,400 Jordan rookie* — buyer pays $1,470 ($1,400 + $70 finder's fee). Seller receives $1,400. That same seller nets ~$1,218 on eBay.
- *$60 bulk lot* — buyer pays $60. Seller receives $60. **No fee, either side.**

**Superseded:** Model A (sub-for-bulk + 5% on singles) and Model B (buyer-pays-5%-on-everything, sellers free) are both closed. Kyle's Jul 27 framing of "seller sub + buyer 5%" is implemented as above — the sub gates *features* rather than charging for the right to sell, which preserves the anti-eBay headline.

## Sequencing guardrail
**Ship the pricing page. Do not ship billing.** `/plans` goes live as a public, honest, static page with a "free during founding" banner and a Pro waitlist capture — 100% of the recruiting value at 0% of the build risk. Plan enforcement, subscription billing, and 5% collection wire up at **M4, after liquidity is proven**. The fee can only be *collected* once on-platform payments are the default path anyway (off-platform settlement can't be taxed).

## Still open (blocks `/plans` copy)
1. ~~**"High-end single" threshold**~~ — **CLOSED Aug 2, 2026.** No threshold. The 5% applies to every single-card deal regardless of value.
2. **Pro price point** — rec: one price, monthly, under $30, founding members grandfathered permanently.
3. **Free demand-alert cap** — rec: 3.

## Payments
Stripe Connect foundation is built in test mode. Per the Jul 27 replan it stays **test-mode only** until the liquidity gate is passed — see `../exprifi-launch-roadmap.md`.

## Future levers (unscheduled)
Promoted needs (bump on the board) · premium demand data (the demand graph itself) · volume tiers · instant payouts · seller tax reports.

Related: [company-overview.md](company-overview.md) · [metrics.md](metrics.md) · `../exprifi-3b-facelift-and-access-spec.md` (Part 5)
