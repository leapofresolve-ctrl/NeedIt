# Exprifi — Status & Kickoff Brief

*Open this at the start of a new Cowork chat to get back up to speed fast. Full running detail lives in `build-log.md` (same folder).*

---

## What Exprifi is

A **reverse marketplace for sports cards**: buyers post the card or lot they want, and sellers bring it to them with structured offers. Public brand is **Exprifi** (domain: exprifi.com); "needit" is just the internal codename for the repo/folders/Supabase project.

**Audience / GTM:** launch to the bulk / low-end "treasure-hunt" crowd Kyle already has a following in — breakers/resellers who are buyer AND seller at once (seeding both sides at once) — then climb up-market into high-value singles where the revenue is.

## Locked decisions (don't relitigate)

- **Two lanes.** Lane 2 = open request board for bulk + filter requests — **this was the MVP, and it's now built.** Lane 1 = instant price-match against seller inventory — the moat, **Milestone 2**.
- **Leak defense is core:** structured offers (no public chat), pseudonymous usernames (masked identity), escrow only on-platform. Payments = M3.
- **Monetization:** subscription/flat for the bulk lane; 5% finder's fee for high-end singles. The MVP charges nothing.
- **Earn Lane 1 with Lane 2** — prove people post and sellers respond before building the price-match engine.

## Stack & where everything lives

- **Next.js 16 (App Router) + TypeScript** on **Vercel** — live at **https://need-it.vercel.app**
- **Supabase** — Postgres / Auth / RLS / Storage. Project "needit", ref `cfcjcxgmntkatamflaqh`, org VoloksVault (free tier).
- **Tailwind + shadcn/ui.**
- **GitHub:** `github.com/leapofresolve-ctrl/NeedIt`, branch `main`. The app lives in the `needit/` subfolder; Vercel's **Root Directory = needit** (the parent folder name has spaces, which Vercel can't use in serverless function paths).
- On disk: app at `~/Desktop/NeedIt/needit`; planning docs + this file + `build-log.md` in `~/Desktop/NeedIt/Developing NeedIt Official`.

---

## ✅ What's built (the full MVP loop — LIVE)

1. **Auth + username onboarding** — email/password signup; new users must choose a pseudonymous username (the DB no longer auto-fills it from email — that protected identity).
2. **Post a Need** — title, description, single/bulk, sport, max budget (stored as integer cents), condition, expiry (24h/3d/7d), **+ optional reference photo**.
3. **The Board** (home) — Exprifi-branded; lists open needs with badges, budget, time-left, photo thumbnails; empty state; nav.
4. **Structured offers** — on a need's detail page, non-owners send an offer (price, condition, optional photo, note) — no public chat. Buyer sees offers privately (enforced by row-level security).
5. **Accept / decline → match** — buyer accepts an offer; atomically the offer is accepted, siblings auto-decline, the request flips to "matched", a deal record is created, and an **"It's a match!"** panel reveals the seller. Guarded against double-accepts.
6. **Public profiles + want boards (Jun 28)** — `/u/<username>` shows a member's open public needs; owner view doubles as the buyer command center (offer-count badges + matched/closed history). Usernames link everywhere (header, board cards, request detail); the header shows @username instead of the email.
7. **Private vs public wants (Jun 28)** — save a want as a private wishlist, publish to the board later ("put the call out"); expiry starts at publish. Private rows are owner-only via RLS; they never appear on any board. Private wants are **editable** before publishing.
8. **Avatar account menu (Jun 28)** — round avatar in the top-right (My board / Post a Need / Log out), like a normal social app.
9. **Counter-offers (Jun 28-29)** — structured price negotiation (no chat): either side can Accept / Counter / Decline on their turn; accept locks the live price; **round cap = 10** (tune later); each offer shows a "counters left" countdown. Errors now surface on-screen.
10. **Seller command center (Jun 29)** — "Your offers" section on the profile lists offers you've sent; a buyer's counter shows up as "Your move — counter waiting" on the offerer's own page.
11. **Completed deals (Jun 29)** — in the avatar dropdown → `/completed-deals` page with Bought + Sold transactions.
12. **History log (Jun 29)** — paginated (10/25/50 + ← →) full-width log of past needs at the bottom of the profile.

## How we work (important for the next session)

- **Claude writes the feature code directly** into `~/Desktop/NeedIt/needit` (the Cowork folder is mounted at `~/Desktop/NeedIt`), type-checks it, then **Kyle commits + pushes** from `~/Desktop/NeedIt` (`git add -A && git commit -m "…" && git push`) → Vercel auto-deploys → Claude verifies live in the browser. (We moved away from Cursor's AI agent — it kept building in the wrong folder and made a stray `gradesave` repo, which can be ignored/deleted.)
- **Two test accounts** for the buyer↔seller flow: `voloksvault` (kylevolo72@gmail.com) and `voloktest`.
- **Gotchas:** keep `cacheComponents` OFF in `next.config.ts` (Next 16 default breaks auth pages); if git says the index is locked, run `rm -f ~/Desktop/NeedIt/.git/index.lock`; don't run git from Claude's sandbox.

---

## ⬜️ Next steps (suggested priority)

1. ~~**"My Needs" inbox**~~ — **DONE** via the owner profile view (`/u/<username>`): your own needs with offer counts + matched/closed history.
2. **Offer-count badge on the public board** — a small colored badge on each card showing # of offers, as public social proof / "sellers race" signal. *Note: offers are private by security rules, so this needs a denormalized counter on each need kept in sync by a trigger.* (The owner's own profile already shows counts; this is for the public board.)
3. **Counter-offers (NEW — Kyle):** let a buyer (and/or seller) counter an offer's price instead of a flat accept/decline — lightweight negotiation that still stays inside structured offers (no public chat). Decide who can counter whom and how many rounds.
4. **Mandatory offer photos (NEW — Kyle):** require a photo when sending an offer (currently optional). *Recommendation: make it required for **single-card** offers (proof-of-card builds trust and fights fakes/scams, and it's easy to photo one card), but keep it optional/encouraged for **bulk lots & filter requests** where a single photo is less meaningful and friction could suppress the offer volume we need during the liquidity test. Revisit based on real usage.*
5. **Buyer/Seller "mode" landing** — split landing framed as intent ("Find cards" vs "Sell cards"), NOT account type (everyone keeps one account that's both). Black/white base + one accent color per mode as a light cue.
6. **Polish** — board filters/sort (sport/type, newest/budget), pixel sizing/UI cleanup, "My Needs" nav link.

## Then: prove it before Lane 1

- **M1 — liquidity test:** seed the board with Kyle's followers; concierge fulfillment. Measure **% of needs that get an offer** and **time-to-first-offer**. Only after this is proven do we build **Lane 1 (M2)** — the instant price-match engine — and later **M3 payments** (Stripe Connect escrow) and **M4 monetization**.

## Standing guardrails

- Build vertical slices end-to-end before polishing.
- Talk Kyle out of adding escrow, catalog, or Lane 1 before Lane 2 liquidity is proven.
- Money as integer cents everywhere. Never put a secret key in a `NEXT_PUBLIC_` var.
