# Stripe — local test-mode setup reference

**Scope:** how to get Stripe running locally. **Nothing here is status.**
For what's built, what's broken and what's left, see the **Payments (M3)** section of `build-log.md` — that's the single source of truth.

> **Where this stands in one line:** test mode only, wired end-to-end in code, **webhook auto-funding has never once completed end-to-end**. Live flip is not scheduled and is not on the launch path.

---

## Local setup, in order

1. **Dashboard toggles** (test mode) — accept loss liability, enable Radar for Platforms.
2. **Keys in `.env.local`** — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus `SUPABASE_SERVICE_ROLE_KEY` (the webhook writes via the service-role client — it is **not** optional).
3. **Migration `0009_stripe_payments.sql`** applied.
4. **`stripe listen --forward-to localhost:3000/api/stripe/webhook`** running in its own terminal. Its printed signing secret must equal `.env.local`'s `STRIPE_WEBHOOK_SECRET`.
5. **Restart `npm run dev`** and wait for "Ready in…" before testing any route.

## Traps that have already cost time

- **Restarting the dev server is load-bearing.** Env vars only load at startup. A key added to `.env.local` while the server is running reads as blank.
- **`.env.local` must be saved to disk.** Keys typed into Cursor but never saved read as blank. Verify on disk, not in the editor buffer. Terminal noise (`(^C to quit)`) has also been pasted onto the end of a secret — check for it.
- **`stripe listen` is fragile.** It dies on a network blip. **A crashed listener looks exactly like "the payment didn't confirm."** Check the listener before debugging the app.
- **If the webhook 307s to `/auth/login`, an old allowlist proxy has been deployed.** The Jul 29 denylist `proxy.ts` is the permanent fix — webhooks are public by construction and authenticate themselves by signature. Never reintroduce an allowlist proxy.
- **"Payment succeeded" ≠ "deal funded."** Funding is webhook-driven; the Checkout success redirect is only UX. Debug at the webhook and `net._http_response`, not at checkout.
- **Two accounts are required** to test a two-sided flow, and the seller must be transfers-ready. Recover locked test accounts with `scripts/reset-user-password.mjs` rather than fighting the reset email.
- **Don't reuse deleted test accounts.** A ghost session (auth user deleted, JWT still valid) hits `profiles_id_fkey`. Sign up fresh.
- **Mac:** F12 is volume. Use **⌘⌥I** for the browser console.

## Test credentials (Stripe test mode — not secrets)

| | |
|---|---|
| Card | `4242 4242 4242 4242` (any future expiry, any CVC) |
| SSN | `000-00-0000` |
| Routing | `110000000` |
| Account | `000123456789` |
| Phone | `000 000 0000` |

## Secret hygiene

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` live in `.env.local` and Vercel only — never in code, **never in a `NEXT_PUBLIC_` var**, never pasted into chat or logs.
