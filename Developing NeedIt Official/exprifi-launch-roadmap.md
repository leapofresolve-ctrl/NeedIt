# Exprifi — 30-Day Launch Master Plan

*Jul 14 → Aug 15, 2026 (launch day = Saturday Aug 15). Clock reset Jul 14 to start fresh from today — every week shifted forward one week from the original Jul 8 plan. This document supersedes `next-session-plan.md` — its six priorities are absorbed into Week 1–2 below. Locked decisions from the build plan still stand. Written Jul 8, 2026 with Kyle's four scope answers: payments live at launch · $300+/mo budget · Kyle 20–30h/wk (content + community + concierge), Claude (code, docs, agents, support systems) · brand stays 3a.*

> **Reset note (Jul 14):** the Stripe workstream is ~2 weeks ahead of this schedule. The Stripe account is live (VoloksVault Sports Card LLC, acct_1TrhfICPcjNLEMu7) and the full test-mode Connect foundation is already built into the app — separate charges & transfers, recipient-account seller onboarding, hosted Checkout, signature-verified idempotent webhook + state machine, release/ship/refund actions, migration 0009, all typechecking clean (see `STRIPE_SETUP.md`). Remaining Stripe work is the UI buttons, the auto-release cron, live-mode pilot, and Kyle's dashboard toggles — rescheduled below. That buffer is insurance against the guardrail risk: if liquidity is weak at the W2 gate, we still pause payments and spend the slack on demand.

---

# 🔴 REPLAN — Jul 27, 2026. This section supersedes §2 (the week-by-week timeline) and the launch date everywhere below.

## What happened

Today is the W2 liquidity checkpoint. The written gate was: **≥50 users, ≥20 needs posted, ≥40% offer rate → below that, Stripe pauses at test mode and W3 becomes a seeding sprint.**

**Actual, verified live on need-it.vercel.app today:** `0 open · 0 offers in play`. Registered users ~2 (both test accounts). Needs posted since the plan was written: 0.

The gate didn't just miss — it wasn't attempted. The soft launch to the ~50 inner circle and the "post your own buy-list" seeding never ran. Everything the plan called "Claude's lane" is ahead of schedule; everything in the demand lane is at zero. **The board being empty is not a schedule problem, it is the only problem.** Every other workstream — Stripe, security, brand — is polish on a room nobody has entered.

## The call (Kyle, Jul 27): launch date moves back.

**Proposed new launch: Saturday, September 26, 2026** — 8.5 weeks out. *Kyle to confirm; alternate is Sat Sept 12 if the seeding sprint moves fast.*

Why 8.5 weeks and not 4: the original plan gave seeding two part-time weeks squeezed between shipping deadlines, and it lost. A real seeding sprint needs to be the *only* thing in its weeks. The reset also lets the 3b facelift and public-access work (which is what actually converts a follower into a signup) land *before* the audience arrives — you get one first impression with your following, and a vercel.app URL with a 14px eBay-style filter bar and an empty dark box is not it.

**Stripe drops to test-mode only**, per the pre-agreed cutline. It stays built and green; it does not go live until the liquidity gate is genuinely passed. This is the guardrail working as designed, and it costs nothing — the foundation is done and waiting.

## Replanned schedule

### Phase 1 — Jul 28 → Aug 10 · "Legitimacy + doors open" (Claude-heavy)
The two blocks that must exist before anyone sees this. Full detail in `exprifi-3b-facelift-and-access-spec.md`.
- **Block A — Legitimacy:** domain cutover to exprifi.com (highest legitimacy-per-hour item on the whole plan) · footer + utility strip + entity line · legal pages published · branded 404/500 · favicon + OG · `/how-it-works` · `/help` stub.
- **Block B — Public access:** logged-out browsing of the board and need pages · middleware allowlist→denylist · anon RLS policies + deny-tests · auth-wall modal · **rate limiting must ship with public access, not after** · security headers · sitemap + indexable need pages.
- **Kyle:** the external-setup list that's still outstanding (§10) — Namecheap DNS cutover, Google Workspace + support@, Sentry/Upstash/Turnstile accounts. Plus: write your real buy-list. Not post it yet — write it.

