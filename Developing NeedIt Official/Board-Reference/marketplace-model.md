# Marketplace Model

## Core mechanic: the reverse marketplace
Buyers post **needs** (the demand is the listing); sellers respond with **structured offers**; first accepted offer wins. No auctions, no fixed-price supply catalog. Price discovery happens through **Accept / Counter / Decline** negotiation (10-round cap, whose-turn tracking, accept locks the live price).

## C2C, dual-role accounts
Pure C2C. Every account is both buyer and seller — the UI frames **intent** ("Find cards" vs "Sell cards"), never account type. The beachhead user (breaker/reseller) is both at once, seeding both sides.

## Listing types (needs)
- **Single** — one specific card (e.g., '86 Fleer Jordan PSA 8), with condition + max budget.
- **Bulk / filter request** — a described lot or criteria ("5,000-ct box of 2019–21 basketball with rookies," "any PSA 8+ vintage Yankees under $200"). Cannot be price-matched algorithmically — which is why the open board (Lane 2) is the MVP.

Need anatomy: title, description, single/bulk, sport, max budget (integer cents), condition, expiry (24h/3d/7d), optional reference photo. Needs can start as **private wants** (wishlist) and be published later — "put the call out" — with expiry starting at publish.

## Offer anatomy
Price + condition + optional photo + note. Offers are **private to the buyer** (RLS-enforced). No public chat, no free text negotiation — ever, pre-escrow (leak defense). Planned: preset canned buyer questions; mandatory photos for single-card offers.

## Match flow
Buyer accepts → atomically: sibling offers auto-declined, need flips to "matched," deal record created, counterparty identities revealed ("It's a match!"). Guarded against double-accepts.

## Categories / verticals
Sports cards only at launch (all sports, vintage → current). Expansion thesis: Disney, TCG, then other collectibles — Amazon-started-with-books.

## Two lanes (locked)
- **Lane 2 — open request board (BUILT, live):** the public board of open needs. Handles bulk + filter requests that no algorithm can match.
- **Lane 1 — instant price-match engine (M2, not built):** sellers upload inventory with asks; buyer states card + max price; system suggests opening offer at cheapest ask; broadcast to matching sellers who **race**; first accept claims it; **final confirm** (seller still has it + buyer's final yes) commits atomically — load-bearing, prevents double-sell.
- Rule: **earn Lane 1 with Lane 2.**

Related: [trust-and-safety.md](trust-and-safety.md) · [feature-roadmap.md](feature-roadmap.md)
