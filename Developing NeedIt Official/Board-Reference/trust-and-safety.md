# Trust & Safety

eBay's weakest flank; a strong story here is a real edge — but for Exprifi, trust design doubles as **leak defense** (marketplaces die when parties meet on-platform and transact off). These are locked principles, not features to trade away.

## Leak defense (core, locked)
- **Structured offers only.** No public chat, no free text — negotiation is Accept/Counter/Decline on price. Planned: preset canned buyer questions ("Is price firm?", "More photos?") — still no free text.
- **Masked identity.** Pseudonymous usernames everywhere; email never shown. Real identity/contact revealed only at match (later: only when funded).
- **Escrow on-platform** (Stripe Connect). Until payments are default, match = identity reveal and the transaction completes off-platform by necessity — acceptable only during the liquidity-proving phase. Stripe ships Aug 8, 2026 as an optional rail.

## Fraud prevention
- **Offer photos:** planned mandatory for single-card offers (proof-of-card fights fakes), optional/encouraged for bulk (friction would suppress offer volume during the liquidity test). Revisit with real usage.
- Grading as trust infrastructure: condition fields lean on PSA/SGC/Beckett standards (see glossary.md).
- RLS everywhere: offers private to buyer, private wants invisible to everyone else.

## Buyer/seller protection (roadmap)
Pre-escrow, protection is structural (photos, structured flow, identity masking). Post-M3: funds held in escrow until delivery confirmation; dispute window; refund path. Formal dispute-resolution policy is **not yet designed — board agenda item** before payments become the default rail.

## Ratings & reputation (planned, not built)
Must not leak identity. Candidate signals: deal-completion counts, seller response-rate badges, offer counts on needs ("3 sellers watching"), streaks. Inverting eBay: reputation attaches to *fulfillment behavior* (does this seller deliver on the race?) not listing volume.

## Founder note
Kyle's biggest personal worry is the **customer-service load** of disputes and problems. Design implication: self-serve flows, tight structured interactions (less surface for conflict than free-text marketplaces), and clear policies before scale — the structured-offer model is itself a CS-load reducer.

Related: [marketplace-model.md](marketplace-model.md) · [fees-and-monetization.md](fees-and-monetization.md)
