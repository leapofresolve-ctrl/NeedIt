# Stripe setup — handoff context (paste this to your assistant)

You are helping me finish wiring up Stripe on my Next.js + Supabase app. The
code is already written and passing typecheck — I only need to finish account
setup, add env keys, run a database migration, and test it. Help me with these
steps one at a time, plainly. I am not a developer.

## The app
- Next.js (App Router) + TypeScript, Supabase (Postgres/Auth/RLS), on Vercel.
- App folder on my Mac: `~/Desktop/NeedIt/needit`
- It's a marketplace: buyers fund a deal, money is held on the platform, then
  released to the seller. Stripe Connect + Payments, TEST MODE for now.

## What's already built (don't rewrite these)
- `lib/stripe/server.ts`, `lib/stripe/config.ts`, `lib/supabase/admin.ts`
- API routes: `app/api/stripe/connect/route.ts`, `.../connect/return/route.ts`,
  `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`
- Server actions: `app/deals/actions.ts`
- DB migration: `supabase/migrations/0009_stripe_payments.sql`
- The `stripe` npm package is installed.

## Remaining steps I need help with

### Step A — Stripe dashboard toggles (in the browser, test mode ON)
1. Accept loss liability: https://dashboard.stripe.com/settings/connect/platform-profile
2. Turn on Radar for Platforms: https://dashboard.stripe.com/settings/radar

### Step B — Fill in env keys in `~/Desktop/NeedIt/needit/.env.local`
The blank lines already exist. Paste each value after the `=` (no spaces, no
quotes, one line each):
- `STRIPE_SECRET_KEY=` → the `sk_test_...` "Secret key" from
  https://dashboard.stripe.com/test/apikeys (click "Reveal test key")
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` → the `pk_test_...` key on that same page
- `SUPABASE_SERVICE_ROLE_KEY=` → Supabase → Settings → API → `service_role` key
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (already filled)
- `STRIPE_WEBHOOK_SECRET=` → leave blank until Step D
After saving, restart the dev server (`npm run dev`) because env vars only load
at startup.

### Step C — Apply the database migration
Run `supabase db push` in the app folder, OR open the Supabase dashboard SQL
editor and paste/run the contents of
`supabase/migrations/0009_stripe_payments.sql`.

### Step D — Webhooks (local testing)
1. Install the Stripe CLI (Mac: `brew install stripe/stripe-cli/stripe`)
2. `stripe login`
3. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. It prints a `whsec_...` value — paste that into `STRIPE_WEBHOOK_SECRET=` in
   `.env.local`, then restart `npm run dev`.

### Step E — Smoke test the flow
1. Sign in as a seller, trigger `POST /api/stripe/connect`, open the returned
   URL, finish Stripe's test onboarding (phone 000 000 0000, SSN 000-00-0000,
   test bank routing 110000000, account 000123456789).
2. Sign in as the buyer on a matched deal, `POST /api/stripe/checkout` with
   `{ "dealId": "<the deal's uuid>" }`, open the URL, pay with test card
   4242 4242 4242 4242 (any future expiry, any CVC).
3. Confirm the deal shows as "funded" (the webhook sets this).

## Rules
- Test mode only. Never use live keys (`sk_live_`) yet.
- Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
  go ONLY in `.env.local`, never in code, never in a `NEXT_PUBLIC_` variable.
- Don't rewrite the files listed under "already built" unless something errors.

Ask me what step I'm on and walk me through just that one.
