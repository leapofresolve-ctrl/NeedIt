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

## ⬜️ Next up
1. **Deploy skeleton to Vercel** — import the `NeedIt` repo, set Root Directory = `Developing NeedIt Official/needit`, add Supabase env vars, confirm live URL + login works. (Deploy loop green BEFORE features.)
2. **Schema + RLS** — paste SQL block into Supabase SQL Editor, verify tables, create `offer-photos` storage bucket (public for MVP).
3. **Features (one at a time, test after each):** onboarding/username → post-a-need → board w/ filters → request detail + offer w/ photo → accept/decline + deal unlock.

## 🏷️ Naming (decided Jun 25)
- **Public brand = Exprifi** (domain: exprifi.com). Apply at UI/marketing + point domain at Vercel.
- **Internal codename = needit** (repo, folders, Supabase project) — intentionally not renamed.

## 🧠 Open items / reminders
- Supabase project: confirm it exists and grab Project URL + anon/publishable key for env vars.
- Money = integer cents everywhere.
- Never put the secret/service_role key in a `NEXT_PUBLIC_` var.
