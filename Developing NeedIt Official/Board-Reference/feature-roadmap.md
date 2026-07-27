# Feature Roadmap

## Built & LIVE (Lane 2 MVP, need-it.vercel.app)
Complete loop: auth + pseudonymous usernames → post a need (single/bulk, budget, condition, expiry, photo) → the Board → private wants + publish → structured offers (private via RLS) → counter-offer negotiation (10-round cap) → atomic match + identity reveal → public profiles/want boards → seller command center → completed deals → history → in-app notifications → email notifications (Resend, live Jul 2, 2026).

## Now → Aug 8, 2026 launch (per exprifi-launch-roadmap.md)
- Brand 3a rollout (dark live board, green #00A968, Instrument Sans)
- **Stripe as optional payment rail** (Kyle's override — ships at launch, not M3)
- Offer-count badge on public board cards (social proof / "sellers race" signal; needs denormalized trigger-synced counter since offers are RLS-private)
- Mandatory offer photos for singles (optional for bulk)
- Board filters/sort; "Find cards / Sell cards" intent landing
- Point exprifi.com at Vercel (currently parked)

## Post-launch, pre-Lane-1
- Preset buyer questions (canned, no free text)
- Ratings/reputation signals that don't leak identity
- Demand alerts for sellers ("someone wants Jordan slabs") — inverts eBay's saved search
- Mobile app: not yet

## Milestones (locked sequence)
- **M1 (NOW):** Lane 2 liquidity test — seed with Kyle's following, concierge fulfillment. Gate: liquidity metrics (see metrics.md).
- **M2:** Lane 1 — instant price-match engine (inventory uploads, race mechanic, load-bearing final confirm). Only after M1 proves out.
- **M3:** Escrow-by-default (Stripe Connect; optional rail already live from Aug 8).
- **M4:** Monetization on (model decision pending — see fees-and-monetization.md).

## Where AI plays
- **Pricing:** suggest need budgets and opening offers from comps (Lane 1's "suggest opening offer at cheapest ask" is the seed of this)
- **Need generation:** photo/description → structured need; later, parse "WTB" posts from FB-group syntax
- **Search/matching:** semantic match of filter requests to seller inventory (the Lane 1 engine generalized to bulk)
- **Recommendations:** demand alerts ranked by seller's actual inventory
- **Content ops:** Higgsfield credits (already purchased, connected) for ad images/video

## Guardrails (standing)
Vertical slices before polish. Talk Kyle out of escrow-default, catalog, or Lane 1 before Lane 2 liquidity is proven. No free-text chat, ever, pre-escrow.

Related: [marketplace-model.md](marketplace-model.md) · [metrics.md](metrics.md) · [tech-stack.md](tech-stack.md)
