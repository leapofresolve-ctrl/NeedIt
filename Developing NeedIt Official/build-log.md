# Needit — Build Log

_MVP = Lane 2 (open request board). No payments, no catalog, no Lane 1 yet._

## Status at a glance
- **Milestone:** M0 — vertical slice (Lane 2)
- **Last updated:** Jun 25, 2026

---

## ✅ Done
- **Scaffold** — `create-next-app -e with-supabase` → full Next.js App Router + Supabase + Tailwind + shadcn/ui starter, auth pre-wired.
  - App lives at: `~/Desktop/NeedIt/Developing NeedIt Official/needit/`
- **Git committed** — initial scaffold snapshot.
- **GitHub auth** — installed GitHub CLI (`gh`), logged in as `leapofresolve-ctrl` via browser device flow. Credentials saved.
- **Pushed to GitHub** — repo: `github.com/leapofresolve-ctrl/NeedIt`, branch `main`.
  - Note: git repo root is `~/Desktop/NeedIt` (one level above the app). App is nested at `Developing NeedIt Official/needit/` → **Vercel Root Directory must be set to that subpath.**

## ✅ Done (cont.)
- **Supabase project created** — `needit` (ref `cfcjcxgmntkatamflaqh`), org VoloksVault, free/NANO, us-west-2. URL + publishable key saved to Vercel env + local `.env.local`.
- **App relocated** — moved from `Developing NeedIt Official/needit` → repo-root `needit` (Vercel rejects spaces in serverless function paths). App now at `~/Desktop/NeedIt/needit`.
- **Deployed to Vercel — LIVE & GREEN** — project `need-it`, Root Directory `needit`, Next.js preset, both env vars set. Live at **https://need-it.vercel.app** — homepage + `/auth/login` render, Supabase connected.

## ✅ Done (Step 3 — backend, Jun 27)
- **Schema + RLS** — ran full SQL block in Supabase SQL Editor. "Success." Tables: profiles, requests, offers, deals + auto-profile trigger + indexes + all RLS policies.
- **Storage** — `offer-photos` bucket created (public). Added RLS policy: authenticated users can insert into `offer-photos` (needed for uploads — not in original plan).
- **Auth URLs** — Site URL = `https://need-it.vercel.app`; Redirect URLs allow-list = vercel + `localhost:3000` (for local dev).

## Step 4 — Features (one at a time, test after each)
1. ✅ **Onboarding / set username (Prompt 1)** — LIVE & verified. Files: app/onboarding/{page.tsx,actions.ts}, components/onboarding/username-form.tsx; home guard in app/page.tsx; post-login redirect → "/". 
   - **Trigger fix:** the schema's `handle_new_user` trigger was auto-setting username = email prefix, so onboarding never fired (and it leaked identity — against masked-identity principle). Changed trigger to insert profile with NULL username; ran `update profiles set username = null` to reset test accounts. Now new users must pick a username. Verified live: logged-in user with null username → redirected to /onboarding "Welcome to Exprifi" form.
2. ✅ **Post a Need + Exprifi board (Prompts 2 & 3 bundled)** — LIVE & verified end-to-end. Home (app/page.tsx) replaced starter landing with: logged-out Exprifi landing (sign in/up); logged-in board listing open requests (newest first) with type/sport/condition/time-left badges + budget, empty state, SiteHeader nav (components/site-header.tsx: Exprifi logo, Post a Need, AuthButton). /post page + form (components/post/post-need-form.tsx) + createNeed action (app/post/actions.ts) — budget dollars→cents, expiry 24h/3d/7d→expires_at, inserts request (RLS ok), redirects to board. Verified: posted "2003 Topps Chrome LeBron rookie (raw)" $200 → appeared on board. (Test need exists in DB; Kyle can delete later.)
   - Minor polish TODO: timeLeft() floors hours so a fresh 7d need shows "6d left" — switch to ceil. Batch with next feature.
   - Board cards link to /request/[id] (built next) — clicking 404s until then.
   - **Optional reference photo added (Kyle request, Jun 27):** `requests.image_url` column; public `request-photos` bucket + authenticated-insert policy; file input on post form; server-action upload (next.config serverActions.bodySizeLimit=8mb); thumbnail on board cards (plain <img>, no next/image config needed). Optional — posting without a photo still works.
