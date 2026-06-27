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

## ⬜️ Next up — Step 4: Features (one at a time, test after each)
1. Onboarding / set username (Prompt 1)
2. Post a Need (Prompt 2)
3. Board with filters/sort (Prompt 3)
4. Request detail + make offer w/ photo (Prompt 4)
5. Accept / decline + deal unlock (Prompt 5)

**Workflow for features:** Claude gives a Cursor prompt → Kyle pastes into Cursor's AI (Composer/Agent) → it writes the code → Kyle commits + pushes → Vercel auto-deploys → Claude verifies on https://need-it.vercel.app. One feature per cycle.

## ⚠️ Follow-up (before email auth is fully tested)
- Set Supabase **Auth → URL Configuration → Site URL** to `https://need-it.vercel.app` so signup/confirmation emails redirect to the live app (not localhost). Do when we first test signup.
- Optional tidy: reconnect Cowork workspace folder to `~/Desktop/NeedIt` so Claude regains direct file access to the app (now outside the old mounted folder).

## 🏷️ Naming (decided Jun 25)
- **Public brand = Exprifi** (domain: exprifi.com). Apply at UI/marketing + point domain at Vercel.
- **Internal codename = needit** (repo, folders, Supabase project) — intentionally not renamed.

## 🧠 Open items / reminders
- Supabase project: confirm it exists and grab Project URL + anon/publishable key for env vars.
- Money = integer cents everywhere.
- Never put the secret/service_role key in a `NEXT_PUBLIC_` var.
