# Exprifi — Build Log

_Public brand **Exprifi** (exprifi.com). Internal codename **needit** (repo, folders, Supabase project) — deliberately not renamed._

_MVP = **Lane 2**, the open request board. Buyers post what they want; sellers bring it to them. No catalog UI, no Lane 1 matching, no live payments._

> **Reading order.** Current state first, history last. If you only read one section, read **Open items**. Everything below "Session history" is the record of how we got here — useful for *why*, not for *what's true now*.

---

## Status at a glance

| | |
|---|---|
| **Milestone** | M1 — Lane 2 live, pre-launch |
| **Launch target** | **Sep 26, 2026** |
| **Live at** | https://exprifi.com (apex + www, Vercel project `need-it`) |
| **Board** | **0 live needs** — seeding sprint (Aug 25 – Sep 14) is the gate that decides the date |
| **Last updated** | Aug 1, 2026 (evening) |

**What works today, verified:** public browsing logged-out · post a need · structured offers + counters (cap 10) · accept/decline with atomic match · in-app notifications + live bell · **notification email** · demand alerts · username-or-email sign-in · **password reset** · **fresh signup → onboarding → username** · admin `/metrics` · `/api/health`.

**What exists but is dormant:** card catalog schema (0014/0016) — no ingest, no picker, blocked on licensing · Stripe Connect test-mode wiring — never proven end-to-end, live flip not scheduled · `/legal/*` pages — built, unlinked.

**Environment:** git root `~/Desktop/NeedIt`, app at `needit/`, **Vercel Root Directory = `needit`**. Supabase project ref `cfcjcxgmntkatamflaqh` (org VoloksVault, free tier). Vercel Hobby.

---

## 🔴 Open items

Everything genuinely outstanding, in one place. Nothing else in this document is a to-do list.

### Kyle only — blocking or near-blocking

0. **▶ RUN migration `0017_free_alert_limits.sql`** in the Supabase SQL editor. The free-alert code (server action, form copy, email cadence) is already in the tree and **assumes the columns and trigger exist** — `profiles.notify_demand_match`, `last_demand_digest_at`, `enforce_free_alert_limit()`. Until it runs, the notification route's `.select()` on those columns fails and demand-alert email degrades. The file has a self-verify block that raises on failure.
1. **Read the four `/legal/*` pages, set `LEGAL_ADDRESS`, flip `LEGAL_PUBLISHED = true`.** Pages are live but unlinked; the flag gates the footer Legal column, trust-and-safety links and `/help` cross-links. One line after the read.
2. **Rotate the three remaining secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFY_WEBHOOK_SECRET`, `METRICS_API_TOKEN`. See `secret-rotation-runbook.md`, ~20 min. *(The Resend key is done — rotated Jul 29, old key revoked Aug 1.)*
3. **Confirm the `offer-photos` storage bucket is NOT public** (Supabase → Storage). It was created public in June.
4. **Set the three `/plans` numbers** — high-end threshold, Pro price, free alert cap.
5. **Write the real buy-list** (10–15 needs) ready for the seeding sprint.

### Before launch — must happen, order matters

6. **Switch the Supabase *Confirm sign up* template** to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding` **before** flipping email confirmation ON. It still uses `{{ .ConfirmationURL }}` (PKCE) — flip confirmation first and every new signup dies on the exact dead-end that cost Jul 29. Then send one real test signup.
7. **Auth-form pass, bundled with (6)** so there's one test run rather than three: confirm-password field on `/auth/update-password` (it has none — a typo silently becomes the new password and locks the member out on the screen they came to *stop* being locked out); show/hide reveal toggle; HIBP leaked-password check + min length 10.
8. **Wire `LIMITS.signupPerIp`** — defined in `lib/rate-limit.ts`, referenced by nothing. Signup runs in the browser client, so it needs moving to a server action; do it inside (7).
9. **CSP tightening** — nonce-based `script-src`, drop `'unsafe-inline'`. Deferred from Phase 1 because it needs per-request nonces threaded through the proxy.
10. **Feature freeze Sep 21.** Bug-fix only after.

### Nice to have, degrade gracefully

- **Upstash Redis** — until it exists the rate limiter runs per-instance only. **Sentry** — `lib/observability.ts` is dormant without `SENTRY_DSN`. `/api/health` reports which mode is live.
- **Uptime monitor** → `https://exprifi.com/api/health`.
- **Periodic pipeline check** (see the Aug 1 outage): `select status_code, count(*) from net._http_response where created > now() - interval '7 days' group by 1;`

### Blocked on an external answer

- **Card catalog ingest / picker / seller vault** — hard-blocked on a licensing answer in writing. Outreach sent to PriceCharting/SportsCardsPro; TCDb + Card Hedge drafted. Nothing downstream starts without terms. See `card-catalog-and-automatch-spec.md`.

### Payments (M3) — not on the launch path

