import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe client. NEVER import this into a client component.
 * The secret key lives in STRIPE_SECRET_KEY (test key sk_test_... for now) and
 * is never exposed to the browser and never placed in a NEXT_PUBLIC_* var.
 *
 * apiVersion is intentionally left unpinned so it tracks the SDK default and
 * the account's configured version; pin it explicitly once you've chosen one.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your test secret key to .env.local.",
    );
  }
  cached = new Stripe(key, { typescript: true });
  return cached;
}
