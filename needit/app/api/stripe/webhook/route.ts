import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe webhook. Verifies the signature (this IS the timing-safe check the
 * security plan requires — replaces any shared-secret compare), dedupes on the
 * event id, then advances deal state. Writes use the service-role client
 * because the request isn't tied to a logged-in user.
 *
 * Local dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
 * and put the printed `whsec_...` into STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("STRIPE_WEBHOOK_SECRET not set", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const stripe = getStripe();
  const body = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return new Response(`signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  const admin = createAdminClient();

  // Idempotency: record the event id first; a duplicate delivery is a no-op.
  const { error: dupErr } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (dupErr) {
    // Primary-key conflict => already processed. Ack so Stripe stops retrying.
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const dealId = session.metadata?.deal_id;
        if (dealId && session.payment_status === "paid") {
          // Resolve the underlying charge id for the eventual release transfer.
          let chargeId: string | null = null;
          const piId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;
          if (piId) {
            const pi = await stripe.paymentIntents.retrieve(piId);
            chargeId =
              typeof pi.latest_charge === "string"
                ? pi.latest_charge
                : pi.latest_charge?.id ?? null;
          }
          await admin
            .from("deals")
            .update({
              payment_status: "funded",
              funded_at: new Date().toISOString(),
              stripe_payment_intent_id: piId,
              stripe_charge_id: chargeId,
            })
            .eq("id", dealId)
            .eq("payment_status", "unfunded");
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        // "Ready" = can RECEIVE transfers (enough for a buyer to fund a held
        // deal); the payout bank can be added before funds are released.
        const payoutsEnabled = account.capabilities?.transfers === "active";
        await admin
          .from("profiles")
          .update({ stripe_payouts_enabled: payoutsEnabled })
          .eq("stripe_account_id", account.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const dealId = charge.metadata?.deal_id;
        const query = admin
          .from("deals")
          .update({
            payment_status: "refunded",
            refunded_at: new Date().toISOString(),
          });
        if (dealId) await query.eq("id", dealId);
        else await query.eq("stripe_charge_id", charge.id);
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId =
          typeof dispute.charge === "string"
            ? dispute.charge
            : dispute.charge?.id ?? null;
        if (chargeId) {
          await admin
            .from("deals")
            .update({ payment_status: "disputed" })
            .eq("stripe_charge_id", chargeId);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged and ignored.
        break;
    }
  } catch (err) {
    // Let Stripe retry on transient failures.
    const msg = err instanceof Error ? err.message : "handler error";
    // Roll back the idempotency marker so the retry can reprocess.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return new Response(`handler error: ${msg}`, { status: 500 });
  }

  return Response.json({ received: true });
}
