/**
 * The one place that knows what Exprifi's address is.
 *
 * WHY THIS FILE EXISTS: before the Jul 29 domain cutover, `app/layout.tsx`
 * derived `metadataBase` from `process.env.VERCEL_URL`. On Vercel that variable
 * is the *deployment-specific* hostname (`need-muz69103c-…​.vercel.app`), not
 * the domain people type. The visible symptom was that every OG and Twitter
 * image tag on exprifi.com pointed at a preview URL — so a shared need rendered
 * a broken card on iMessage, Discord and X, and search engines saw two hosts
 * serving identical content.
 *
 * The rule now: canonical origin is a constant, overridable only by an explicit
 * env var. Never infer the public address from the deployment.
 */

/** Canonical public origin. No trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://exprifi.com"
).replace(/\/$/, "");

export const SITE_HOST = new URL(SITE_URL).host;

/** Absolute URL for a path — use for canonical tags, OG, sitemap, emails. */
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The legacy host. Kept as a constant because two things reference it: the
 * permanent redirect in `next.config.ts`, and the robots rules. Every link
 * Kyle has ever posted publicly points here, so the 301 is load-bearing for
 * both SEO and for anyone who bookmarked the app during the build.
 */
export const LEGACY_HOST = "need-it.vercel.app";
