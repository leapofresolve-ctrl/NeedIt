# Exprifi — Complete Business & Product Brief

*Self-contained context document. Paste this into any AI chat or share with a collaborator to get useful, non-generic input on the project.*

---

## 1. What Exprifi is

Exprifi (exprifi.com — public brand; the repo/infra use the internal codename "needit") is a **reverse marketplace for sports cards**. Instead of sellers listing inventory and buyers searching it, **buyers post the card or lot they WANT** — the "need" — and **sellers come to them** with structured offers. First seller to strike a deal the buyer accepts wins.

The one-line pitch: **demand becomes the listing.**

## 2. Why this matters (the thesis)

- On eBay/COMC/MySlabs, supply is visible but **demand is invisible**. Buyers grind saved searches; sellers list into the void and wait.
- This failure is worst in the **bulk / low-end / "treasure hunt" segment**: you simply cannot search eBay for "a 5,000-count box of 2019–21 basketball with some rookies" or "any lot of PSA 8+ vintage Yankees under $200." These deals happen ad-hoc in Facebook groups, Instagram DMs, and live breaks — chaotic, trust-poor, unsearchable.
- Sellers (especially bulk resellers and breakers) sit on huge inventory with high listing friction. A feed of **purchase intent** ("here's a buyer with a budget, right now") is far more valuable to them than another listing slot.
- If Exprifi owns the demand graph of the hobby — who wants what, at what price, right now — that data and liquidity become a moat no listing site has.

## 3. Audience & go-to-market

