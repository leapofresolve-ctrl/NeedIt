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
3. ⬜️ Request detail + make offer w/ photo (Prompt 4) — makes board cards work; sellers respond with structured offer (price/condition/photo/note).
4. ⬜️ Accept / decline + deal unlock (Prompt 5)
5. ⬜️ Polish: filters/sort on board, my-needs page, timeLeft ceil.

**Workflow (CHANGED Jun 27):** Cursor's AI agent kept building in the wrong folder (made a stray `gradesave` repo). Switched to: **Claude writes feature files directly into `~/Desktop/NeedIt/needit` (Cowork now mounted at `~/Desktop/NeedIt`), type-checks with tsc, then Kyle runs `git add -A && git commit && git push` from `~/Desktop/NeedIt`** → Vercel deploys → Claude verifies live. Do NOT run git from Claude's sandbox (it leaves a stale .git/index.lock; if seen, Kyle runs `rm -f ~/Desktop/NeedIt/.git/index.lock`).

**Gotcha fixed:** Next 16 shipped with `cacheComponents: true` in next.config.ts — breaks builds for auth/cookie pages (prerender error). Set to disabled. Keep it off.

## ⚠️ Follow-up (before email auth is fully tested)
- Set Supabase **Auth → URL Configuration → Site URL** to `https://need-it.vercel.app` so signup/confirmation emails redirect to the live app (not localhost). Do when we first test signup.
- Optional tidy: reconnect Cowork workspace folder to `~/Desktop/NeedIt` so Claude regains direct file access to the app (now outside the old mounted folder).

## 🏷️ Naming (decided Jun 25)
- **Public brand = Exprifi** (domain: exprifi.com). Apply at UI/marketing + point domain at Vercel.
- **Internal codename = needit** (repo, folders, Supabase project) — intentionally not renamed.

## 💡 Future ideas (post-MVP)
- **Split "buyer/seller" landing (Kyle, Jun 27):** split-screen landing — NOT an account-type gate (keep one account that's both; beachhead = breakers who are both sides). Frame as intent/mode: "Find cards" (→ /post) vs "Sell cards" (→ board). Black/white base + one accent color per mode as a light visual cue, not two separate apps. Marketing/onboarding polish for later.

## 🧠 Open items / reminders
- Supabase project: confirm it exists and grab Project URL + anon/publishable key for env vars.
- Money = integer cents everywhere.
- Never put the secret/service_role key in a `NEXT_PUBLIC_` var.