- Prove webhook auto-funding end-to-end (has **never once** completed locally).
- `markShipped` / `confirmDelivery` UI (server actions exist, no buttons).
- Auto-release cron; identity-reveal-on-funding; migrate to Stripe **Accounts v2** before live; dashboard toggles (loss liability, Radar for Platforms).

---

## Locked decisions

Do not relitigate these without a deliberate reopening.

- **Two lanes.** Lane 2 (open request board) is the MVP. Lane 1 (instant price-match against seller inventory) is the moat and is **M2**. Earn Lane 1 with Lane 2.
- **Free/paid boundary — the standing constraint.** *Free = you come look. Paid (M2) = it comes to you.* **Anything that reaches a seller unprompted — email, push, SMS, digest — is Lane 1 and is not free.**
- **The board contains only demand.** **Sellers** filter it ("find demand I can fill"). **Buyers act by posting a need, never by searching.** There is no "search for cards to buy" on Exprifi — adding one rebuilds eBay and discards the thesis. The beachhead is buyer *and* seller in one person, so the same account does both, **but never in the same surface. Two doors, always.**
- **Leak defense is core.** Structured offers, no free-text chat. Masked identity until a deal funds. Escrow on-platform only. `seller_inventory` is a want-list in reverse — owner-only RLS, surfaced only through a SECURITY DEFINER match function, never a cross-user query.
- **Monetization.** Subscription/flat for bulk, 5% finder's fee for high-end singles ($250 threshold, integer cents). **MVP charges nothing.**
- **Money is integer cents everywhere.** Never a float.
- **Never put a secret in a `NEXT_PUBLIC_` var.**
- **Own the vocabulary:** *needs, hunts, offers, demand, the board*. Never *listings, watchlist, Buy It Now, feedback score*. Brand hygiene that also eliminates a whole class of eBay-similarity concern.
- **Legal parameters** (resolved in `lib/legal.ts` so policy text and product can't drift): Connecticut · individual arbitration + class waiver, small-claims carve-out, 30-day opt-out · 18+ · 14-day grace then anonymise, deal records retained · $250 high-end threshold.
- **Design: 3a locked** — light platform chrome around a dark live board; green (#00A968) is a *data* colour, buttons are ink; `text-primary-deep` (#00794B) for green on light surfaces (AA contrast); 5c notched corner; urgent <12h is the board's only motion. Full spec: `exprifi-brand-system.md`.
- **Planning protocol: the Dry-Run Interview** runs before any non-trivial build ask. Full text: `Board-Reference/dry-run-interview-protocol.md`.

---

## System map

**Stack.** Next.js App Router + TypeScript on Vercel · Supabase (Postgres/Auth/RLS/Storage) via `@supabase/ssr` · Tailwind + shadcn/ui.

**Config lives in four places and a fix isn't done until all four agree** — this has caused three separate outages:

| Where | Holds |
|---|---|
| Repo | `lib/site.ts` (canonical origin), `next.config.ts` (headers/CSP), `lib/supabase/proxy.ts` (protected-route denylist) |
| Vercel | env vars — `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `NOTIFY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_FROM`, Stripe keys |
| Supabase dashboard | SMTP, Auth URL config + redirect allowlist, email templates, **Database Webhooks** |
| Resend | domain verification, API keys, suppression list |

**Three email systems — do not confuse them:**

1. **Resend REST** (`/api/notifications/email`) — app notifications. Fired by the Supabase DB webhook `notify_email` on `notifications` INSERT.
2. **Resend SMTP** (`smtp.resend.com:465`, user literally `resend`) — Supabase **Auth** email: confirmation, password reset, email change. Separate pipe; "our email works" says nothing about this one.
3. **Google Workspace** — the human *inbox* (`support@`, `kyle@`). Different MX host from Resend's `send.` subdomain, which is why they coexist. See `lib/contact.ts`.

**Auth chain coverage** (audited Aug 1):

| Path | Status |
|---|---|
| Login by email / by username (`resolve_login_email`) | ✅ verified |
| Password reset — request → email → `verifyOtp` → new password | ✅ verified end-to-end |
| Fresh signup → `/onboarding` → username → board (confirmation OFF) | ✅ verified end-to-end |
| Signup with confirmation ON → Confirm-signup email | ❌ untested, template known-broken — see open item (6) |
| `/auth/callback` PKCE exchange | ❌ untested; only serves links already in inboxes + future OAuth |
| Email change from Settings | ❌ untested, still on Supabase's default template |
| `signOutEverywhere` / account closure | ❌ untested |
| Rate limits (`loginPerIp`, `passwordResetPerIp`) | ❌ never fired live; Upstash unset → in-process fallback |

**Migrations** — one home only: `needit/supabase/migrations/`. All idempotent. **Claim the number in this log the moment a migration is drafted, not when it runs** — the log is the reservation system.

| # | What |
|---|---|
| 0002 | `requests.visibility` (public/private) + owner-only SELECT for private |
| 0003 | Counter-offers — `current_price_cents`, `counter_by`, `counter_round`; party-aware `accept_offer`, `counter_offer` |
| 0004 | `notifications` + `notify_offer_change` trigger |
| 0005 | `profiles.email_notifications` (default **true**) |
| 0006 | `profiles.is_admin` + `admin_metrics()` SECURITY DEFINER |
| 0007 | Denormalised `requests.offer_count` + sync trigger |
| 0008 | `demand_alerts` + `notify_demand_match()` |
| 0009 | Stripe payments — deal payment columns, `profiles.stripe_account_id`, `stripe_events` |
| 0011 | `profiles insert own` / `update own` RLS — **load-bearing for onboarding** |
| 0012 | Account settings |
| 0013 | Username login — `resolve_login_email`, REVOKEd from anon *and* authenticated |
| 0014 | Card catalog — `card_sets`, `cards` (each parallel its own row), `seller_inventory`; `requests.card_id`/`grade_min` |
| 0015 | Public-browsing RLS + column privileges + anon deny-tests ✅ RUN |
| 0016 | `card_refs` / `card_set_refs` — provider-agnostic ID mapping, RLS on with **zero policies** (service-role only) ✅ RUN |
| 0017 | Free-alert limits — `profiles.notify_demand_match`, `last_demand_digest_at`, `enforce_free_alert_limit()` trigger ⚠️ **NOT YET RUN** |

Numbering is clean and sequential 0002–0017. *(The payments session's note claiming its profiles-insert-policy was `0010` was wrong — the live set has `0010_metrics_service` and `0011_profiles_insert_policy`. Resolved, no action.)* Next number is **0018**.

---

## Session history

Reverse chronological. Most recent first.

### 🚨 Aug 1 (evening) — notification email had been dead for 3 days

Session goal was housekeeping. It turned up a live outage nobody had noticed.

**Closed:** docs committed · **old Resend `Onboarding` key revoked** (rotation complete) · **fresh signup verified end-to-end** — the last unproven link in the auth chain. The `router.refresh()` race I expected did not materialise, and 0011's insert policy survived 0015's policy-drop loop (that loop filters `cmd = 'SELECT'`, so INSERT/UPDATE policies were never at risk — checked, not assumed).

**The find.** A test offer produced correct rows (`new_offer`, `accepted`) and the in-app bell worked, but no email arrived and **Resend showed no send attempt at all** — so the failure was upstream of Resend, and the key revocation was innocent. `net._http_response` gave it cold:

```
status_code  body                    created
404          DEPLOYMENT_NOT_FOUND    2026-08-01 15:28:32
404          DEPLOYMENT_NOT_FOUND    2026-08-01 15:28:06
```

The Supabase webhook `notify_email` was still POSTing to `https://need-it.vercel.app/api/notifications/email`. That host is no longer attached to the Vercel project, so it 404s at the edge. **Every `new_offer` / `counter` / `accepted` / `declined` / `demand_match` email had been firing into a 404 since the domain cutover.**

**Fixed and verified:** webhook URL → `https://exprifi.com/api/notifications/email`. Test insert → `200 {"sent":true}` → Resend **Delivered**. The 200 also proves `x-webhook-secret` matches Vercel's `NOTIFY_WEBHOOK_SECRET` (a mismatch 401s at the top of the route).

**Legacy host retired — Kyle's call.** `need-it.vercel.app` removed from all four places that still referenced it: the `redirects()` block in `next.config.ts`, `LEGACY_HOST` in `lib/site.ts`, the hard-coded fallback in `app/api/notifications/email/route.ts` (which now imports `SITE_URL` from `lib/site` — the exact drift that file was written to prevent), and the Supabase redirect allowlist. Old links now 404 **by decision**. To reverse: re-attach the domain in Vercel **first** — restoring the code alone does nothing.

**Also fixed while in there:** added `https://www.exprifi.com/**` to the Supabase redirect allowlist. Vercel serves both apex and www as Production but only apex was allowlisted — a visitor who signed up from www would have had `emailRedirectTo` silently downgraded to Site URL. The Jul 29 bug, one subdomain over. Latent while confirmation is OFF; would have surfaced at launch.

### 🗓 Aug 1 — Free-alert limits: the boundary applied to a feature already shipped

Parallel session, same day. `demand_alerts` had shipped **unlimited, instant and specific** — the moment a matching need was published, the seller got an email naming the card and telling them to hurry. That is, in substance, exactly what M2 is meant to sell, given away in the MVP. Selling "we tell you, but faster" is a far weaker pitch than selling "we tell you" to someone who currently has to come and look.

**Kyle's call: keep the feature, trim the free version so the paid one has somewhere to go.** Nothing is removed from anyone; the free version is slower, smaller and deliberately vague.

- **Free** — up to **3** saved alerts · at most one email **every 3 days** · that email says only that there is new matching demand, **never what it is**, and links to the board rather than deep-linking the need.
- **M2** — unlimited, instant, specific, matched against real inventory, with the broadcast/claim-race mechanic.
- **The in-app bell is not throttled and not vague.** It's on-site, so it costs nothing against the boundary — you only see it once you've already arrived.

Both numbers live in `lib/alerts.ts` so UI copy, server action and email route can't disagree. The limit is enforced **twice** — in the server action for a friendly message, and again by a DB trigger in `0017`, because the action isn't the only path to an insert. The digest window is claimed with a **conditional UPDATE rather than read-then-write**, since several needs can be published in the same second and each POSTs the route independently: whichever request wins the update sends, the rest see zero rows and skip.

This is the free/paid boundary being applied *retroactively to something already built* — the second time in two days that rule caught a Lane 1 giveaway (the first was the saved-searches-with-email draft in the board addendum).

### 🗓 Aug 1 — Board-filtering addendum + onboarding spec (design only)

`exprifi-3b-addendum-board-filtering.md` + `design-mockups/exprifi-3b-rail-mockups.html`, `design-mockups/exprifi-onboarding-tutorial.html`. **No app code changed.** Amends Block C of `exprifi-3b-facelift-and-access-spec.md`; touches no locked token, anatomy, access or fee decision.

- **Legal worry (eBay similarity) resolved and dismissed** (§1, not legal advice): faceted filtering is ubiquitous prior art, "Refine" is a generic verb, eBay's patents cover backend transaction mechanics not filter chrome. **Do not slow the build for this.** Real exposure is elsewhere: verbatim copy lifted from eBay, their assets, **scraping their listings or sold-comps** (a live risk against the catalog spec, not the board), and using their name in paid marketing.
- **§1.3 amended narrowly:** one filter component, two presentations — docked **left rail** ≥1024px, **bottom sheet** behind a "Refine" button below. Auto-apply on change (debounced). 44px checkbox rows, **zero native `<select>` left on the page**. Sticky board header carries free-text search + active chips + sort.
- **The rule that makes two filter surfaces safe:** search owns free text only (title + description, no NLP, never parses price or dates); the rail owns every structured field and never accepts free text. They compose with AND. Typing "under 500" searches literally and honestly finds nothing rather than silently mis-parsing.
- **Zero-count options render dimmed with their real count** — never hidden, never faked.

### ⚙️ Aug 1 — Dry-Run Interview protocol installed (process, no app code)

Standing method for any build/fix/refactor/migrate/decide ask: recon the repo before asking; ask only the few forks expensive to get wrong (one per turn, ≤14 total, target 3–8); tag every fact `(user)` / `(verified: source)` / `[assumed: default — if wrong: …]`; deliver a plan an executor with zero context could run. Skill installed to the account; canonical text in `Board-Reference/dry-run-interview-protocol.md` (that file wins if they disagree).

### 🗓 Aug 1 — Card catalog licensing (Phase 1 gate)

Outreach tracked in `card-catalog-vendor-outreach.md`. **PriceCharting/SportsCardsPro sent**; **TCDb** and **Card Hedge** drafted.

- **The load-bearing question, ask it of every source before paying anyone:** *is there a stable unique identifier per card that persists across exports?* If IDs don't persist, every refresh becomes fuzzy matching instead of a clean upsert on `(source, source_key)` — which is exactly what 0014's constraints and 0016's ref tables are built around.
- Also ask about **shape**, not just permission and coverage: sample export, whether parallels are their own rows or attributes, whether fields arrive discrete or as one concatenated name string, refresh cadence.
- **TCDb has a formal application** at `tcdb.com/DataServices.cfm`. Check **both** Set Listings and Checklists (they map to `card_sets` and `cards` — one without the other is a catalog of empty sets). Market segment "Marketplace". Answer the usage box unprompted: text-only, no image re-hosting, catalog never browsable or exportable from our UI, periodic ingest not live per-request calls, happy to attribute. **Get the licence in writing** — community-contributed data plus a friendly approval email is not a licence, and that bites at diligence time.
- **Coverage audit scoped down, not skipped:** spot-check **10 of the nastiest cards** (a '90s parallel, a variation, an oddball insert, something serial-numbered) against the real sample file once terms arrive. Familiarity with a vendor's *website* says nothing about the *export tier*'s field granularity.
- **Disclosure posture:** describing the reverse-marketplace concept on vendor forms is low risk — the moat is the audience, the leak defense, the Lane 1 race mechanic and the pricing model, none of which appear on these forms. Vague applications get rejected as suspected scrapers. **Withhold two things anyway: the launch date, and that the audience concentrates in bulk/junk-wax.**

### 🗓 Jul 29 (late) — the auth/email night

Reported symptom: new signups told to check email for a confirmation that never arrived, and turning confirmation off didn't help. **Four independent faults, stacked. None of them was spam.**

1. **The app dead-ended users itself** — `sign-up-form.tsx` pushed to `/auth/sign-up-success` unconditionally. With confirmation OFF, `signUp()` returns a live session and the user is *already signed in*. Now session-aware: `data.session → /onboarding`, else the check-your-email page. Correct under both modes with no further code change.
2. **Supabase Auth email had never been connected to Resend.** It was still on Supabase's built-in demo sender — 2 emails/hour, best-effort, explicitly not for production. Custom SMTP was off, and the saved SMTP username was `NeedIt` where Resend requires literally `resend`. Now `smtp.resend.com:465`, sender `Exprifi <notifications@exprifi.com>`, rate limit 2/hr → 30/hr.
3. **`exprifi.com` was absent from the redirect allowlist.** A reset started from exprifi.com sends `redirectTo=https://exprifi.com/...`, which Supabase rejects as un-allowlisted and silently downgrades to Site URL. Working SMTP alone would not have produced a working reset. Site URL → `https://exprifi.com`.
4. **`NEXT_PUBLIC_SITE_URL` was missing from Vercel entirely** — found in passing. Every notification email ever sent linked to the vercel.app host; canonical tags, OG images and the sitemap resolved through the same var.

**Then the reset still failed — the PKCE gap.** `resetPasswordForEmail` from the *browser* client runs PKCE, so `{{ .TokenHash }}` inherited a `pkce_` prefix and server-side `verifyOtp()` rejected it outright. Fixed in layers: `app/auth/callback/route.ts` (new — exchanges `?code=`), `app/auth/update-password/page.tsx` (server component, gates on a session, honest expiry message), email templates moved to `token_hash`, `lib/safe-next.ts` (new — open-redirect guard, shared by sign-in, `/auth/confirm` and `/auth/callback`, because three copies of that rule eventually become three different rules), and finally **`app/auth/forgot-password/actions.ts`** — a server action using `flowType: "implicit"`, which mints a plain token hash `verifyOtp` accepts, from any device. Rate-limited with `passwordResetPerIp`; always returns the same "if that address has an account…" response (the form was previously an account-enumeration oracle).

**Why implicit rather than PKCE:** PKCE stores its verifier in the browser that began the flow, so request-on-laptop → tap-on-phone can never work. Email is the one context where cross-device is *normal*.

**Result: password recovery works end to end** — the link that mattered most for seeding, since a seeded seller who loses their password now has a self-serve way back in.

**Deliberate:** email confirmation stays **OFF** through the seeding sprint. Every extra signup step costs a seeded seller. Flip it before Sep 26 — after (6) above.

### 🗓 Jul 29 — Phase 1: legitimacy + doors open

**The headline: the auth gate flipped from allowlist to denylist, so Exprifi is a public marketplace for the first time.**

- **Proxy inverted (`lib/supabase/proxy.ts`).** `PROTECTED` is an explicit regex list; everything else renders publicly. Two bonuses beyond the ask: webhooks no longer need bespoke exemptions (this is what caused the July Resend 307 *and* the Stripe 307), and adding a public page requires no change here. ⚠️ **The guardrail at the top of that file must survive: the proxy is never the only auth check.** Every protected page still calls `getClaims()`, every action re-checks the caller, RLS is the real boundary.
- **Migration 0015** — anon-role policies, **column privileges** (RLS filters rows and cannot hide columns; without the explicit grant list an anonymous visitor reading a public profile also reads `is_admin`, `stripe_account_id` and every notification pref), `revoke all` on the private tables, and a runnable **deny-test block**. All pre-existing SELECT policies on `profiles` are dropped first — policies are OR'd, so adding one next to an unknown permissive policy is theatre.
  - **Deliberate spec deviation, documented in the file:** anon may read public needs at *any* status, not just open. Status carries no privacy, and restricting it would 404 every link Kyle shares the moment the need fills — precisely when it's most worth clicking. The sitemap still lists open needs only.
- **Rate limiting (`lib/rate-limit.ts`)** shipped *with* public access, not after. No `@upstash/ratelimit` dependency — the REST API is INCR + EXPIRE. Fails open (it's an abuse brake, not an authorization boundary). ⚠️ `clientIp()` reads the **left-most** `x-forwarded-for` entry; the common copy-paste reads the right-most and buckets every visitor together.
- **Auth wall** — `/request/[id]` renders in full for anonymous visitors with the offer form inert *underneath* a sign-in bar: `pointer-events-none`, `aria-hidden`, `tabIndex={-1}`. A "disabled" form a keyboard user can still tab into and submit is worse than no preview. Seeing the shape of the thing is the conversion event.
- **sitemap + robots + per-need metadata.** Every need is a long-tail page nobody else can write — it's *demand*, not a listing — and it was completely invisible behind a login. Sitemap fails soft to static pages if Supabase is unreachable (a 500 on `/sitemap.xml` drops the whole file from Search Console). Robots disallows auth screens: a "Sign in to Exprifi" page ranking for the brand is free real estate for a phishing lookalike.
- **Canonical origin pinned (`lib/site.ts`).** `metadataBase` had been derived from `VERCEL_URL`, which is the *deployment-specific* hostname — so every OG image on exprifi.com pointed at a preview URL and crawlers saw two hosts serving identical content.
- **Legal pages, `/help` (a real ten-question FAQ, not a stub — "coming soon" is worse than nothing on the screen someone reaches when they're already unsure), utility strip, `/api/health`** (actually queries the DB, because a check that only proves "Next.js is running" goes green during the exact outage you care about; reports config **shape, never values**), and **`lib/observability.ts`** (Sentry-compatible, zero dependencies, never throws — a monitoring failure must not become a second incident).

**Same day: two parallel Cowork sessions both minted a migration numbered 0015.** Different intent, disjoint objects, resolved by renaming the card-refs one to 0016. It worked out by luck — if both had touched `profiles` policies, whichever ran last would have silently defined who can read profiles with no error to catch it. **One session per repo at a time.** If two are ever needed: one owns the schema, the other stays out of SQL entirely.

### 🗓 Jul 28 — My board facelift + catalog schema

`/u/[username]` rebuilt to the 3a system (Kyle picked Sample A from two rendered mockups): light chrome, dark notched want-board matching the home live board, mono money, ink CTAs, amber urgent notch, compact light rows. Data logic untouched.

**Card catalog schema live (0014).** Three tables. Each **parallel is its own row**, not a flag — a Gold /50 is a different object at a different price and matching has to treat it that way. `requests.card_id` is nullable on purpose: bulk lots and oddballs stay free-text Lane 2 forever.

⚠️ **Gotcha:** a generated column can't reference another table, so `cards.search` (weighted tsvector, `simple` config so player names aren't stemmed) couldn't pull the set name from `card_sets`. Fix: a denormalised `cards.set_name` kept in sync by trigger. **`card_sets.name` stays canonical — never write `set_name` by hand.** Also: the `pg_trgm` operator class is schema-qualified from `pg_extension` at run time, because Supabase installs extensions into `extensions`, not `public`.

### 💳 Payments (M3) — Stripe Connect test-mode, wired but unproven

Pulled forward for a build pass. Architecture per §4C: marketplace, **separate charges & transfers**, US-only, integer cents, **0% platform fee at launch**. Buyer funds the *platform*; released to the seller on delivery confirm. Test mode only.

Shipped: `lib/stripe/*`, seller onboarding (v1 controller, **transfers-only recipient — not `card_payments`**), buyer checkout (hosted Session charging the platform, no `transfer_data`), signature-verified idempotent webhook driving `unfunded→funded→shipped→released`, release/ship/refund server actions, migration 0009.

**Bugs found — most of the day was these, stacked:**

1. **The Stripe webhook 307'd to `/auth/login`.** The tree still had the old allowlist proxy, which redirected the unauthenticated webhook POST before the handler ran → deals never got marked paid, **silently**. Same seam as the July Resend 307. The Jul 29 denylist proxy is the permanent fix. **If a webhook ever 307s again, an old allowlist proxy has been deployed.**
2. **Onboarding infinite loop** — `setUsername` did an UPDATE assuming a profiles row exists; a missing row = 0-row no-op → redirect → bounce forever. Root cause: profiles had no INSERT-own RLS policy (now 0011). Action changed to **upsert** and to surface the real DB error instead of looping silently.
3. **`profiles_id_fkey` violation** — a "ghost" session (auth user deleted during testing, JWT still valid) can't insert a profile. Don't reuse deleted accounts; sign up fresh.
4. **`stripe listen` is fragile** — dies on a network blip and must be running for local webhook delivery. **A crashed listener looks exactly like "the payment didn't confirm."**
5. **`.env.local` unsaved-in-editor trap** — keys typed into Cursor but never *saved* read as blank to the running app. Verify secrets on disk, not in the editor buffer.

⚠️ **Never proven:** the webhook auto-mark-funded is correct in code but **has never once completed end-to-end**. The test deal was set `funded` via SQL for closure. Get one clean webhook-driven funding proof before trusting it.

### 📦 Jun 25 – Jul 4 — the MVP build (condensed)

Scaffold (`create-next-app -e with-supabase`) → Supabase project → Vercel. Then, one feature at a time, testing after each:

**Core loop** — onboarding/username · post a need + the board (type/sport/condition/budget/expiry, optional reference photo) · request detail + **structured offer** (price/condition/photo/note, **no chat**) · **accept/decline** via SECURITY DEFINER `accept_offer`/`decline_offer` (buyer-authed, atomic: offer→accepted, siblings→declined, request→matched, deal inserted, double-accept guarded).

**Then** — public pseudonymous profiles at `/u/<username>` doubling as the buyer command center · **private wants** (wishlist now, publish later; **expiry starts at publish**) · editable private wants + avatar menu · **counter-offers** (structured price negotiation, no chat; party-aware turn tracking, round cap 10) · seller-side "Your offers" · paginated History · `/completed-deals`.

**Notifications** — `notifications` table + trigger → header bell polling every 15s and on tab-focus, with hover preview · `/settings` email toggle · Resend delivery via DB webhook.

**Then** — admin-only `/metrics` liquidity dashboard (% needs with ≥1 offer, median/p90 time-to-first-offer, offers per need, counter rounds, match rate, 7-day trends — all computed live, no tracking events; gated by `is_admin` + a definer function, because **RLS alone can't gate cross-user aggregates**) · public offer-count badges via denormalised counter + trigger · board filters/sort · **demand alerts** (inverted saved search — the criteria-only bridge built instead of the seller-inventory auto-match Kyle originally asked for, which is Lane 1) · **3a brand system + 5c notch**.

**The Jul 2 email saga, worth remembering:** three faults stacked. Domain verified in Resend with DNS at Namecheap (DKIM, SPF, **MX on host `send`** — required switching Namecheap from Email Forwarding to Custom MX). Then **bug 1**, the webhook POST was 307'd to `/auth/login` by the allowlist proxy so the route never ran; then **bug 2**, the webhook's `x-webhook-secret` header contained the literal string `NOTIFY_WEBHOOK_SECRET` — the variable *name* pasted instead of a value. Vercel logs showed `307 → 401 → 200` as each layer was fixed.

**Recurring migration gotcha, hit twice** (0003 counter-offers, 0004 notifications): the migration was run **in parts**, so the columns/tables applied but the **functions and triggers were never created**. Both times the feature failed *silently*. **Run the whole migration, then verify in Supabase → Database → Functions, and never swallow `supabase.rpc` errors.**

---

## 🎓 Standing lessons

Merged from every session. These are the ones that have already cost real time twice.

**1. Debug the seams, not the systems.** Every serious fault on this project has sat *between* two systems that each looked healthy alone — Resend 307 (Jul), Stripe 307 (Jul), auth SMTP never connected (Jul 29), webhook 404 (Aug 1). Nothing was ever broken *inside* Resend, Supabase, Vercel or the repo.

**2. After any domain or credential change, enumerate every external system holding a URL** — Vercel env, Supabase Auth URL config, **Supabase webhooks**, and the repo. The Aug 1 outage was the domain cutover surviving in a fourth location after being fixed in three. Three out of four was not enough.

**3. A working UI in front of a dead pipeline is the most dangerous failure mode.** The bell worked, the app looked healthy, offers appeared — and no email had sent for three days. The wrong conclusion ("no demand") is far more expensive than the bug. Anything asynchronous needs a way to check it: `net._http_response` for pg_net, Resend's log, Vercel function logs.

**4. When a fix that should work produces zero change, assume a second fault downstream** rather than assuming the fix failed. Jul 29 was four stacked faults; fixing any one alone produced no visible improvement.

**5. "Delivered" is a proxy metric — follow the actual link.** Resend logged Sent → Delivered and it looked finished; the link was dead on arrival. **Test the journey, not the hop.**

**6. Verify, don't reason.** "Has it been applied?" is answerable read-only. Reasoning about policies on paper is how the 0004 trigger was believed-in for a week while it didn't exist. Deny-tests, `information_schema` probes and status codes settle questions that argument doesn't.

**7. Scaffold defaults are liabilities that look like finished features.** The Supabase starter shipped an unconditional "check your email" redirect, a redirect to a placeholder `/protected` route, a password field with no confirmation, a personal username as the public placeholder, and email templates pointing at `supabase.co`. All of it *looked* done. **Anything not deliberately written for Exprifi should be treated as unreviewed, especially on auth screens.**

**8. Raw SDK strings are not error messages.** `Auth session missing!` told a locked-out member nothing and read as a broken site, on the screen where trust is thinnest. Any error a member can reach should say what happened and what to do next.

**9. PKCE is the wrong flow for anything that arrives by email.** Verify server-side (`token_hash` + `verifyOtp`).

**10. Don't re-derive shared config locally.** `lib/site.ts` exists so there's one answer to "what is our address." A second copy in `route.ts` with a stale default is what turned a dead host into three days of silent failure.

**11. The DB-side tightening ships before the app-side loosening, never after.** 0015 had to land before the proxy denylist deployed, because the flip made the database the only boundary.

**12. Idempotent migrations turn an ambiguous state into a non-problem.** The 0015 collision was cheap instead of scary purely because both files were safe to re-run. Every migration keeps this property.

**13. Absence of output is often the pass signal — know which silence means what.** "Success. No rows returned" is what a passing deny-test looks like (assertions live in `raise exception`). `rm` is silent on success too.

**14. The guardrails catch Claude, not just Kyle.** An earlier draft of the board addendum specified saved searches **with email notifications** — which *is* Lane 1 matching, hand-built and given away in the MVP, spending M2's entire value proposition before M2 ships. Kyle rejected it. Worth recording that the standing guardrail earned its keep against the assistant.

**15. Silent-failure surfaces to check before blaming the pipeline.**
- **Resend suppression list** — a hard bounce auto-suppresses an address and later sends vanish with no error.
- **Vercel "Sensitive" env vars are write-only** — not recoverable even by the owner. Mint a new secret rather than hunting for the old one.
- **Env changes need a redeploy**, and `NEXT_PUBLIC_*` is inlined at *build* time — redeploy **without** the build cache or you'll ship the old value and misread it as the fix not working.
- **`stripe_payouts_enabled` goes stale** if the webhook path is down, and the buyer's Fund button silently hides.

**16. Tooling notes.**
- The sandbox cannot delete `.git/index.lock`; Kyle runs git in Terminal. If seen: `rm -f ~/Desktop/NeedIt/.git/index.lock`.
- The sandbox times out running `tsc` over the mounted volume — type-check locally before pushing.
- The Supabase template editor auto-closes tags: type `</p` and let it supply the `>`, or you get `</p>>`.
- The Supabase dashboard intermittently renders blank; reload rather than assuming a permissions problem.
- Next 16 dropped the top-level `eslint` config key (adding it is a type error) and ships `cacheComponents: true`, which breaks builds for auth/cookie pages. Keep it off.
- Two accounts are needed to test any two-sided flow. Recover locked test accounts with `scripts/reset-user-password.mjs` rather than fighting the reset email.

---

## 💡 Deferred — post-MVP, not scheduled

- **Seller inventory / vault + auto-match** — Lane 1, M2. The demand-alerts criteria are already Lane 1 training data.
- **Seller "Showcase"** carousel on the profile — Lane 1 surface, deferred Jun 29.
- **Card variant taxonomy / fuzzy matching** — a loose request ("CJ Stroud Prizm #88") should match all parallels; a specific one narrows. Needs the catalog plus a broad-vs-specific matching layer.
- **Saved views, badges only** — no outbound anything (see the free/paid boundary). Worth building as the natural *on-ramp* to Lane 1: "you check this view every day — want us to just tell you?"
- **Preset buyer questions on an offer** — canned-only Q&A, leak-safe: "Is price firm?", "Bundle?", "More photos?", "In hand?".
- **Mandatory offer photos** — lean: required for single-card offers (trust/anti-fake), optional for bulk (don't suppress liquidity). Kyle's call.
- **Supabase Realtime** for a truly instant bell instead of the 15s poll.
- **Unified transaction log** — History is buyer-side; seller-side sales live in `/completed-deals` and "Your offers".
- **`published_at` column** — TTFO currently measures from `created_at`, which is wrong for private→published wants.
- **Split buyer/seller landing** — deferred until the follower-marketing plan exists. Frame as intent/mode, never as an account-type gate.
- **Owned sports-news content arm** — very long-term. Do not pull scope forward.

---

## 📁 Companion documents

`Board-Reference/` holds the canonical strategy set — read before advising. Also in the working folder:

| File | What |
|---|---|
| `needit-build-plan.md` | Source-of-truth build plan |
| `exprifi-launch-roadmap.md` | Phased plan to Sep 26 |
| `exprifi-full-business-brief.md` | Business thesis |
| `exprifi-brand-system.md` | 3a design system (locked) |
| `exprifi-3b-facelift-and-access-spec.md` | Facelift + access model |
| `exprifi-3b-addendum-board-filtering.md` | Rail/sheet filtering amendment (keep — dated independent-derivation record) |
| `card-catalog-and-automatch-spec.md` | Catalog + Lane 1 matching plan |
| `card-data-vendor-comparison.md`, `cardhedge-reply-draft.md`, `card-catalog-vendor-outreach.md` | Vendor evaluation + outreach |
| `secret-rotation-runbook.md` | Three secrets, in order, verify-before-revoke |
| `legal-drafts-for-review.md` | Policy drafts pending Kyle's read |
| `STRIPE_SETUP_STATUS.md` | Stripe test-mode local-setup reference |
| `design-mockups/` | Rendered design directions + onboarding tutorial |

**Historical, safe to delete after commit:** `handoff-0015-reconcile.md`, `HANDOFF-0015-collision-check.md`, `RUN-THIS-IN-SUPABASE.sql` (0012+0013+0014, already applied), `recap-2026-06-29.md`, `handoff-0015-*`, `exprifi-status-and-next-steps.md` (superseded by this log's Status + Open items).