### Phase 2 — Aug 11 → Aug 24 · "The facelift" (Claude-heavy)
- **Block C — Visual pass:** accent discipline (green → data only, buttons → ink) · one primary per screen · Refine sheet replaces the facet bar · 16px type, focus rings, 44px targets, contrast fix · larger first screen with door-sized hit targets · empty-state rebuild · pluralization fix.
- **Block D — Accounts:** username-or-email sign-in · signup path selection (`is_seller` boolean) · Settings expansion: Account + Notifications + Selling toggle · password reset / change email / change password verified end-to-end.
- **Block E — Plans:** `/plans` public page with the worked fee examples. **No billing code.**
- **Kyle: run `voice-builder` — do this in the next few days.** ⏳ *Added Aug 2, 2026.* The Social Media skill department (17 skills) is installed, and **every one of them reads `voice.md` and `about-me.md` first** — post-writer, hook-generator, reels-scripting, post-scorer, all of it. Until those two files exist, the entire social department is blocked and any content it produces will be generic.
  - **What's needed from Kyle:** 3–5 real writing samples. VoloksVault IG/TikTok captions, Whatnot stream blurbs, or Facebook-group posts. Real ones, not written-for-this-purpose ones — the skill analyses actual patterns (sentence rhythm, hook habits, what the voice never does) and explicitly will not invent what isn't in the samples.
  - **Time cost:** ~15 minutes to gather samples, then an interactive interview.
  - **Decided Aug 2, 2026:** produce **two** profiles, not one — `voice.md` (Kyle / VoloksVault register, for social and creator content) and `exprifi-voice.md` (the platform's institutional register, for in-product, landing, and legal copy). Keeps board and legal pages from sounding like a Whatnot stream.
  - **Style overrides:** American English (the skill defaults to British — override it). Keep the skill's em-dash ban for voice/social outputs only; it does not apply to Board-Reference or spec docs.
  - **Blocks:** the entire content ramp below, and the Phase 3 seeding sprint's outbound messaging.
- **Kyle:** content ramp begins — build-in-public clips of the facelift itself. The redesign *is* content.

### Phase 3 — Aug 25 → Sep 14 · "The seeding sprint" (Kyle-heavy — this is the whole ballgame)
**This is the phase the original plan never actually gave time to. Protect it. If something has to be cut, cut from Phase 4, never from here.**
- Kyle posts 10–15 real needs from his own buy-list. You are buyer #1 and the board is never empty again after this.
- Recruit 10 founding breakers to commit: 3 needs posted + 5 needs answered, each.
- Soft-open to the inner 50. Concierge every single need to ≥1 offer in <12h — personally recruit the seller if you have to.
- **The real gate, at Sep 14:** ≥50 users · ≥20 needs posted · ≥40% of needs with ≥1 offer · median TTFO <24h. **If this misses again, we do not launch on Sep 26** — we diagnose demand, and no amount of shipping fixes it.
- **Claude:** Block F (remaining settings, trust surfaces, report affordance, watch/save needs, `published_at` migration) · structured Q&A on offers · realtime board · OG share cards · Concierge Scout + Morning Metrics agents live, feeding Kyle the daily "which needs have no offers and who should you DM" list.

### Phase 4 — Sep 15 → Sep 25 · "Launch prep"
- Security pass 2 · secret rotation (still unconfirmed from W1) · Sentry + uptime + `/api/health` · load pass · dispute/support runbook drill.
- Feature freeze **Sep 21.** Bug-fix only after.
- Board must show 30+ live needs before launch morning.
- Kyle: launch video + partner content queued.

### Sat Sep 26 — Launch.

## What changed vs. the old plan, in one table

| | Old (Jul 14 plan) | New (Jul 27 replan) |
|---|---|---|
| Launch | Sat Aug 15 | **Sat Sep 26** (Kyle to confirm) |
| Stripe | Live mode, optional rail, at launch | **Test mode only** until the real liquidity gate passes |
| Seeding | Squeezed into W2 alongside 8 shipping items | **A dedicated 3-week phase with nothing else in it** |
| Facelift / public access | Not in the plan | **Phases 1–2, before the audience arrives** |
| Fee model | Open board item | **Resolved** — see `Board-Reference/fees-and-monetization.md` |
| Account model | Open | **Resolved** — one account, seller is an upgrade toggle |
| The gate | Jul 27, missed | **Sep 14, and it is a real stop condition** |

## The one thing to keep in view

The plan below this line is still the reference for *how* to do each piece — its detail on Stripe architecture, security, leak defense, CS, and GTM is all still correct and still the source of truth for those workstreams. What changed is only the ordering and the date. The standing guardrail is now doing its job: **earn Lane 1 with Lane 2, and earn payments with liquidity.** The board has to have people on it before anything else matters.

---

## 0. CEO brief — the whole plan in one minute

> ⚠️ **Superseded in part by the Jul 27 replan above.** The strategy, workstream detail (§3–§11) and standing guardrails still hold; the dates, the Aug 15 launch, and the "payments at launch" sequencing do not.

**What we're doing:** taking the working Lane-2 MVP from "live at a Vercel URL" to "public marketplace at exprifi.com with secure checkout" in 32 days, while running the M1 liquidity test that everything else depends on.

**The strategy in one sentence:** launch the board publicly in week 1 (liquidity test starts immediately), finish wiring the already-built Stripe checkout in parallel, and ship it as an **optional rail** by Aug 15 — so payments never block the launch, and the launch never waits on payments.

**The one honest warning (then I'll drop it):** the standing guardrail says don't build escrow before Lane 2 liquidity is proven. You've overridden that with eyes open. The compromise built into this plan: checkout ships *inside* the month but the north-star metrics stay liquidity metrics, and if week-2 numbers are bad, we pause the Stripe workstream and fix demand first. Payments on a dead board is a paint job on an empty store. Proposed cutline (veto or tighten it now, then it's law): **if <40% of needs get an offer by Jul 27, Stripe drops to test-mode-only and the week-3/4 effort shifts to seeding.**

**Why payments-at-launch is also a real weapon:** the moment a deal can fund on-platform, we can (a) delay identity reveal until *after* funding — the single strongest anti-leak lever we have, and already the locked end-state ("masked identity until a deal funds"), (b) offer an Exprifi Guarantee that Facebook groups and IG DMs can never match, and (c) start measuring GMV even at 0% fees.

**What success looks like on Aug 15:** exprifi.com live · 100+ registered users · 30+ open needs on the board at launch · ≥60% of needs getting ≥1 offer · median time-to-first-offer <12h · first funded deals through checkout · zero security incidents · support answered <24h.

**Your job this month:** content (3 posts + daily stories cadence), founding-member recruitment (target: 10 committed breakers, 100 founding users), concierge seeding (make every early need get an offer), and ~10 external account setups I can't do for you (each is a 15–30 min task, all listed in §10).

**My job:** all code (product polish, Stripe, security hardening, leak detection), all documents (legal drafts, CS protocol, content calendars), and building + running the five Claude agents that automate support, metrics, moderation, content drafting, and concierge targeting.

---

## 1. Launch definition & north-star metrics

"Live" on Aug 15 means: public site at exprifi.com · anyone can sign up, post, offer, negotiate, match · funded checkout available on matched deals (optional; off-platform close still allowed during M1) · help center + support inbox staffed by agent+Kyle · legal pages published · monitoring + backups running.

| Metric | Now (Jul 14) | Launch-day target | Post-launch W+2 target |
|---|---|---|---|
| Registered users | ~2 (test) | 100 | 250 |
| Open needs on board | ~4 | 30+ | 75+ |
| % needs with ≥1 offer (north star) | 100% (tiny n) | ≥60% | ≥70% |
| Median time-to-first-offer (north star) | 21h | <12h | <8h |
| Matches / week | ~1 | 5+ | 15+ |
| % of matches funded via checkout | — | ≥25% | ≥50% |
| GMV (tracked, not charged) | — | first $1k | $5k+ |
| Support first-response | — | <24h | <12h |
| Leak-attempt flags actioned | — | 100% within 24h | 100% |

The `/metrics` admin dashboard already computes the liquidity metrics. Additions needed: GMV, funded-%, flag counts (week 3).

---

## 2. Week-by-week timeline

### Week 1 — Jul 14–20 · "Make it real" (infrastructure, security, public domain)

**Claude (code + docs):**
- Security hardening pass 1 (full list §5): Supabase Advisors run, RLS deny-tests, auth settings (captcha, leaked-password protection, email confirmation), rate limiting, security headers, secret rotation, timing-safe webhook compare.
- Domain cutover support: point exprifi.com at Vercel, update Supabase Site URL + redirect allowlist, canonical URL, 301 from need-it.vercel.app.
- Brand-system completion pass 1: need detail page, offer flow, match panel (one-shot `.match-in` celebration — spec ready in globals.css), "1 offers" pluralization nit.
- `/api/health` route + uptime monitoring; Sentry client+server; daily-metrics JSON endpoint (token-protected) for the Metrics agent.
- **Stripe UI wiring** (backend already built, test mode): "Connect payouts" button on settings, "Fund this deal" on the match panel, ship/confirm-delivery on the deal view — hooked to the existing routes/actions without disturbing the locked 3a surfaces.
- Draft: Terms of Service, Privacy Policy, Prohibited Items & Counterfeit policy, Off-Platform Solicitation policy (Termly/paid template as base, tuned to marketplace).

**Kyle (external setup + content):**
- ~~Reconnect Cowork~~ **done** — the app repo at `~/Desktop/NeedIt` is mounted and code work is live.
- ~~Open Stripe account + apply for Connect platform profile~~ **done** — account live (VoloksVault Sports Card LLC, acct_1TrhfICPcjNLEMu7). This resolves the entity question too: d/b/a Exprifi under the existing LLC (§8/§9.1).
- **Stripe go-live checklist (only Kyle can do — see `STRIPE_SETUP.md`):** flip the two dashboard toggles (accept loss liability on the platform profile · turn on Radar for Platforms); paste test keys + Supabase service-role key into `.env.local`; apply migration 0009; run `stripe listen --forward-to localhost:3000/api/stripe/webhook`, drop the `whsec_` into `.env.local`, then walk the §5 smoke test.
- Supabase Pro ($25/mo, enables daily backups + PITR add-on), Vercel Pro ($20/mo).
- Google Workspace on exprifi.com (~$7–9/mo) → `kyle@exprifi.com`, `support@exprifi.com`. (Namecheap's free forwarding died when we switched to Custom MX for Resend — Workspace MX goes on the root domain, Resend's stays on `send.`, they coexist.)
- Namecheap DNS: cutover records per my runbook.
- Content: announce-the-build teaser #1–2; DM the first 10 breaker candidates for founding-partner commitments.

**Gate at end of W1:** exprifi.com resolves, security pass 1 done, Stripe test-mode loop smoke-tested green end-to-end (Connect app already submitted; verification gated only on Kyle's two toggles).

### Week 2 — Jul 21–27 · "Make it convincing" (trust surfaces, soft launch, CS live)

**Claude:**
- **Structured Q&A on offers** — the "better chat experience" that can't leak (§4B): preset buyer questions ("Is price firm?", "More photos?", "In hand?", "Bundle?"), structured seller responses, rendered as a chat-style timeline with bubbles. Feels like messaging; every payload is canned. Scoped Jun 29, now built.
- Mandatory offer photos for singles (form + DB check constraint), optional for bulk — as agreed.
- Supabase Realtime: bell + live board updates replace the 15s poll ("presence is shown, not flashed" — cards appearing live IS the presence).
- Dynamic OG share cards per need (`@vercel/og`): "WANTED: 2019 Prizm Ja #249 · $150 max · 3 sellers racing" — every shared need is an ad. SEO pass: metadata, sitemap, need pages indexable.
- Onboarding: first-run tour, empty-state prompts, "post your first need" flow.
- Help center (`/help`: FAQ from CS protocol), `/support` contact form → `support_tickets` table + email to support@.
- **CS protocol doc** (§6) + **Support Desk Agent** live on schedule (Gmail is already connected in Cowork).
- **Stripe auto-release timer** — the one piece the built foundation still needs: scheduled job that releases escrow N days after delivery-confirm/tracking-delivered (decision §9.3), plus the funded-deal identity-reveal flip + logistics thread verified end-to-end in test mode. (Schema, checkout, and webhook are already built — see reset note.)

**Kyle:**
- Soft launch to inner circle (~50 trusted followers): "founding members, the doors are cracked."
- Concierge seeding: personally ensure every posted need gets ≥1 offer <12h (recruit the seller yourself if needed).
- Post own real buy-list as needs (5–10). Founding breakers each commit: 3 needs posted + answer 5 needs.
- Content: 3 posts (formats in §7); collect launch-video b-roll.
- Approve legal drafts → publish to site footer.

**Gate at end of W2 (the liquidity checkpoint):** ≥50 users, ≥20 needs posted, **≥40% offer rate**. Below that → Stripe pauses at test mode, W3 becomes a seeding sprint. At/above → full speed.

### Week 3 — Jul 28–Aug 3 · "Make it safe" (payments end-to-end, leak defense, reviews)

**Claude:**
- **Verify + harden the (already-built) Stripe Connect flow** (§4C): full test-mode walk of seller recipient onboarding → buyer hosted Checkout → funds held on platform → delivery-confirm + auto-release → refunds → dispute webhooks, with admin refund controls and dispute lanes confirmed. Identity-reveal flip confirmed: on funded deals, counterparty revealed *after* payment (unfunded matches keep current behavior during M1). (Build is done; this week is proving it under adversarial cases.)
- **Leak detection layer** (§5B): server-side pattern blocking on every text field (emails, phones, IG/TT/X handles, venmo/paypal/zelle/cashapp, URLs, spelled-out digits), flag queue + admin review page, report button on offers/needs, 3-strike policy wiring.
- Reviews v1: post-deal, structured (1–5 + canned tags: "fast shipper", "as described"), shown on profile trust strip (spec already in 3a).
- Offer-photo watermarking (light diagonal "exprifi") — deters reverse-image contact hunting.
- Metrics additions: GMV, funded-%, flags. Load/perf pass (image optimization, skeletons).

**Kyle:**
- Stripe: connect own seller account as guinea pig through the built recipient onboarding (platform verification already handled via the W1 toggles).
- Founding-100 drive (perk decision §9); breaker partners confirm launch-day participation.
- Content ramp: 3 posts + engage every commenter; record launch video draft.

### Week 4 — Aug 4–10 · "Make it bulletproof" (live-money pilot, rehearsal)

**Claude:**
- Stripe **live mode** + pilot: 2–3 real funded deals (Kyle's own buys) end-to-end including a deliberate refund.
- Security pass 2: re-run Advisors + deny-tests on all new tables (tickets, payouts, reviews, flags), `npm audit`, dependency updates, dispute-runbook drill.
- All five agents running on schedule (§6B). Launch-day war-room checklist. Analytics events final.
- Feature freeze **Aug 10**. Bug-fix only after.

**Kyle:**
- Produce launch-day content (video + 3 posts + partner posts scheduled).
- Pre-seed: board shows 30+ live needs before launch morning.
- Dry-run the runbooks with me: a support ticket, a dispute, a leak flag.

### Launch — Aug 11–15

Aug 11–14: freeze, seed, rehearse, partner content queued. **Sat Aug 15: public launch.** Launch video + simultaneous partner posts, Kyle in comments/DMs all day, war room = Command Center artifact + Sentry + /metrics; concierge sprint on every new need. W+1: retention emails on, weekly digest email of hottest needs, first weekly metrics review → next roadmap.

---

## 3. Competitive landscape & positioning

| Platform | Model | Seller cost (2026) | Demand visible? | Bulk-friendly? |
|---|---|---|---|---|
| eBay | listings + auctions | ~13.25% + $0.30, +2–10% promoted in practice | No (saved searches only) | Poor |
| Whatnot | live breaks | ~8% + processing (~11% all-in) | No | Streams only |
| Fanatics Collect | auctions/marketplace | 0% seller, 20% buyer premium | No | No |
| COMC | consignment | 1% graded/3% raw + processing + storage | No | No |
| MySlabs | listings | 2% graded / 3% raw | No | Weak |
| Alt | vault/exchange | low single-digit | No | No (graded singles) |
| Facebook groups / IG DMs | chaos | 0% + scam risk | Sort of (posts scroll away) | Yes — our real competitor |
| **Exprifi** | **reverse marketplace** | **0% at launch → bulk sub + 5% high-end finder's fee** | **Yes — demand IS the product** | **Built for it** |

**Positioning:** we don't compete with eBay for listings; we compete with Facebook groups and DMs for *deals that can't be listed* — and we beat them on trust (structured offers, escrow, guarantee) and reach (indexable, shareable, alertable demand). Fee story at monetization time: "sellers pay eBay 13% to wait; on Exprifi buyers come to you, and bulk costs a flat sub."

**Scale path (niche → giant):** the board is category-agnostic by design — category pills (Sports / TCG / Comics / "Coins — soon") are already in the locked brand system, TCG accent #B78AE8 already tokened. Sequence: prove sports bulk (now) → high-end singles + Lane 1 (M2) → TCG (same sellers, same mechanics) → comics/coins → general "anything with a want-list" collectibles. Infra ladder: Supabase Pro → read replicas → dedicated; Postgres FTS → Typesense/Algolia when search matters; card-catalog taxonomy arrives with Lane 1 (it's the matching layer anyway); mobile app post-PMF; first hires (CS/moderation contractor) around 500 DAU. Never a rewrite — the stack scales to eBay-shaped loads long before we're eBay-shaped.

---

## 4. Product workstream detail

### A. Website upgrades (within locked 3a — no re-litigating the brand)
1. Finish brand surfaces: need detail, offer flow, match panel celebration, profile trust strip + tabs, bottom mobile nav (Board/Post/Activity/You), 390px mobile-first pass.
2. Split-landing intent doors are built for logged-out; add the "LIVE BOARD" stats header ("27 open · 84 sellers on") fed by real counts.
3. Realtime board + bell (Supabase Realtime). New-need rows slide in; offer counts tick live. This is the "alive at low volume" answer: motion from *data*, not decoration — the one place the motion rules welcome it.
4. OG share cards + SEO (need pages indexable — every need is a seller-acquisition landing page).
5. Onboarding tour + empty states + "seed needs" curation for first-visit credibility.
6. Performance: next/image + Supabase transforms, skeletons, LCP <2.5s on 4G.
7. PWA manifest (installable; push notifications post-launch).

### B. "Better chat" without chat (leak-safe messaging)
Free-text chat pre-escrow is the one thing we never ship — it's how every deal leaks. Instead:
- **Structured Q&A timeline** on each offer: buyer taps preset questions, seller answers with constrained inputs (yes/no, number, photo, canned phrases). Rendered as chat bubbles with timestamps + read states — *feels* like messaging, leaks nothing.
- Counter-offers already give price negotiation; the Q&A thread wraps it into one conversation view.
- **Post-funding unlock:** once a deal is funded, open a scoped free-text thread for logistics (address confirm, tracking) — leak risk is gone because the deal already closed on-platform, and it makes paying the *better* experience, not just the safer one. Light moderation via the same pattern-scanner.

### C. Stripe Connect design — **built in test mode (Jul 2026), ahead of schedule**
*Status: server layer complete in the app — migration 0009, Stripe client/config, service-role admin client, seller onboarding route, buyer checkout route, signature-verified idempotent webhook + state machine, release/ship/refund actions; typechecks + lints clean. Remaining: UI buttons (W1), auto-release cron (W2), live-mode pilot (W4). Runbook = `STRIPE_SETUP.md`.*
- **Architecture (validated by Stripe's planner):** separate charges & transfers. Buyer pays the platform (Payment Intent, money as integer cents, always); funds sit in platform balance; on delivery confirmation (or auto-release timer — see §9), transfer to seller with `source_transaction`; manual payout schedule. Stripe caps holds (~90 days max) — fine, our cycle is days. Note: `application_fee_amount` is incompatible with separate charges/transfers anyway — 0%-at-launch is required, and later we take our cut by simply transferring less than the charge.
- **Seller onboarding — recipient accounts, not full Express merchants:** connected accounts configured as `configuration.recipient` + `stripe_transfers` capability (v2 accounts API, never legacy `type: 'express'`). Sellers only ever *receive* transfers, never accept charges — lighter, faster KYC for breakers; Express dashboard still gives them their payout view. Stripe runs KYC/AML and handles 1099-K (back at federal $20k/200 for 2026 under OBBBA; a few states lower — Stripe files them, not us).
- **Checkout:** hosted Stripe Checkout (redirect) for MVP — fastest to ship, best conversion, least PCI surface. Move to embedded Elements later if we want the masked-identity reveal inline without a redirect.
- **Two dashboard toggles are load-bearing (Kyle-only, W1):** because we're merchant of record on separate charges/transfers, we own pricing (`fees_collector: application`) and loss liability (`losses_collector: application`) — Stripe requires accepting loss liability on the platform profile before connected accounts can be created, and Radar for Platforms should be on from day one since we carry fraud/dispute liability.
- **Fees during free period:** platform takes $0 (no application fee) but eats Stripe's ~2.9% + $0.30 — that's our cost of the guarantee, budgeted; decision open (§9) on pass-through.
- **Flow:** match → "Fund this deal" CTA (optional in M1) → checkout → funded: identities revealed + logistics thread opens → seller ships + enters tracking → buyer confirms (or timer) → transfer + payout → review prompt.
- **Refunds/disputes:** buyer-cancel before ship = full refund; INAD = return-then-refund; no-ship in 5 days = auto-refund; chargebacks = platform responds via Radar/dispute API per runbook. `payment_status` state machine on deals: `unfunded → funded → shipped → released → refunded/disputed`.
- **What we do NOT build:** subscriptions/fee collection (M4), instant payouts (later), international (US-only at launch), Stripe Identity (with Lane 1 high-value).
- **Compliance that payments switches on:** marketplace-facilitator sales tax — register home state, run Stripe Tax in monitor mode from day 1, register elsewhere as nexus thresholds approach (typically $100k or 200 txns/state — months away at best).

---

## 5. Security & leak defense

### A. Hardening checklist (each verifiable; I execute, you click the dashboard toggles I can't)
**Supabase:** run built-in Security Advisor now + weekly · RLS deny-tests per table with both test accounts (requests private rows, offers, deals, notifications, demand_alerts, profiles + new: tickets, reviews, flags, payouts) · storage buckets: confirm offer-photo bucket policy, size/type caps on upload · SECURITY DEFINER functions: pin `search_path`, re-verify internal auth checks (`accept_offer`, `counter_offer`, `admin_metrics`, triggers) · SSL enforcement · Pro-tier daily backups + PITR add-on · **rotate service-role key + webhook secret before launch** (they've traveled through debugging sessions).
**Auth:** leaked-password protection (HIBP) ON · min length 10 · email confirmation ON · captcha (Turnstile) on signup/login · Auth rate limits · Site URL + redirect allowlist → exprifi.com · MFA on your admin account now, optional for users later.
**App:** zod validation on every server action · security headers (CSP, HSTS, X-Frame-Options, referrer-policy) · rate limiting on API routes (Upstash) — Vercel functions have none by default · timing-safe compare on `x-webhook-secret` · Stripe webhook signature verification · middleware is never the only auth check (per-page `getUser` already the pattern — keep it) · `npm audit` + Next.js patch cadence weekly · error messages never leak internals.
**Ops:** Sentry (client+server+alerts) · uptime monitor on `/` + `/api/health` · Vercel Analytics · secrets audit (nothing in `NEXT_PUBLIC_*` — standing rule) · incident runbook: who's paged (you), what's rolled back (Vercel instant), what's communicated (status note on board).

### B. Anti-disintermediation — five stacked layers
Marketplaces leak when contact is possible, trust is portable, and fees exceed the value of protection. Attack all three:
1. **Structural (built):** no free text pre-funding, pseudonyms, structured counters, canned Q&A. Usernames validated against handle/contact patterns too.
2. **Escrow + guarantee (this month):** identity reveal moves *after* funding on funded deals — the locked end-state, now real. "Exprifi Guarantee: item as described or your money back" — the thing a DM deal can never offer. Trust badges at checkout.
3. **Detection (W3):** server-side regex/pattern blocking at write time on ALL text fields (emails, phone formats incl. spelled-out digits, social handles, payment-app names, URLs); soft-block with warning ("looks like contact info — deals stay on Exprifi") → hard flag to admin queue on retry; report button; Leak Patrol agent reviews the queue daily; 3 strikes = suspension per ToS.
4. **Economic (by design):** 0% now, announced-in-advance modest fees later (5% high-end vs eBay's ~13% leaves no arbitrage worth the scam risk); bulk = flat sub so heavy users never feel a per-deal tax; later: volume tiers, instant payouts, seller tax reports — convenience that doesn't exist off-platform.
5. **Reputation lock-in:** reviews, deal counts, close rates live on-platform only. A seller's Exprifi trust strip is worth more than a burner IG. Post-M1: response-rate badges, streaks, "founding member" permanence.
Measurement: flags/week, % matched-unfunded deals that go silent (proxy for leakage), repeat-flag accounts.

---

## 6. Customer service & the Claude agent lineup

### A. CS protocol (doc drafted W2, lives in this folder)
- **Channels:** `/help` FAQ → `/support` form (creates ticket) → `support@exprifi.com`. No public complaint threads.
- **SLAs:** first response <24h (launch week target <4h during waking hours); resolution <72h; disputes <7 days.
- **Tiers:** T0 self-serve FAQ → T1 agent-drafted reply (account, how-to, bug triage) → T2 Kyle (payments, policy judgment, VIPs) → T3 Kyle-only (refund overrides, suspensions, legal).
- **Tone:** collector-to-collector, plain language, first-person "we", never blame the user, always end with the next step.
- **Macros (agent-maintained):** welcome/how-it-works, offer-not-showing, negotiation rules, shipping expectations, refund status, counterfeit report, off-platform warning, account/username.
- **Dispute matrix:** INAD / no-ship / damaged / counterfeit / buyer remorse / leak attempt — each with evidence required, default resolution, and who decides.

### B. The five agents (all buildable in Cowork today; each drafts, you approve, until trust is earned)
1. **Support Desk** — daily 9am + 3pm scheduled task; reads `support@` via the connected Gmail; drafts replies per protocol + macros; labels (triage/resolved/escalate); morning digest of escalations. *Needs: Workspace inbox (W1).*
2. **Morning Metrics Brief** — daily 8am; hits the token-protected metrics endpoint (W1 code); delivers the CEO digest: users, needs, offer rate, TTFO, matches, GMV, funded-%, flags, yesterday's deltas, one recommended action.
3. **Leak Patrol** — daily; reviews the flag queue (W3 code); drafts warning emails, tracks repeat offenders, recommends suspensions (you execute).
4. **Content Studio** — weekly Sunday; drafts the 7-day calendar: 3 post scripts + captions + hooks in your voice, from the formats in §7 and what performed (you paste numbers or connect IG later).
5. **Concierge Scout** — daily during M1; zero-offer needs nearing expiry (the /metrics view built Jul 2) → target-seller list + outreach drafts for your DMs. Post-payments this absorbs **Deal Shepherd** duty: funded deals with no tracking in 48h → nudge drafts.

---

## 7. Marketing & GTM (your lane; every asset drafted by me)

- **Positioning (locked voice):** "The marketplace that hunts for you." / "Post what you want. Sellers race to fill it."
- **Narrative arc of the month:** W1 tease ("I'm building the thing our hobby is missing") → W2 soft-open to inner circle → W3 founding-100 drive ("first 100 get X forever") → W4 countdown + proof (real matches, real screenshots) → Aug 15 launch day.
- **Content formats (3 posts/wk + daily stories):** (1) screen-recording: post a need live → offers race in → match — the product IS the content; (2) treasure-hunt bulk stories ("someone needed 5k count of 2019–21 hoops — filled in 6 hours"); (3) build-in-public founder clips; (4) seller POV ("I moved dead bulk without listing a single card").
- **Launch mechanics:** Founding 100 (badge + perk, §9) · 10 breaker partners each posting 3 needs + answering 5 on launch day · referral hook v1 = shareable OG need cards (organic), referral rewards post-launch · your own buy-list keeps the board honest — you are buyer #1.
- **Channels:** IG/TikTok/YT-shorts (your following — primary) · the Facebook groups where these deals happen today (fish where the fish are; share *needs*, not ads) · X hobby crowd · hobby podcasts/newsletters for launch week (I draft the pitch email) · small paid boost on the launch video from the $300 budget.
- **SEO (compounding, starts W2):** indexable need pages + OG cards; "sold/filled" pages become proof pages. Blog later, not this month.
- **Community:** launch-week Discord is a *maybe* — community ≠ deals, but it's also where leakage starts; decision in §9. Default: not yet, comments + DMs are enough at this scale.

---

## 8. Legal, tax & business ops

Entity: simplest path = VoloksVault Sports Cards LLC d/b/a "Exprifi" now; clean-cap-table new LLC when revenue or investors appear (§9). Stripe account under the entity + business bank account. Site policies (I draft W1, lawyer-review from budget, publish before soft launch): ToS (incl. off-platform solicitation + suspension terms, arbitration), Privacy (GDPR/CCPA-lite; we hold emails + photos), Prohibited items + counterfeit policy (report → takedown → escalate; the dispute matrix's counterfeit lane), Marketplace-role disclosure (we're the venue, escrow via Stripe; guarantee terms). Tax: 1099-K = Stripe's problem (federal $20k/200 in 2026; some states lower — still Stripe's filing); marketplace-facilitator sales tax = register home state, Stripe Tax monitor mode, expand with nexus. Insurance (general liability / E&O) priced this month, bound when GMV is real. Recordkeeping: deals table is the ledger; monthly Stripe → bookkeeping export (agent-assisted later).

---

## 9. Open decisions (yours; deadlines attached)

1. ~~**Entity** — d/b/a now vs new LLC~~ **resolved:** Stripe account is live under VoloksVault Sports Card LLC d/b/a Exprifi. Clean-cap-table new LLC deferred to when revenue/investors appear (§8).
0. ~~**Checkout: hosted vs Elements**~~ **resolved:** hosted Stripe Checkout for MVP (§4C).
2. **Processing-fee pass-through** during 0% period — platform eats ~3% vs buyer pays it, shown transparently (W3, before checkout ships). My lean: eat it; "free + guaranteed" is the launch story.
3. **Auto-release timer** — release escrow N days after delivery confirmation-or-tracking-delivered: 3 vs 7 (W3). My lean: 3.
4. **Founding-100 perk** — my lean: permanent badge + 0% finder's fee for 12 months post-monetization (costs nothing now, means something later) (W3).
5. **Reviews public at launch** or after 10 completed deals seed them (W3). My lean: launch with them; empty is honest.
6. **Discord at launch** — my lean: no (leak surface + moderation load before we have moderation muscle).
7. **Launch date** — Sat Aug 15 locked, or Fri Aug 14 to catch weekend breaks from day 1? (W4)

---

## 10. What I need from you (the complete external-setup list)

W1: ~~remount Cowork~~ done · ~~Stripe account + Connect application~~ done (acct live) · **Stripe go-live toggles + keys + migration + smoke test** (`STRIPE_SETUP.md`: accept loss liability, turn on Radar, paste test keys + service-role key, apply migration 0009, run `stripe listen`) · Supabase Pro · Vercel Pro · Google Workspace + support@ (~$7–9/mo) · Namecheap DNS cutover (runbook provided) · ~~entity decision~~ resolved · Sentry + Upstash + Turnstile accounts (free tiers, ~15 min total — I wire them same week). W2: approve legal drafts. W3: connect own seller account as guinea pig · founding-perk decision · decisions 2/3/5. W4: live-pilot purchases · launch content filmed. Everything else is mine.

---

## 11. Risk register

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| 1 | Liquidity fails (board looks dead to followers) | Med | W2 gate + concierge protocol + seeded needs + your following arrives to a stocked board, never an empty one |
| 2 | Stripe review delays past Aug 15 | Low | Largely retired — account is live and the Connect foundation is built; only Kyle's two dashboard toggles remain, and launch doesn't gate on checkout (optional rail by design) |
| 3 | Payments pull focus from liquidity (the guardrail risk) | Med | The W2 cutline is pre-agreed and written down: <40% offer rate → Stripe pauses |
| 4 | Scam/counterfeit incident in launch week | Med | Mandatory single photos, watermarks, guarantee + dispute runbook, Leak Patrol, your personal eye on every early deal |
| 5 | Security incident | Low | §5A executed + verified; secrets rotated; deny-tests scripted; freeze before launch |
| 6 | Kyle bandwidth (20–30h is a lot next to a job/life) | Med | Agents absorb support/metrics/drafting; the plan front-loads your lightest weeks; cut scope from §4A polish, never from seeding |
| 7 | Off-platform leakage normalizes early (M1 allows it) | High-by-design | Acceptable during M1 per locked plan; funded-deal perks + post-funding chat make paying the better deal, not just the safer one |
| 8 | Follower launch underwhelms (reach ≠ signups) | Med | Soft-launch data in W2 tells us early; partner breakers de-risk reach; paid boost held in reserve |

---

*Living document — edit as we go. The Launch Command Center artifact mirrors this plan as a checklist; the build log stays the engineering source of truth.*
