"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

/**
 * Sign in with EITHER a username or an email address.
 *
 * Runs on the server rather than in the browser because resolving a username
 * to an email requires the service-role client — see migration 0013 for why
 * that resolver must never be reachable from the client.
 *
 * Security properties this function is responsible for:
 *
 *  * UNIFORM FAILURE. Unknown username, unknown email and wrong password all
 *    return the exact same string. Any difference is an oracle that tells an
 *    attacker which accounts exist.
 *
 *  * UNIFORM TIMING. If the username doesn't resolve we still spend a real
 *    password verification before answering, otherwise "fast = no such user"
 *    leaks the same information the identical message was hiding.
 *
 *  * RATE LIMITING. Wired Jul 29, alongside public browsing. Two independent
 *    limits: per IP (one source spraying many identifiers = credential
 *    stuffing) and per identifier (many sources hammering one known account).
 *    Either alone is easy to walk around. See lib/rate-limit.ts — it runs on
 *    Upstash when configured and an in-process fallback when not.
 *
 *  * SAFE RETURN. `next` comes from the proxy's redirect and lands the user on
 *    the exact page they were trying to reach. It is validated here, not
 *    trusted: a value that isn't a same-site path is discarded, because an
 *    unchecked redirect target on a login page is a phishing primitive.
 */

const GENERIC_FAILURE =
  "That username/email and password don't match. Check both and try again.";

const RATE_LIMITED =
  "Too many sign-in attempts. Wait a minute and try again.";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * `safeNext` now lives in lib/safe-next.ts — same rules, shared with
 * /auth/confirm and /auth/callback so the three auth entry points can't drift
 * into three different opinions about what a safe redirect is.
 */

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier =
    typeof formData.get("identifier") === "string"
      ? (formData.get("identifier") as string).trim()
      : "";
  const password = formData.get("password");

  const next = safeNext(formData.get("next"));

  if (!identifier || typeof password !== "string" || !password) {
    return { error: GENERIC_FAILURE };
  }

  // Two limits, checked before any database work so a flood costs us nothing.
  // Lowercased identifier key: "VoloksVault" and "voloksvault" are the same
  // target and must share a budget.
  const ip = clientIp(await headers());
  const [byIp, byIdentifier] = await Promise.all([
    rateLimit(`login:ip:${ip}`, LIMITS.loginPerIp),
    rateLimit(`login:id:${identifier.toLowerCase()}`, LIMITS.loginPerIdentifier),
  ]);
  if (!byIp.ok || !byIdentifier.ok) {
    // Distinct from GENERIC_FAILURE on purpose. It reveals nothing about
    // whether the account exists — only that *this caller* is going too fast —
    // and telling a real person who fat-fingered their password five times
    // that they're throttled is far kinder than a sixth "wrong password".
    return { error: RATE_LIMITED };
  }

  let email: string | null = null;

  if (looksLikeEmail(identifier)) {
    email = identifier;
  } else {
    try {
      const admin = createAdminClient();
      const { data } = await admin.rpc("resolve_login_email", {
        identifier,
      });
      email = typeof data === "string" && data.length ? data : null;
    } catch {
      email = null;
    }
  }

  const supabase = await createClient();

  if (!email) {
    // Burn a comparable amount of time on a throwaway address so an unknown
    // username can't be identified by how quickly we say no.
    await supabase.auth.signInWithPassword({
      email: "no-such-account@exprifi.invalid",
      password,
    });
    return { error: GENERIC_FAILURE };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: GENERIC_FAILURE };

  redirect(next);
}