- **Founder advantage:** Kyle has an existing following in the bulk/low-end card community (VoloksVault Sports Cards LLC). Launch = seed the board with that audience.
- **Beachhead:** bulk resellers and breakers — critically, they are **buyer AND seller at once**, so one recruited user seeds both sides of the marketplace.
- **Up-market climb:** after liquidity is proven in bulk, move into **high-value singles**, where the real revenue (finder's fees) lives.
- GTM sequence: followers → concierge-style seeding ("post what you need, I'll make sure sellers show up") → measure → widen.

## 4. The two-lane strategy (locked decision)

- **Lane 2 — open request board (BUILT, live MVP):** a public board of open needs. Anyone can post a need (single card or bulk/filter request); sellers respond with structured offers. This is deliberately the MVP because bulk/filter requests can't be price-matched algorithmically.
- **Lane 1 — instant price-match engine (the moat, Milestone 2, NOT built):** sellers upload inventory with asks; a buyer states a card + max price; the system finds matches at/under it, suggests an opening offer at the cheapest ask, broadcasts to matching sellers who **race** to accept; first to accept claims it; a **final confirm** (seller still has the card + buyer's final yes) commits the deal atomically — no double-sell. The final-confirm step is load-bearing.
- **Rule: earn Lane 1 with Lane 2.** Prove people post and sellers respond before building the engine.

## 5. Leak defense (core design principle)

Marketplaces die when parties meet on-platform and transact off-platform. Exprifi's defenses, all locked decisions:

- **Structured offers only — no public chat, no free text.** Negotiation is Accept / Counter / Decline on price (10-round cap). Planned: preset canned buyer questions ("Is price firm?", "More photos?") — still no free text.
- **Masked identity:** pseudonymous usernames everywhere; real identity/contact revealed only when a deal is matched (later: only when funded).
- **Escrow on-platform** (Milestone 3, Stripe Connect planned). Until payments exist, match = identity reveal and the transaction completes off-platform by necessity — acceptable during the liquidity-proving phase.

## 6. Monetization (locked, not yet charging)

- **Bulk lane:** subscription / flat fee (bulk deals have thin margins; % fees don't fit).
- **High-end singles:** ~5% finder's fee (justified by the platform literally finding the buyer/seller).
- **MVP charges nothing** — liquidity first.

## 7. Milestones

- **M1 (NOW):** Lane 2 liquidity test. Seed the board with Kyle's followers; concierge fulfillment. **Metrics: % of needs receiving ≥1 offer, and time-to-first-offer.**
- **M2:** Lane 1 price-match engine (only after M1 proves out).
- **M3:** Payments/escrow (Stripe Connect).
- **M4:** Monetization switches on.

## 8. What is BUILT and LIVE today (need-it.vercel.app)

The complete Lane-2 loop, end to end:

1. **Auth + pseudonymous username onboarding** (email/password; username required; email never shown).
2. **Post a Need** — title, description, single vs bulk, sport, max budget, condition (e.g. "psa 9"), expiry (24h/3d/7d), optional reference photo.
3. **The Board** (home) — open needs with badges (Single/Bulk, sport, condition), budget, time-left countdown, photo thumbnails.
4. **Private wants → publish** — save wants to a private wishlist, publish to the board later ("put the call out"); expiry starts at publish; private rows invisible to everyone else (RLS-enforced).
5. **Structured offers** — non-owners send price + condition + optional photo + note on any need. Offers are **private to the buyer** (row-level security).
6. **Counter-offer negotiation** — Accept / Counter / Decline, whose-turn tracking, "X counters left" (cap 10), accept locks the live price.
7. **Match flow** — buyer accepts → atomically: siblings auto-declined, need flips to "matched", deal record created, "It's a match!" panel reveals the counterparty. Guarded against double-accepts.
8. **Public profiles / want boards** — `/u/<username>` shows a member's open needs; owner view doubles as buyer command center (offer counts per need).
9. **Seller command center** — "Your offers" on own profile with status badges ("Your move — counter waiting"); active offers only.
10. **Completed deals** — `/completed-deals` split into Bought / Sold.
11. **History** — paginated log of past needs on the profile.
12. **Notifications** — in-app bell (unread badge, 15s poll + focus refresh, hover preview), `/notifications` page, driven by DB triggers (new offer → buyer; counter/accept/decline → the right party; actor never self-notified).
13. **Email notifications — LIVE (Jul 2, 2026)** — Resend-verified domain, sender `Exprifi <notifications@exprifi.com>`, per-user opt-out toggle in `/settings`, leak-safe emails (no counterparty identity, just "there's an update on your need" + link).

**Notable NOT built yet:** offer-count badge on public board cards (social proof / "sellers race" signal), mandatory offer photos (planned: required for singles, optional for bulk), preset buyer questions, board filters/sort, buyer/seller mode landing page, seller inventory/showcase (deliberately deferred — it's a Lane 1 piece), payments, ratings/reputation, mobile app.

## 9. Stack & infra

- **Next.js 16 (App Router) + TypeScript** on Vercel — live at need-it.vercel.app.
- **Supabase** — Postgres, Auth, Row-Level Security everywhere, Storage for photos; DB triggers for notifications; DB webhook → Vercel route → **Resend** for email.
- **Tailwind + shadcn/ui.** Money stored as **integer cents**. No secrets in `NEXT_PUBLIC_*` vars.
- exprifi.com domain owned (Namecheap) but still parked — the app isn't public-facing yet by choice.

## 10. Design direction (active workstream)

Kyle's words: the site works but has a **"basic feel"** — it must grow into a **modern marketplace**. Trust is a conversion input: sellers racing to win a buyer need the venue to look legit. Direction being explored: clean StockX/Whatnot-adjacent look (black/white base, one strong accent, card-photo-forward grid, bold type) vs. a darker collector/treasure-hunt aesthetic; mockups of 2–3 directions are the next step. A planned "Find cards / Sell cards" split landing frames **intent, not account type** (every account is both buyer and seller).

## 11. Standing guardrails (how decisions get made)

- Build **vertical slices** end-to-end before polishing.
- **Don't** build escrow, catalog, or Lane 1 before Lane 2 liquidity is proven — actively talk the founder out of it.
- Liquidity metrics (% needs with an offer, time-to-first-offer) are the north star until M1 passes.
- Leak defense is never traded away for engagement features (e.g., no free-text chat, ever, pre-escrow).

## 12. Open questions worth brainstorming

- How to make the board feel **alive** at low volume (empty-marketplace cold start)?
- Social-proof mechanics that don't leak identity (offer counts, "3 sellers watching", streaks?).
- Trust signals pre-payments: photo requirements, seller response-rate badges, deal-completion counts?
- Retention loops for sellers: saved searches on *demand* ("alert me when someone wants Jordan slabs"), which inverts eBay's saved-search model.
- How breakers specifically could use the platform (post-break bulk liquidation → needs matching?).
- Pricing psychology for the eventual bulk subscription vs. per-deal fees.
- What "modern marketplace" UI patterns fit a demand-side board (vs. the supply-side grids of StockX/Whatnot)?

*(When brainstorming: respect the locked decisions in §4–6 and the guardrails in §11 — ideas that require public chat, off-platform contact, or building Lane 1 first are non-starters.)*
