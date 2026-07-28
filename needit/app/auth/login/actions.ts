"use server";

import { redirect } from "next/navigation";

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
 *  * RATE LIMITING. Not yet wired — Upstash is on Kyle's setup list. Until it
 *    lands, Supabase's own auth rate limits are the only brake, which is thin
 *    for credential stuffing. See TODO below; this must not ship to a public,
 *    unauthenticated site without it.
 */

const GENERIC_FAILURE =
  "That username/email and password don't match. Check both and try again.";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier =
    typeof formData.get("identifier") === "string"
      ? (formData.get("identifier") as string).trim()
      : "";
  const password = formData.get("password");

  if (!identifier || typeof password !== "string" || !password) {
    return { error: GENERIC_FAILURE };
  }

  // TODO(rate-limit): per-IP (10/min) and per-identifier (5/min) via Upstash,
  // before public browsing opens. Log repeated failures to the flag queue —
  // one IP failing fifty identifiers is a credential-stuffing run, and that's
  // exactly what the Leak Patrol agent should be reading.

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

  redirect("/");
}
