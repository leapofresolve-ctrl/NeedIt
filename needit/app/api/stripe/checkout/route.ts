import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { CURRENCY } from "@/lib/stripe/config";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Buyer funds a matched deal. POST { dealId }.
 *
 * SEPARATE CHARGES AND TRANSFERS: this Checkout Session charges the PLATFORM
 * only — no transfer_data, no application_fee. Funds land on the platform
 * balance and are held until release (confirmDelivery / auto-release timer),
 * at which point a Transfer with source_transaction pays the seller.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let dealId: string | undefined;
  try {
    ({ dealId } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  // Load the deal + the accepted offer price. RLS already restricts rows to the
  // parties, but we re-check buyer identity and status explicitly.
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      "id, buyer_id, seller_id, payment_status, request_id, offers(current_price_cents, price_cents)",
    )
    .eq("id", dealId)
    .single();

  if (error || !deal) {
    return NextResponse.json({ error: "deal not found" }, { status: 404 });
  }
  if (deal.buyer_id !== user.id) {
    return NextResponse.json({ error: "not your deal" }, { status: 403 });
  }
  if (deal.payment_status !== "unfunded") {
    return NextResponse.json(
      { error: `deal is already ${deal.payment_status}` },
      { status: 409 },
    );
  }

  // Confirm the seller can actually receive a payout before taking money.
  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_payouts_enabled")
    .eq("id", deal.seller_id)
    .single();
  if (!seller?.stripe_payouts_enabled) {
    return NextResponse.json(
      { error: "seller_payouts_not_ready" },
      { status: 409 },
    );
  }

  const offer = Array.isArray(deal.offers) ? deal.offers[0] : deal.offers;
  const amountCents: number | null =
    offer?.current_price_cents ?? offer?.price_cents ?? null;
  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: "invalid deal amount" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // No transfer_data / application_fee: money stays on the platform balance.
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: amountCents, // integer cents
          product_data: { name: "Exprifi deal" },
        },
      },
    ],
    payment_intent_data: {
      metadata: { deal_id: deal.id },
    },
    metadata: { deal_id: deal.id },
    success_url: `${SITE_URL}/completed-deals?funded=${deal.id}`,
    cancel_url: `${SITE_URL}/request/${deal.request_id}?checkout=cancelled`,
  });

  // Persist the amount + session so the webhook can reconcile.
  await supabase
    .from("deals")
    .update({
      amount_cents: amountCents,
      currency: CURRENCY,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", deal.id);

  return NextResponse.json({ url: session.url });
}
