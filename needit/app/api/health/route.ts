import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { errorReportingEnabled } from "@/lib/observability";
import { rateLimitBackend } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health — the uptime monitor's endpoint.
 *
 * DESIGN NOTE. A health check that only proves "Next.js is running" tells you
 * nothing you couldn't learn from the home page, and it lies during the exact
 * outage you care about: Supabase down, app up, every page 500s, monitor green.
 * So this actually queries the database.
 *
 * It queries `requests` with `head: true` and a count — no rows come back, so
 * there's no data exposure and no meaningful cost, but the query does traverse
 * PostgREST → Postgres → RLS. If any of those are broken, this goes red.
 *
 * WHAT IT DELIBERATELY DOESN'T DO. No auth check on the endpoint itself: uptime
 * monitors can't hold a session, and the response contains nothing sensitive —
 * config *shape* (is a limiter configured?) not config *values*. Never add a
 * key, a DSN, a row count or a user identifier to this payload; a health
 * endpoint is the most reliably scraped URL on any site.
 *
 * Status codes matter to the monitor: 200 healthy, 503 degraded. Anything else
 * means the runtime itself is broken, which the monitor should also catch.
 */
export async function GET() {
  const startedAt = Date.now();

  let database: "ok" | "error" = "error";
  let databaseError: string | undefined;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("requests")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) {
      databaseError = error.message;
    } else {
      database = "ok";
    }
  } catch (e) {
    databaseError = e instanceof Error ? e.message : "unknown";
  }

  const healthy = database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      time: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      site: SITE_URL,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      checks: {
        database,
        // Shape, not secrets. "memory" is a real signal to whoever reads this:
        // rate limiting is running but not distributed across instances.
        rateLimiter: rateLimitBackend,
        errorReporting: errorReportingEnabled ? "sentry" : "console",
        emailNotifications: process.env.RESEND_API_KEY ? "configured" : "off",
        payments: process.env.STRIPE_SECRET_KEY
          ? process.env.STRIPE_SECRET_KEY.startsWith("sk_live")
            ? "live"
            : "test"
          : "off",
      },
      ...(databaseError ? { error: databaseError } : {}),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
