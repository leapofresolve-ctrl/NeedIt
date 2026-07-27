"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { sellerTransferCents, AUTO_RELEASE_DAYS } from "@/lib/stripe/config";

/**
 * Deal money-movement actions. Each authenticates the caller with the user
 * client, then performs the privileged write with the service-role client after
 * an explicit ownership + status check (state transitions bypass RLS the same
 * way the accept_offer RPC does).
 */

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Seller marks the deal shipped and starts the auto-release timer. */
export async function markShipped(
  dealId: string,
  trackingNumber?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select("id, seller_id, payment_status")
    .eq("id", dealId)
    .single();

  if (!deal) return { ok: false, error: "deal not found" };
  if (deal.seller_id !== user.id) return { ok: false, error: "not the seller" };
  if (deal.payment_status !== "funded") {
    return { ok: false, error: `deal is ${deal.payment_status}, not funded` };
  }

  const autoReleaseAt = new Date(
    Date.now() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await admin
    .from("deals")
    .update({
      payment_status: "shipped",
      shipped_at: new Date().toISOString(),
      auto_release_at: autoReleaseAt,
      tracking_number: trackingNumber ?? null,
    })
    .eq("id", dealId)
    .eq("payment_status", "funded");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Buyer confirms delivery → release funds to the seller. Transfers with
 * source_transaction so the platform balance timing is handled by Stripe.
 * 0% fee at launch means the seller receives the full amount.
 */
export async function confirmDelivery(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select(
      "id, buyer_id, seller_id, payment_status, amount_cents, currency, stripe_charge_id, stripe_transfer_id",
    )
    .eq("id", dealId)
    .single();

  if (!deal) return { ok: false, error: "deal not found" };
  if (deal.buyer_id !== user.id) return { ok: false, error: "not the buyer" };
  if (!["funded", "shipped"].includes(deal.payment_status)) {
    return { ok: false, error: `deal is ${deal.payment_status}` };
  }
  if (deal.stripe_transfer_id) {
    return { ok: false, error: "already released" };
  }
  if (!deal.amount_cents || !deal.stripe_charge_id) {
    return { ok: false, error: "deal missing charge details" };
  }

  const { data: seller } = await admin
    .from("profiles")
    .select("stripe_account_id, stripe_payouts_enabled")
    .eq("id", deal.seller_id)
    .single();
  if (!seller?.stripe_account_id || !seller.stripe_payouts_enabled) {
    return { ok: false, error: "seller cannot receive payout" };
  }

  const stripe = getStripe();
  const transfer = await stripe.transfers.create(
    {
      amount: sellerTransferCents(deal.amount_cents),
      currency: deal.currency,
      destination: seller.stripe_account_id,
      source_transaction: deal.stripe_charge_id,
      metadata: { deal_id: deal.id },
    },
    // Idempotency key guards against a double-click double-transfer.
    { idempotencyKey: `release_${deal.id}` },
  );

  const { error } = await admin
    .from("deals")
    .update({
      payment_status: "released",
      released_at: new Date().toISOString(),
      stripe_transfer_id: transfer.id,
    })
    .eq("id", dealId)
    .neq("payment_status", "released");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Buyer-initiated cancel before shipment → refund the charge. The
 * charge.refunded webhook flips the deal to 'refunded'.
 */
export async function requestRefund(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select("id, buyer_id, payment_status, stripe_payment_intent_id")
    .eq("id", dealId)
    .single();

  if (!deal) return { ok: false, error: "deal not found" };
  if (deal.buyer_id !== user.id) return { ok: false, error: "not the buyer" };
  if (deal.payment_status !== "funded") {
    return { ok: false, error: `only funded deals can be refunded here` };
  }
  if (!deal.stripe_payment_intent_id) {
    return { ok: false, error: "no payment to refund" };
  }

  const stripe = getStripe();
  await stripe.refunds.create(
    {
      payment_intent: deal.stripe_payment_intent_id,
      metadata: { deal_id: deal.id },
    },
    { idempotencyKey: `refund_${deal.id}` },
  );

  return { ok: true };
}
