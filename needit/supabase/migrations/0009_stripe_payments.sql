-- 0009 — Stripe Connect payments (test-mode foundation)
--
-- Marketplace model: SEPARATE CHARGES AND TRANSFERS.
--   Buyer pays the PLATFORM (Checkout Session in payment mode, no transfer_data).
--   Funds sit on the platform balance until release, then a Transfer with
--   source_transaction moves money to the seller's connected account.
--   Money is ALWAYS integer cents. Platform fee is 0% at launch (transfer the
--   full amount); when we monetize we transfer LESS than the charge.
--
-- Deal payment lifecycle (payment_status):
--   unfunded -> funded -> shipped -> released
--                     \-> refunded
--                     \-> disputed
--
-- All Stripe object ids are stored as text. Timestamps are timestamptz.
-- This migration is additive and idempotent (safe to re-run).

-- ── Seller connected accounts live on the profile ───────────────────────────
-- A seller is a "recipient" connected account (v1 controller: express dashboard,
-- platform pricing + platform loss liability, transfers capability only — never
-- card_payments). stripe_payouts_enabled mirrors the account's transfers status
-- and is the gate we check before allowing a buyer to fund a deal.
alter table public.profiles
  add column if not exists stripe_account_id       text,
  add column if not exists stripe_payouts_enabled  boolean not null default false;

create unique index if not exists profiles_stripe_account_id_key
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

-- ── Payment columns on the existing deals ledger ────────────────────────────
alter table public.deals
  add column if not exists payment_status  text not null default 'unfunded'
    check (payment_status in ('unfunded','funded','shipped','released','refunded','disputed')),
  add column if not exists amount_cents     integer,          -- locked charge amount (integer cents)
  add column if not exists currency         text not null default 'usd',
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id   text,
  add column if not exists stripe_charge_id            text,   -- source_transaction for the release transfer
  add column if not exists stripe_transfer_id          text,
  add column if not exists tracking_number             text,
  add column if not exists funded_at        timestamptz,
  add column if not exists shipped_at       timestamptz,
  add column if not exists released_at      timestamptz,
  add column if not exists refunded_at      timestamptz,
  add column if not exists auto_release_at  timestamptz;      -- set on shipped; timer target for auto-release

create index if not exists deals_payment_status_idx on public.deals (payment_status);
create index if not exists deals_auto_release_idx
  on public.deals (auto_release_at)
  where payment_status = 'shipped';

-- ── Webhook idempotency ─────────────────────────────────────────────────────
-- Every Stripe event id is recorded before we act on it; a duplicate delivery
-- (Stripe retries) is a no-op. Service-role only — never client-readable.
create table if not exists public.stripe_events (
  id           text primary key,          -- Stripe event id (evt_...)
  type         text not null,
  received_at  timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
-- No policies => only the service-role key (used by the webhook route) can touch it.

-- ── RLS: parties can read their own deal's payment fields ───────────────────
-- The deals table already has RLS from the base schema; this adds an explicit
-- self-select policy only if one isn't already present, so buyer/seller can see
-- payment_status in the UI. Writes stay server-side (RPC / service role).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'deals'
      and policyname = 'deals readable by parties'
  ) then
    create policy "deals readable by parties" on public.deals
      for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
  end if;
end $$;
