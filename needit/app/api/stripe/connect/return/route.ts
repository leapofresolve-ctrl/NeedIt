import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Return/refresh target for hosted onboarding. Re-fetches the account, syncs
 * stripe_payouts_enabled, then bounces the seller back into the app. The
 * account.updated webhook is the source of truth; this just gives instant
 * feedback when the seller lands back from Stripe.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/auth/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_account_id) {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    // "Ready" = can RECEIVE transfers. That's all the buyer needs to fund a
    // held deal; the seller can add a payout bank before funds are released.
    const payoutsEnabled = account.capabilities?.transfers === "active";
    await supabase
      .from("profiles")
      .update({ stripe_payouts_enabled: payoutsEnabled })
      .eq("id", user.id);
  }

  return NextResponse.redirect(`${SITE_URL}/settings?stripe=onboarding_done`);
}
