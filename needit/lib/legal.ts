/**
 * Legal document constants.
 *
 * The five bracketed decisions in `legal-drafts-for-review.md` are resolved
 * here, in code, so the policy text and the product can never drift apart. If
 * the high-end fee threshold changes, it changes in one place and both the
 * Terms and the future /plans page follow.
 */

/** Decision 1 — governing state. Where Kyle and the LLC are. */
export const GOVERNING_STATE = "Connecticut";

/** Decision 2 — arbitration + class-action waiver included. */
export const ARBITRATION = true;

/** Decision 3 — minimum age. */
export const MINIMUM_AGE = 18;

/** Decision 4 — grace period before a closed account is anonymised. */
export const DELETION_GRACE_DAYS = 14;

/**
 * Decision 5 — the "high-end single" line, in integer cents, because money is
 * always integer cents in this codebase. At or above this price a single card
 * carries the 5% buyer finder's fee. Bulk lots and filter requests never do.
 */
export const HIGH_END_THRESHOLD_CENTS = 25_000;

export const HIGH_END_THRESHOLD_LABEL = `$${(
  HIGH_END_THRESHOLD_CENTS / 100
).toLocaleString("en-US")}`;

/**
 * The date these took effect. Update this AND the last-updated date whenever
 * the text changes materially — §16 of the Terms promises 14 days' notice of
 * material changes, and a policy page whose date never moves is evidence
 * against you, not for you.
 */
export const LEGAL_EFFECTIVE = "July 29, 2026";
export const LEGAL_UPDATED = "July 29, 2026";

/**
 * ⚠️ THE ONE-LINE SWITCH.
 *
 * `false` = the pages exist and render, but nothing links to them: no footer
 * Legal column, no sitemap weight in practice, no signup link. This is Kyle's
 * "show me before publication" hold from Jul 29.
 *
 * Flip to `true` after he has read all four pages end to end. Nothing else
 * needs to change — the footer, the signup screen and the policy cross-links
 * all read this flag.
 */
export const LEGAL_PUBLISHED = false;

/**
 * ⚠️ REQUIRED BEFORE PUBLISHING. §17 of the Terms names a postal address for
 * the entity, and a marketplace ToS with no address is a weak document. Set
 * this to the LLC's registered address and the contact block fills itself in.
 */
export const LEGAL_ADDRESS: string | null = null;
