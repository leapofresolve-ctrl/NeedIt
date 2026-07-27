# Tech Stack

## Architecture
- **Next.js 16 (App Router) + TypeScript** on **Vercel** — live at need-it.vercel.app; exprifi.com owned (Namecheap) but still parked, pointing it at Vercel is a pre-launch step
- **Supabase** — Postgres, Auth, **Row-Level Security everywhere**, Storage (photos). Project "needit", ref `cfcjcxgmntkatamflaqh`, org VoloksVault (free tier)
- **Tailwind + shadcn/ui**; brand 3a tokens (green #00A968, dark board, Instrument Sans)
- **Notifications:** Postgres triggers → in-app bell (15s poll + focus refresh); DB webhook → Vercel route → **Resend** email (`Exprifi <notifications@exprifi.com>`, verified; per-user opt-out in /settings; leak-safe content)
- **Payments (Aug 8):** Stripe — optional rail first, Connect escrow later

## Repo & deploy flow
- GitHub `leapofresolve-ctrl/NeedIt`, branch `main`; app in `needit/` subfolder; **Vercel Root Directory = needit** (parent folder name has spaces — Vercel can't use them in function paths)
- On disk: app `~/Desktop/NeedIt/needit`; docs `~/Desktop/NeedIt/Developing NeedIt Official`
- Workflow: Claude writes feature code directly + type-checks → **Kyle commits/pushes from `~/Desktop/NeedIt`** → Vercel auto-deploys → verify live. (Cursor's agent abandoned — built in wrong folders; stray `gradesave` repo is ignorable.)

## Hard rules
- **Money as integer cents. Everywhere. Always.**
- **Never put a secret in a `NEXT_PUBLIC_` var.**
- RLS is the security model — offers private to buyer, private wants owner-only. New tables get policies before data.

## Gotchas
- Keep `cacheComponents` **OFF** in `next.config.ts` (Next 16 default breaks auth pages)
- Git index locked → `rm -f ~/Desktop/NeedIt/.git/index.lock`; never run git from Claude's sandbox
- Webhook routes need middleware exemption (the Resend webhook 307'd to login before this)
- Test accounts: `voloksvault` (kylevolo72@gmail.com) + `voloktest`

## Integrations on deck
Stripe (Aug 8) · shipping labels (post-escrow, unscheduled) · Higgsfield (creative gen — already connected)

Related: [feature-roadmap.md](feature-roadmap.md)
