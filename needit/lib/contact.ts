/**
 * Every member-facing contact route, in one place.
 *
 * ✅ STATUS (Jul 29, 2026): LIVE. Google Workspace is up on the root domain and
 * `support@exprifi.com` receives mail. Resend continues to handle outbound
 * notification email on `send.exprifi.com`; the two coexist because their MX
 * records sit on different hosts. The historical note below is kept because it
 * explains *why* this file exists at all, and because the same trap is waiting
 * for anyone who adds a second address later.
 *
 * ── HISTORICAL (Jul 27, 2026) ───────────────────────────────────────────────
 * `support@exprifi.com` DOES NOT RECEIVE MAIL YET.
 *
 * Resend is verified on the `send.exprifi.com` subdomain, which handles
 * OUTBOUND notification email only — it has no inbox. Namecheap's free
 * forwarding stopped working when the domain moved to Custom MX for Resend, so
 * right now nothing is listening on the root domain at all.
 *
 * The fix is Google Workspace (~$8.40/mo for one seat, kyle@exprifi.com, with
 * support@ as a free alias — aliases don't count as users). Workspace MX goes
 * on the root domain and coexists with Resend on `send.`.
 *
 * Until that's done, mail to this address bounces. This matters beyond a dead
 * link: the Terms and Privacy Policy name it as the route for reporting
 * counterfeits, reporting members, and exercising privacy rights. A written
 * commitment to an address that doesn't exist is worse than no address.
 *
 * WHEN THE MAILBOX IS LIVE: send a test message to it, confirm it arrives, and
 * delete this notice. Nothing else needs to change.
 */
export const SUPPORT_EMAIL = "support@exprifi.com";

/** True once someone has confirmed a test email actually lands. Flip it then. */
export const SUPPORT_INBOX_LIVE = true;

export const supportMailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

/** Legal entity — used in the footer and on policy pages. */
export const LEGAL_ENTITY = "VoloksVault Sports Card LLC";
