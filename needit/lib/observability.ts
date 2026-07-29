/**
 * Error reporting — Sentry-compatible, zero dependencies.
 *
 * WHY NOT @sentry/nextjs. The official SDK is excellent and also large: it adds
 * a build plugin, source-map upload, two instrumentation files, a client bundle
 * and a meaningful surface of configuration. What Exprifi needs today is one
 * thing — "tell me when a server action throws in production, with a stack" —
 * and Sentry's store endpoint accepts a plain JSON POST. This is roughly sixty
 * lines against a dependency that would need auditing and upgrading for the
 * next eight weeks. When we want performance tracing, session replay or
 * client-side breadcrumbs, swap this for the real SDK; the call sites won't
 * change because they only ever call captureError().
 *
 * DORMANT UNTIL CONFIGURED. With no SENTRY_DSN set, captureError logs to the
 * server console (which Vercel already collects) and returns. Nothing throws,
 * nothing blocks. Set SENTRY_DSN in Vercel and it starts reporting on the next
 * deploy with no code change.
 *
 * NEVER NEXT_PUBLIC_. A DSN in a public var is a public write endpoint into
 * your issue stream. Server-side only.
 */

const DSN = process.env.SENTRY_DSN;
const ENVIRONMENT =
  process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12);

type Parsed = { host: string; projectId: string; publicKey: string };

/** DSN format: https://<publicKey>@<host>/<projectId> */
function parseDsn(dsn: string): Parsed | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "");
    if (!u.username || !projectId) return null;
    return { host: u.host, projectId, publicKey: u.username };
  } catch {
    return null;
  }
}

const parsed = DSN ? parseDsn(DSN) : null;

export const errorReportingEnabled = Boolean(parsed);

/**
 * Report an error. Never throws, never rejects — a monitoring failure must not
 * become a second incident on top of the one being reported.
 */
export async function captureError(
  error: unknown,
  context: Record<string, string | number | boolean | null | undefined> = {},
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  if (!parsed) {
    // Vercel captures console output, so this is still a usable trail — it just
    // isn't alertable. Prefixed so it's greppable in the log drain.
    console.error("[exprifi:error]", err.message, {
      ...context,
      stack: err.stack,
    });
    return;
  }

  try {
    const body = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: new Date().toISOString(),
      platform: "node",
      level: "error",
      environment: ENVIRONMENT,
      release: RELEASE,
      logger: "exprifi",
      exception: {
        values: [
          {
            type: err.name,
            value: err.message,
            stacktrace: { frames: parseStack(err.stack) },
          },
        ],
      },
      tags: { environment: ENVIRONMENT },
      extra: context,
    };

    await fetch(
      `https://${parsed.host}/api/${parsed.projectId}/store/?sentry_key=${parsed.publicKey}&sentry_version=7`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        // Don't hold a user's response open waiting on a monitoring service.
        signal: AbortSignal.timeout(2000),
      },
    );
  } catch {
    console.error("[exprifi:error]", err.message, context);
  }
}

/** Sentry wants frames oldest-first; Node stacks are newest-first. */
function parseStack(stack?: string) {
  if (!stack) return [];
  return stack
    .split("\n")
    .slice(1)
    .map((line) => {
      const m = line.match(/at (?:(.+?) )?\(?(.+?):(\d+):(\d+)\)?$/);
      if (!m) return null;
      return {
        function: m[1] || "?",
        filename: m[2],
        lineno: Number(m[3]),
        colno: Number(m[4]),
      };
    })
    .filter(Boolean)
    .reverse();
}
