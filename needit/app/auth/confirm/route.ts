import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Email link verification via token_hash (the non-PKCE path).
 *
 * The Supabase email templates point here with `token_hash` + `type`, and
 * verifyOtp() establishes the session server-side. Two reasons this is the
 * pattern we want for email links rather than PKCE:
 *
 *  1. It is browser-independent. PKCE keeps its code verifier in the browser
 *     that started the flow, so a member who requests a reset on their laptop
 *     and taps the link in their phone's mail app gets a dead link. Email is
 *     precisely where cross-device is the normal case, not the edge case.
 *  2. The link stays on exprifi.com instead of routing through
 *     <project>.supabase.co, on the one screen where members are most alert to
 *     anything resembling phishing.
 *
 * `next` is validated (see lib/safe-next) because it arrives from an email and
 * is therefore attacker-controlled. Recovery defaults to /auth/update-password
 * so the template can omit it and still land correctly.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const fallback = type === "recovery" ? "/auth/update-password" : "/";
  const next = safeNext(searchParams.get("next"), fallback);

  if (!token_hash || !type) {
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "That link is incomplete. Request a new email and open the most recent link.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    // Raw SDK strings ("Token has expired or is invalid") read as a system
    // fault. Name the actual cause and the way out.
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "That link has expired or was already used. Request a new one — these links are single-use.",
      )}`,
    );
  }

  redirect(next);
}