3. ✅ **Request detail + structured offer (Prompt 4)** — LIVE & verified. app/request/[id]/page.tsx (async params), actions.ts (createOffer, photo→offer-photos), components/offer/offer-form.tsx. Buyer sees private offers list (RLS); non-buyer sees offer form (price/condition/photo/note, no chat). Verified: offer flowed account→account.
4. ✅ **Accept / decline + match (Prompt 5) — CORE MVP LOOP COMPLETE** — LIVE. Two SECURITY DEFINER SQL funcs `accept_offer`/`decline_offer` (buyer-only auth check via auth.uid(); accept is atomic: offer→accepted, siblings→declined, request→matched, insert deal; guards against double-accept via status check). Server actions acceptOffer/declineOffer (form actions calling rpc + revalidatePath). Accept/Decline buttons on pending offers; "It's a match! 🎉" panel reveals seller + "payments/shipping coming soon". Verified offer-send success state; accept test handed to Kyle (2-account).
   - timeLeft now uses ceil (shows "7d left" correctly).

## ✅ Done (Step 5 — Profiles + private wants, Jun 28)
5. ✅ **Public profile + want board (Prompt 6-ish) — LIVE & verified.** `app/u/[username]/page.tsx`: pseudonymous profile at `/u/<username>`; any logged-in member can view a user's open **public** needs (their want board) and make offers via the existing flow. Owner view of the same page doubles as the buyer command center — each need shows an **offer-count badge** (read directly; RLS lets the buyer read offers on their own requests, so no denormalized counter needed for the owner's own view) plus a "Matched & closed" history section. Nav/discovery: `auth-button.tsx` now shows **@username linked to the profile** (stopped printing the email — leak-defense win); "Posted by" on request detail + a new "by @username" line on each board card link to the poster's profile. Verified live: `/u/voloksvault` shows header, "2 open needs", offer badges; board shows attribution links.
6. ✅ **Private vs public wants (NEW Kyle, Jun 28) — LIVE & verified.** A want can be saved as a private wishlist and published to the board later ("put the call out"); **expiry starts at publish**, not at draft. 
   - **DB (migration `needit/supabase/migrations/0002_request_visibility.sql`, run in SQL Editor):** added `requests.visibility text not null default 'public' check (public|private)` + index `requests_visibility_status_idx`; **replaced the SELECT RLS** so private rows are readable only by their owner (`visibility = 'public' or auth.uid() = buyer_id`).
   - **Code:** post form has a Visibility radio (hides expiry when private; button → "Save private want"); `app/post/actions.ts` sets visibility + nulls expiry for private + redirects private posts to the owner's profile. Profile has an owner-only **"Private wants"** section with a duration picker + **"Post to board"** publish action (`app/u/[username]/actions.ts` — sets visibility=public, sets expires_at). Board (`app/page.tsx`) + want board now filter `visibility='public'` so the owner's own private wants don't leak onto either board. Non-owner hitting a private want URL → 404 (RLS).
   - Verified live: post form shows the Visibility choice; deploy green.

