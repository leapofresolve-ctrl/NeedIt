/**
 * Stripe / marketplace constants. Safe to import from server or client
 * (no secrets here).
 */

// Platform take rate. 0 bps = 0% during the launch/free period. When we
// monetize the high-end lane we release LESS than the charge by this many basis
// points (500 = 5%). Bulk monetization is a separate subscription, not a
// per-transaction fee. Never use application_fee_amount — it is incompatible
// with separate charges & transfers.
export const PLATFORM_FEE_BPS = 0;

// Auto-release window: funds release to the seller this many days after the
// seller marks a deal shipped, unless the buyer confirms sooner or opens a
// dispute. (§9 lean = 3.)
export const AUTO_RELEASE_DAYS = 3;

export const CURRENCY = "usd";

/** Amount transferred to the seller on release, given the funded charge amount. */
export function sellerTransferCents(amountCents: number): number {
  const fee = Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
  return amountCents - fee;
}
