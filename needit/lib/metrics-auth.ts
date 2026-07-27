import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * Bearer-token gate for the /api/metrics/* routes. These endpoints are called
 * by trusted automation (the Claude Metrics + Concierge agents), not by a
 * logged-in browser session, so the auth is a shared secret in
 * METRICS_API_TOKEN (server-only — never a NEXT_PUBLIC_* var). Comparison is
 * timing-safe, matching the §5A hardening rule.
 */
export function metricsTokenOk(req: Request): boolean {
  const expected = process.env.METRICS_API_TOKEN;
  if (!expected) return false; // fail closed if the token isn't configured

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
