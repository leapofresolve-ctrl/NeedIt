# Stripe Connect — test-mode setup & smoke test

Marketplace on **separate charges & transfers**. Buyer pays the platform → funds held on the platform balance → released to the seller (Stripe Express *recipient* account) via a Transfer with `source_transaction`. 0% platform fee at launch. All amounts integer cents.

Deal lifecycle: `unfunded → funded → shipped → released` (with `refunded` / `disputed` branches).

---

## 1. Dashboard toggles — only you can do these (test mode)

1. **Accept loss liability**: <https://dashboard.stripe.com/settings/connect/platform-profile> — required before creating connected accounts with platform-owned loss liability (`losses.payments = application`).
2. **Complete the Connect platform profile** (business/industry questions) if not already done.
3. **Enable Radar for Platforms**: <https://dashboard.stripe.com/settings/radar> — you carry fraud/dispute liability; Radar does the ML.

## 2. Keys → paste into `.env.local` (never into chat, never `NEXT_PUBLIC_` for secrets)

From <https://dashboard.stripe.com/test/apikeys>:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

From Supabase (Project → Settings → API → `service_role`):

```
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`STRIPE_WEBHOOK_SECRET` comes from step 4.

## 3. Apply the migration

`supabase/migrations/0009_stripe_payments.sql` — adds payment columns to `deals`, `stripe_account_id` + `stripe_payouts_enabled` to `profiles`, and a `stripe_events` idempotency table. Run `supabase db push` (or paste the SQL into the Supabase SQL editor).

## 4. Webhooks (local dev)

```
brew install stripe/stripe-cli/stripe   # or see stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.

## 5. Smoke test the vertical slice

**Seller onboarding** — signed in as a seller, `POST /api/stripe/connect` → open the returned `url` → complete Stripe's test onboarding (phone `000 000 0000`, SSN `000-00-0000`, test bank `110000000 / 000123456789`). On return, `account.updated` flips `stripe_payouts_enabled = true`.

**Buyer funds a matched deal** — signed in as the buyer on a matched deal, `POST /api/stripe/checkout` with `{ "dealId": "<uuid>" }` → open `url` → pay with card `4242 4242 4242 4242`, any future expiry/CVC. `checkout.session.completed` sets the deal to **funded** and records the charge id.

**Ship & release** — seller calls `markShipped(dealId, tracking)` (→ `shipped`, starts the 3-day auto-release timer); buyer calls `confirmDelivery(dealId)` → Transfer to the seller, deal **released**.

**Refund / dispute** — `requestRefund(dealId)` on a funded deal refunds the charge (`charge.refunded` → `refunded`). Trigger a test dispute with card `4000 0000 0000 0259` to exercise the `disputed` branch.

## 6. Where to wire the UI (server pieces are done)

| Surface | Action / route | File to add the button in |
|---|---|---|
| Settings → "Connect payouts" | `POST /api/stripe/connect` | `app/settings/page.tsx` |
| Match panel → "Fund this deal" (buyer) | `POST /api/stripe/checkout` | `app/request/[id]/page.tsx` match panel |
| Deal view → "Mark shipped" (seller) | `markShipped()` | `app/completed-deals` or a new deal view |
| Deal view → "Confirm delivery" (buyer) | `confirmDelivery()` | same |

Gate the "Fund this deal" button on the seller's `stripe_payouts_enabled` (checkout also re-checks server-side and returns `seller_payouts_not_ready`).

## Files added

- `supabase/migrations/0009_stripe_payments.sql`
- `lib/stripe/server.ts`, `lib/stripe/config.ts`
- `lib/supabase/admin.ts`
- `app/api/stripe/connect/route.ts`, `app/api/stripe/connect/return/route.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/deals/actions.ts`

## Not built yet (next slices)

Auto-release cron (a scheduled job that releases `shipped` deals past `auto_release_at`), the identity-reveal flip on funding, embedded Connect components (vs. today's hosted onboarding), and the UI buttons above. Live-mode flip is Week 4.
