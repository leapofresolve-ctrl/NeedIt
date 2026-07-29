/**
 * Rate limiting — fixed-window counters, Upstash Redis when configured,
 * in-process memory when it isn't.
 *
 * WHY THIS SHIPS WITH PUBLIC BROWSING AND NOT AFTER IT
 * ----------------------------------------------------
 * Until Jul 29 every route in this app sat behind a login redirect, so the only
 * unauthenticated surface was the auth endpoints themselves. Inverting the gate
 * (see lib/supabase/proxy.ts) exposes the board, every need page and every
 * profile to anonymous traffic. That is the whole point — but it also means the
 * first bad actor with a script gets free rein over sign-in attempts and page
 * reads. Opening the doors and adding the lock later is how you end up reading
 * about your own database on a forum.
 *
 * WHY NO @upstash/ratelimit DEPENDENCY
 * ------------------------------------
 * Upstash's REST API is two HTTP calls (INCR, EXPIRE) and we need exactly one
 * algorithm. Pulling a package for that would add a dependency to audit, a
 * bundle to ship, and a version to keep current, in exchange for code that is
 * shorter than this comment. If we later need sliding windows or leaky buckets,
 * revisit — those are genuinely worth a library.
 *
 * WHY THE MEMORY FALLBACK IS HONEST ABOUT BEING WEAK
 * --------------------------------------------------
 * On Vercel each serverless instance has its own memory, so an attacker
 * spraying requests can land on different instances and get a fresh budget on
 * each. The fallback still stops the naive case (one script, one loop, one warm
 * instance) and it means the limiter is *live and exercised in production code
 * paths* from day one rather than being a switch nobody has ever flipped. The
 * returned `backend` field says which mode is running so /api/health can report
 * it and nobody mistakes the fallback for real protection.
 *
 * TO UPGRADE: create an Upstash Redis database, set UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN in Vercel (server-only — never NEXT_PUBLIC_), and
 * redeploy. No code change.
 */

export type RateLimitResult = {
  ok: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Seconds until the window resets. */
  resetSeconds: number;
  backend: "upstash" | "memory";
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const rateLimitBackend: RateLimitResult["backend"] =
  UPSTASH_URL && UPSTASH_TOKEN ? "upstash" : "memory";

/** Named limits, in one place so they're reviewable as a policy, not scattered. */
export const LIMITS = {
  /** Per IP. Credential stuffing sprays many identifiers from one source. */
  loginPerIp: { limit: 10, windowSeconds: 60 },
  /** Per identifier. Slows a targeted guess at one known account. */
  loginPerIdentifier: { limit: 5, windowSeconds: 60 },
  /** Signup — the spam-account brake. */
  signupPerIp: { limit: 5, windowSeconds: 3600 },
  /** Password reset — also an account-enumeration probe if left open. */
  passwordResetPerIp: { limit: 5, windowSeconds: 3600 },
  /** Writes. Generous: a real breaker posting a buy-list is bursty by nature. */
  postNeedPerUser: { limit: 20, windowSeconds: 3600 },
  offerPerUser: { limit: 60, windowSeconds: 3600 },
  /** Anonymous reads, so a scraper can't mirror the board in a minute. */
  publicReadPerIp: { limit: 240, windowSeconds: 60 },
} as const;

// ── In-memory fallback ──────────────────────────────────────────────────────
type Bucket = { count: number; expiresAt: number };
const memory = new Map<string, Bucket>();

function memoryHit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const existing = memory.get(key);

  if (!existing || existing.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { count: 1, resetSeconds: windowSeconds };
  }

  existing.count += 1;

  // Opportunistic sweep. Without this the map grows for the life of the
  // instance — a slow memory leak that only shows up under real traffic.
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k);
  }

  return {
    count: existing.count,
    resetSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
  };
}

// ── Upstash ─────────────────────────────────────────────────────────────────
async function upstashPipeline(commands: string[][]): Promise<unknown[]> {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const json = (await res.json()) as { result: unknown; error?: string }[];
  return json.map((r) => r.result);
}

/**
 * Consume one unit against `key`.
 *
 * FAILS OPEN. If Upstash is unreachable we allow the request rather than
 * locking every user out of sign-in because a third-party cache had a bad
 * minute. That's the correct trade for a marketplace at this stage: the
 * limiter is a brake on abuse, not an authorization boundary — RLS is. Revisit
 * if we ever put something genuinely expensive behind a limit.
 */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  if (rateLimitBackend === "upstash") {
    try {
      const redisKey = `rl:${key}`;
      const [countRaw, ttlRaw] = await upstashPipeline([
        ["INCR", redisKey],
        ["TTL", redisKey],
      ]);
      const count = Number(countRaw);
      let ttl = Number(ttlRaw);

      // TTL of -1 means the key exists with no expiry: this is the first hit of
      // the window (INCR created it). Set the window now.
      if (!Number.isFinite(ttl) || ttl < 0) {
        await upstashPipeline([["EXPIRE", redisKey, String(windowSeconds)]]);
        ttl = windowSeconds;
      }

      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        resetSeconds: ttl,
        backend: "upstash",
      };
    } catch {
      return {
        ok: true,
        remaining: limit,
        resetSeconds: windowSeconds,
        backend: "upstash",
      };
    }
  }

  const { count, resetSeconds } = memoryHit(key, limit, windowSeconds);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetSeconds,
    backend: "memory",
  };
}

/**
 * Best-effort client IP.
 *
 * On Vercel `x-forwarded-for` is set by the edge and its LEFT-most entry is the
 * real client. Reading the right-most (a common copy-paste) gives you Vercel's
 * own proxy, which buckets every visitor together and makes the limiter useless.
 * Header values are attacker-controlled in general, so this is a heuristic for
 * abuse control only and must never be used for authorization.
 */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