## ✅ Done (Step 6 — Editable wants, avatar menu, counter-offers, Jun 28)
7. ✅ **Editable private wants + avatar account menu — LIVE.** Private wants now have an **Edit** button → `/request/[id]/edit` (`app/request/[id]/edit/page.tsx` + `components/post/edit-need-form.tsx`); `updateNeed` action (`app/request/[id]/actions.ts`) guards owner + visibility='private' (public/live needs aren't editable here — edit screen redirects away), supports replacing the photo. Header now shows a round **avatar menu** (`components/user-menu.tsx`, shadcn dropdown) in the top-right with My board / Post a Need / Log out; `auth-button.tsx` renders it instead of the plain @username + logout. No DB change. Verified: deploy green.
8. ✅ **Counter-offers (NEW Kyle) — LIVE; full loop needs Kyle's 2-account test.** Structured price negotiation, no chat.
   - **DB (migration `needit/supabase/migrations/0003_counter_offers.sql`):** added `offers.current_price_cents` (backfilled, NOT NULL), `offers.counter_by` ('buyer'|'seller'|null), `offers.counter_round` (default 0). No enum change — negotiation stays `status='pending'` with `counter_by` tracking whose turn. Rewrote `accept_offer` (party-aware: the side that did NOT make the last move accepts; **locks price_cents = current_price_cents**; still atomic — siblings decline, request→matched, deal inserted) and `decline_offer` (either party may end it). New `counter_offer(p_offer_id, p_price_cents)` validates turn + enforces round cap; all SECURITY DEFINER.
   - **Code:** `counterOffer` action + `createOffer` now sets `current_price_cents`. Request page (`app/request/[id]/page.tsx`) reworked: buyer sees all offers, **seller now sees their own offer's state** (previously only the offer form) incl. a seller-side match panel when they win. Whoever's turn it is gets Accept/Counter/Decline; the other side sees "waiting". `CounterForm` (`components/offer/counter-form.tsx`) = inline price input. Each offer shows a **"X counters left"** countdown badge (shared pool).
   - **Round cap = 10** (≈5 each), set as `COUNTER_LIMIT` in the page + `v_max` in the SQL. "Do 10 for now, adjust later" (Kyle, Jun 28).
   - **Verified live (Jun 29):** buyer counter works end-to-end — $200→$150, countdown 10→9, turn flipped to seller, buyer sees "waiting". (Seller-side accept/counter still Kyle's to confirm with the 2nd account, but logic is symmetric.)
   - ⚠️ **GOTCHA that cost a debugging detour:** the `0003` migration was run in two parts and only the **column ALTERs** applied — the **functions never got created**, so `counter_offer` was missing. The old deployed `counterOffer` action swallowed the resulting RPC error → counters failed **silently** (a transient cold-start 503 in the browser was a red herring; Vercel logged the POST as 200). Root-caused by checking the Supabase Functions list directly. **Lesson: after running any migration with functions, confirm them in Supabase → Database → Functions; and don't swallow `supabase.rpc` errors.**
   - **Error surfacing — DONE & pushed (Jun 29):** `counterOffer` + `CounterForm` now show the RPC error on-screen (via `useActionState`) instead of failing silently. Live.

## ✅ Done (Step 7 — Seller command center + transaction history, Jun 29)
9. ✅ **"Your offers" on the profile (counters surface to the seller) — LIVE & verified.** New owner-only section near the top of `/u/[username]` listing offers you've *sent* as a seller, each linking to the request. Status badges: **"Your move — counter waiting"** (buyer countered, your turn), "Waiting on buyer," "Matched 🎉," "Declined," "Closed." This is the seller-side counterpart to the buyer command center — a buyer's counter now shows up on the offerer's own page. Reads embedded `requests(title,status)` (RLS-safe; seller can read own offers). Verified live.
10. ✅ **Completed deals moved into the avatar dropdown — LIVE & verified.** Removed the on-profile "Completed deals" block; added a **Completed deals** item to the avatar menu (`components/user-menu.tsx`) → new page **`/completed-deals`** (`app/completed-deals/page.tsx`) showing **Bought** (your needs that matched) and **Sold** (your offers that were accepted). Verified live: shows LeBron $200 (Bought/Matched) + Every chargers card ever $40 (Sold).
11. ✅ **Paginated, full-width History log — LIVE & verified.** Replaced the old "Matched & closed" grid with a **History** running log of past needs (status≠open). Full-width single-column rows; **server pagination via `?hsize=&hpage=` searchParams** with `.range()` + exact count. Controls sit at the **bottom**: "Show 10/25/50" size selector + **← / → arrows** + "Page X of Y" (links carry `#history` to keep scroll position). Page sizes locked to `PAGE_SIZES = [10,25,50]`.
   - Note: History currently logs the **buyer side** (your past needs); seller-side completed sales live in `/completed-deals` and "Your offers". Could unify into one transaction log later if wanted.
   - **Real-time notifications still TODO:** counters/offers only surface when the seller opens their profile — no push/email/badge alert yet (separate, bigger piece; Kyle flagged interest).

## ✅ Done (Step 8 — Notifications: in-app + email + live bell, Jun 29)
12. ✅ **In-app notifications — LIVE & verified.** DB migration `0004_notifications.sql`: `notifications` table (user_id, type, request_id, offer_id, read, created_at) + RLS (own select/update only) + a SECURITY DEFINER trigger `notify_offer_change` on `offers` (insert→`new_offer` to the buyer; update→`counter`/`accepted`/`declined` to the correct party, computed from `auth.uid()` so the actor is never self-notified). Header **bell** (`components/notification-bell*.tsx`) with unread badge → **`/notifications`** page (`app/notifications/page.tsx`) listing items linked to their request, auto-marking read on view (`MarkReadOnView` client effect + `markAllRead` action). Verified live: counter/accept/new-offer all generated rows and showed up.
13. ✅ **Live-updating bell + hover preview — LIVE & verified.** Bell is now a client component (`notification-bell-client.tsx`) that **polls `/api/notifications/count` every 15s + on tab-focus**, so the badge updates with no refresh. **Hover** shows a preview box of the 5 most recent notifications (each linked) + "See all"; **click** still opens the full page. Verified live (preview showed real counter/accepted/new-offer items).
14. ✅ **Settings + email notifications — CODE LIVE; email needs external setup.** `0005_email_notifications_pref.sql`: `profiles.email_notifications` boolean (default true). **`/settings`** page (avatar menu → Settings) with the email toggle (`updateSettings` action). Email delivery: **`/api/notifications/email`** route called by a **Supabase Database Webhook** on `notifications` insert → looks up recipient email (service role) + preference + request title → sends via **Resend**. Route is inert until env vars exist. Verified: Settings save works; bell/in-app fully live.
    - **Email turn-on (Kyle's external setup — DONE Jun 29):** Resend account + `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTIFY_WEBHOOK_SECRET` added to Vercel (server-only); Supabase DB webhook on `notifications` insert → POST to the route with `x-webhook-secret` header, timeout 5000ms. **Env vars require a redeploy to take effect.**
    - ⚠️ **Resend test-mode limit:** with the default sender `onboarding@resend.dev`, Resend only delivers to your own Resend-account email. **To email any user, verify a domain (e.g. exprifi.com) in Resend and set `EMAIL_FROM`.** Not done yet.
15. ✅ **"Your offers" shows ACTIVE only (Jun 29).** That profile section now filters to `status='pending'` — matched/declined offers drop off automatically and live in History / Completed deals instead.
    - ⚠️ **Recurring gotcha repeated again:** notifications "didn't work" at first because migration 0004 was run in parts — the **table** existed but the **trigger** wasn't created. Same lesson: run the *whole* migration (functions/triggers included) and verify in Supabase. Also: the notification bell is **not** instant — it updates on poll/focus/navigation, and lights for the **recipient**, not the actor.

## ✅ Done (Step 9 — Email delivery LIVE end-to-end, Jul 2)
16. ✅ **Email notifications fully working — VERIFIED (Resend shows "Delivered" to kylevolo72@gmail.com, sent from the verified domain).** Three things were broken/missing; all fixed Jul 2:
    - **Domain verified:** exprifi.com added in Resend (region us-east-1) and **verified**. DNS added at **Namecheap** (registrar): DKIM TXT `resend._domainkey`, SPF TXT on host `send`, **MX on host `send`** → `feedback-smtp.us-east-1.amazonses.com` (prio 10, required switching Namecheap MAIL SETTINGS from "Email Forwarding" → **Custom MX**; no forwarders existed so nothing broke), plus optional DMARC TXT `_dmarc` = `v=DMARC1; p=none;`.
    - **`EMAIL_FROM` set in Vercel** = `Exprifi <notifications@exprifi.com>` (Production+Preview) + redeploy.
    - **Bug 1 — middleware 307:** the Supabase webhook POST to `/api/notifications/email` was being **redirected to /auth/login** by the auth middleware (no session cookie), so the route never ran — emails had silently never sent. Fix: exempt that path in `lib/supabase/proxy.ts` (route already self-authenticates via `x-webhook-secret`). Commit `e5cb84f`.
    - **Bug 2 — webhook 401:** the Supabase webhook header `x-webhook-secret` contained the **literal string "NOTIFY_WEBHOOK_SECRET"** (env var *name* pasted instead of a value). Fix: minted a fresh 64-hex secret (browser-generated → clipboard; never displayed) and pasted the same value into BOTH the Supabase webhook header and Vercel's `NOTIFY_WEBHOOK_SECRET`, then redeployed.
    - **Debug trail for posterity:** Vercel logs showed POST `/api/notifications/email` go **307 → 401 → 200** as each layer was fixed. Test method: `insert into notifications (user_id, type, request_id) values (...)` in the Supabase SQL editor fires the webhook exactly like production.
    - ⚠️ Two synthetic "counter" notifications for **voloksvault** were created during testing (in-app bell will show them; harmless). Also the real test negotiation on "baseball test" advanced: voloksvault countered $0.03, now waiting on voloktest (round 5 of 10).
    - ⚠️ **exprifi.com still points at a Namecheap parking page** (www CNAME + URL redirect). Fine for now (Kyle OK with site not public yet); when ready, point it at Vercel — also helps email deliverability reputation.

## ✅ Done (Step 10 — Admin /metrics liquidity dashboard, Jul 2)
17. ✅ **Admin-only `/metrics` page — LIVE & verified (commit `d80b7ff`).** The M1 dashboard: % of published needs with ≥1 offer, median + p90 time-to-first-offer, offers per need (and per engaged need), avg counter-rounds across negotiated offers, match rate, and 7-day bar trends (needs/offers/matches). All computed live from `requests`/`offers`/`deals` — no tracking events.
    - **Gating:** migration `0006_admin_metrics.sql` adds `profiles.is_admin` (true only for voloksvault) + `admin_metrics()` SECURITY DEFINER function that raises `not authorized` unless the caller's profile is admin (verified: raises under the bare `authenticated` role). The page also checks `is_admin` and redirects non-admins home. RLS alone can't gate cross-user aggregates — the definer-function-with-check is the pattern.
    - **Caveat:** publish time isn't stored for private→published wants, so TTFO measures from `created_at` (noted on the page). Add a `published_at` column if this ever matters.
    - First reading (Jul 2): 4 published needs, 100% with ≥1 offer, median TTFO 21h, p90 1.8d, 1.25 offers/need, 2.67 counter-rounds avg, 75% match rate.

## ✅ Done (Step 11 — Offer-count badges + board filters/sort + My board link, Jul 2)
18. ✅ **Offer-count badge on board cards — LIVE & verified.** Migration `0007_offer_count.sql`: denormalized `requests.offer_count` (offers stay RLS-private; only the aggregate is public) kept in sync by SECURITY DEFINER trigger `offers_count_sync` on offers insert/delete + backfill. Board cards show "N offers" (hidden at 0). Verified: trigger exists, baseball test shows "1 offer".
19. ✅ **Board filters + sort — LIVE & verified.** GET-form → searchParams on `/`: filter by type (single/bulk), sport (post-form list), condition (ilike), budget $ min/max (converted to cents); sort newest / expiring soon / highest budget. Form reflects URL state; filtered-empty state has "Clear filters". Verified live (`?type=bulk&sort=budget` correctly filters).
20. ✅ **"My board" header button.** One-click hop from the main board to your own `/u/<username>` page, next to the avatar (hidden on mobile widths — avatar menu still has it).

## ⬜️ Next up — enhancements
1. ~~"My Needs" inbox~~ — DONE via the owner profile view (offer counts + manage).
2. ~~Editable private wants~~ — DONE (Step 6). Could later allow editing live/public needs (with care re: offers in flight).
3. ~~Counter-offers~~ — DONE (Step 6); cap=10 for now, tune later.
4. Offer-count badge on the *public* board (needs denormalized counter) — still future; the owner's own profile shows counts already.
5. **Mandatory offer photos (NEW Kyle, Jun 27):** require photo on offers (currently optional). REC: required for single-card offers (trust/anti-fake), optional for bulk/filter requests (avoid suppressing liquidity); revisit from usage. Kyle's call.
6. **Preset buyer questions on an offer (scoped Jun 29, not built):** canned-only Q&A (no free text → leak-safe) — "Is price firm?", "Bundle?", "More photos?", "In hand?". Build when ready.
7. ~~Verify a Resend domain + set `EMAIL_FROM`~~ — **DONE Jul 2** (see Step 9). Emails deliver to any user from `notifications@exprifi.com`.
8. **(Optional) Supabase Realtime** for truly-instant bell (websockets) instead of the 15s poll.
9. Polish: filters/sort on board, buyer/seller mode landing (DEFERRED until follower-marketing plan is finalized), pixel sizing tweaks.

See `exprifi-status-and-next-steps.md` for the full kickoff brief (open in new chats).

**Workflow (CHANGED Jun 27):** Cursor's AI agent kept building in the wrong folder (made a stray `gradesave` repo). Switched to: **Claude writes feature files directly into `~/Desktop/NeedIt/needit` (Cowork now mounted at `~/Desktop/NeedIt`), type-checks with tsc, then Kyle runs `git add -A && git commit && git push` from `~/Desktop/NeedIt`** → Vercel deploys → Claude verifies live. Do NOT run git from Claude's sandbox (it leaves a stale .git/index.lock; if seen, Kyle runs `rm -f ~/Desktop/NeedIt/.git/index.lock`).

**Gotcha fixed:** Next 16 shipped with `cacheComponents: true` in next.config.ts — breaks builds for auth/cookie pages (prerender error). Set to disabled. Keep it off.

## ⚠️ Follow-up (before email auth is fully tested)
- Set Supabase **Auth → URL Configuration → Site URL** to `https://need-it.vercel.app` so signup/confirmation emails redirect to the live app (not localhost). Do when we first test signup.
- Optional tidy: reconnect Cowork workspace folder to `~/Desktop/NeedIt` so Claude regains direct file access to the app (now outside the old mounted folder).

## 🏷️ Naming (decided Jun 25)
- **Public brand = Exprifi** (domain: exprifi.com). Apply at UI/marketing + point domain at Vercel.
- **Internal codename = needit** (repo, folders, Supabase project) — intentionally not renamed.

## 💡 Future ideas (post-MVP)
- **"My Needs" inbox (Kyle, Jun 27):** buyer command-center page listing the user's own posted needs with offer counts; drill in to view/act on offers. (≈ doc Prompt 6 /my-needs.) Build right after Feature 4 — it's where accept/decline lives most naturally.
- **Offer-count badge on board (Kyle, Jun 27):** colored badge on each board card showing # of offers, as public social proof / "sellers race" signal. NOTE: offers are RLS-restricted to buyer+sellers, so a PUBLIC count needs a denormalized `offer_count` column on requests kept in sync by a trigger on offers insert/update. Build with the inbox.
- **Split "buyer/seller" landing (Kyle, Jun 27):** split-screen landing — NOT an account-type gate (keep one account that's both; beachhead = breakers who are both sides). Frame as intent/mode: "Find cards" (→ /post) vs "Sell cards" (→ board). Black/white base + one accent color per mode as a light visual cue, not two separate apps. Marketing/onboarding polish for later. NOTE (Jun 28): marketing plan for seeding followers is NOT finalized — defer this until that plan exists.
- **Seller inventory + want-match alerts (Kyle, Jun 28) — LANE 1 territory:** members upload the cards they own to their account; when a buyer later posts a call-out that matches one of those cards, the seller gets pinged so they can move it fast. This is the seller-side inventory that powers Lane 1's instant price-match — keep it as M2, after Lane 2 liquidity is proven. (Earlier this was the "CSV of collection items" idea — same thing.)
- **Seller "Showcase" (Kyle, Jun 29) — DEFERRED to Lane 1 (M2):** a carousel of small boxes on the profile showing the user's available singles/bulk lots (short description, arrow paging, click → fullscreen). This is seller *inventory/listings* = the catalog/forward-marketplace surface we locked as M2; pairs with the inventory-alerts + variant-taxonomy items. Talked through Jun 29 and **Kyle chose to defer** until Lane 2 liquidity is proven. When built, keep it leak-safe (structured descriptions, no off-platform contact) and decide whether buyers can act on showcase items (that's the Lane 1 step).
- **Card variant taxonomy / fuzzy matching (Kyle, Jun 28):** a way to normalize card identities so buyers don't have to type every detail. A loose request ("CJ Stroud Prizm #88") should match/notify ALL parallels of that card; a specific one ("the red & blue version") should narrow to just that parallel. Needs a structured card catalog + a matching layer (broad vs. specific intent). Prereq/companion to the inventory-alerts feature above; both are Lane 1 building blocks.

## 🧠 Open items / reminders
- Supabase project: confirm it exists and grab Project URL + anon/publishable key for env vars.
- Money = integer cents everywhere.
- Never put the secret/service_role key in a `NEXT_PUBLIC_` var.
