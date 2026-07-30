/**
 * Validate a post-auth redirect target.
 *
 * Every auth entry point (sign-in, email confirmation, password recovery)
 * accepts a `next` hint so the member lands back on the thing they were trying
 * to do. That hint arrives from a form field or a query string, which means it
 * arrives from anywhere — including an email a phisher wrote. An absolute value
 * here turns our own auth screens into an open redirect pointed at their
 * domain, which is exactly the trust we can least afford to leak.
 *
 * Path-only, and only paths that can't be read as an origin:
 *  - must start with "/"
 *  - reject "//evil.com" (protocol-relative — browsers treat it as absolute)
 *  - reject backslashes, which some browsers normalise to "/"
 *
 * Extracted from app/auth/login/actions.ts so sign-in, /auth/confirm and
 * /auth/callback can't drift apart. Adding a fourth entry point means importing
 * this, not writing a fourth version of it.
 */
export function safeNext(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/",
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
