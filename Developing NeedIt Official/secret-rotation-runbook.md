# Secret rotation runbook — Exprifi

*Written Jul 29, 2026. Phase 1, Block B. Do this once now, then twice a year and after any incident.*

---

## Why this is on the Phase 1 list

Three secrets were pasted into terminals, browser consoles, dashboards and chat windows during the July debugging run — the one that ended with the Resend webhook finally returning 200. Nothing leaked that we know of. That sentence is the problem: "that we know of" is not a security posture, and the debugging session that fixed email delivery involved generating a webhook secret in a browser, copying it to a clipboard, and pasting it into two separate dashboards.

Rotating costs about twenty minutes and removes the question entirely. It is also the last item that can quietly become a launch blocker, because two of these keys are only rotatable while you're calm.

**Do this before the doors open to real traffic, not after.**

---

## The three secrets, in the order to rotate them

Order matters. The service-role key is the dangerous one and it is also the one with the most consumers, so it goes first while you have the most attention.

### 1. `SUPABASE_SERVICE_ROLE_KEY` — the one that matters

**What it is:** a key that bypasses every row-level security policy in the database. Anyone holding it can read every member's email, every private want, every offer, and every deal. It is the single credential that makes the entire RLS model irrelevant.

**Where it is used:** `lib/supabase/admin.ts`, consumed by the Resend email route (`/api/notifications/email`), the metrics endpoints, and the username→email resolver in sign-in.

**Rotate:**

1. Supabase → Project Settings → API → Service role key → **Generate new key**.
2. Copy the new value **directly into Vercel** — Project → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY` → edit → paste → save for **Production and Preview**. Do not paste it into a terminal, a file, or a chat window on the way.
3. Redeploy. **Env var changes do not take effect until a redeploy** — this is the mistake that cost a day in July.
4. Verify before revoking the old key: hit `/api/health` and confirm `"database": "ok"`, then trigger one real notification (counter an offer on a test need) and confirm the email lands in Resend's dashboard as *Delivered*.
5. Only then revoke the old key in Supabase.

⚠️ **Never in a `NEXT_PUBLIC_` variable.** That prefix ships the value to every browser that loads the site. This is the standing guardrail and it applies to every secret below too.

### 2. `NOTIFY_WEBHOOK_SECRET` — the shared secret between Supabase and the email route

**What it is:** the value in the `x-webhook-secret` header that proves a POST to `/api/notifications/email` came from the Supabase database webhook and not from a stranger who guessed the URL.

**Why it's on the list:** this one was generated in a browser and pasted into two dashboards during the July fix. It also spent a while set to the literal string `NOTIFY_WEBHOOK_SECRET` — the variable *name* pasted instead of its value — which is exactly the kind of confusion that leads to a value ending up somewhere it shouldn't.

**Rotate — both sides, same value, or email silently stops:**

1. Generate: `openssl rand -hex 32` in a local terminal.
2. Paste into Vercel → `NOTIFY_WEBHOOK_SECRET` (Production + Preview).
3. Paste the **same value** into Supabase → Database → Webhooks → the `notifications` insert webhook → HTTP Headers → `x-webhook-secret`.
4. Redeploy Vercel.
5. Verify: run `insert into notifications (user_id, type, request_id) values (…);` in the Supabase SQL editor. That fires the webhook exactly like production does. Then check Vercel logs for a **200** on `/api/notifications/email` — a **401** means the two values don't match.

### 3. `METRICS_API_TOKEN` — the agent endpoints

**What it is:** the bearer token protecting `/api/metrics/daily` and `/api/metrics/concierge`, which the Morning Metrics and Concierge Scout agents will call in Phase 3.

**Rotate:** `openssl rand -hex 32` → Vercel → redeploy → update wherever the agents are configured. Lowest stakes of the three (it exposes aggregate liquidity numbers, not member data), but it's a one-minute job and it should not be the only unrotated secret left.

---

## Not rotating right now, and why

**Stripe keys.** They're test-mode only and were never pasted anywhere unusual. They get rotated as part of the live-mode switch after the Sep 14 gate — that's a single controlled event and doing it twice is churn without benefit.

**`RESEND_API_KEY`.** Blast radius is "someone can send email from `notifications@exprifi.com`", which is real but bounded and reversible in one click. Rotate it during the Phase 4 security pass unless something changes.

**`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.** Not a secret. It's designed to be public, and RLS is what protects the data behind it. If this key alone would let someone read something they shouldn't, the bug is in a policy, not in the key.

---

## After rotating

- [ ] `/api/health` returns 200 with `"database": "ok"`
- [ ] A real notification email lands (Resend shows *Delivered*)
- [ ] Sign-in works with a **username** — that path goes through the service-role client, so it's the check that proves the new key is live everywhere
- [ ] Old service-role key revoked in Supabase
- [ ] Note the date here: **rotated on ______**

## Standing rules

1. Secrets go **from their source directly into Vercel**. Not through a terminal, a file, a note, or a chat window.
2. Every env var change needs a **redeploy** to take effect.
3. Verify the new value works **before** revoking the old one.
4. Never a secret in a `NEXT_PUBLIC_` variable.
5. Rotate on a schedule (twice a year) and immediately after any incident, any contractor offboarding, or any debugging session where a secret was displayed on screen.
