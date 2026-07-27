import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Seller onboarding. POST creates (or reuses) the caller's Stripe connected
 * account and returns a hosted onboarding link.
 *
 * Account shape (per the accepted integration plan):
 *   - controller.stripe_dashboard.type = 'express'  (lightweight payout view)
 *   - controller.fees.payer = 'application'          (platform owns pricing)
 *   - controller.losses.payments = 'application'     (platform owns loss liability)
 *   - capabilities.transfers only                    (recipient — receives transfers,
 *                                                      never accepts charges directly;
 *                                                      we do NOT request card_payments)
 * Using the controller object (not the legacy `type: 'express'`) keeps us on the
 * blessed, GA configuration.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();

  // Reuse an existing connected account if the seller already started onboarding.
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      country: "US",
      email: user.email ?? undefined,
      controller: {
        stripe_dashboard: { type: "express" },
        fees: { payer: "application" },
        losses: { payments: "application" },
        requirement_collection: "stripe",
      },
      capabilities: {
        transfers: { requested: true },
      },
      metadata: { supabase_user_id: user.id },
    });
    accountId = account.id;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  }

  // Hosted onboarding. On completion Stripe redirects to return_url; the
  // account.updated webhook flips stripe_payouts_enabled once transfers are live.
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE_URL}/api/stripe/connect/return`,
    return_url: `${SITE_URL}/api/stripe/connect/return`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
