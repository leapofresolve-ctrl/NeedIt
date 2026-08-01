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

/*
 * `LEGACY_HOST` ("need-it.vercel.app") was removed Aug 1, 2026.
 *
 * Its docstring said two things referenced it — the 301 in `next.config.ts`
 * and the robots rules. By the time it was removed, neither did: robots had
 * already moved to SITE_HOST, and the redirect was unreachable because the
 * host is no longer attached to the Vercel project. The constant was the last
 * thing in the codebase asserting that the legacy domain still mattered.
 *
 * Kyle's call, Aug 1: that host is done. Anything still pointing at it 404s.
 */
