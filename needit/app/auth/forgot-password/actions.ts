"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

export type ForgotPasswordState = { error?: string; sent?: boolean };

const GENERIC_SENT =
  "If that address has an Exprifi account, a reset link is on its way.";

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * Why this is a server action with flowType "implicit", and not the one-line
 * browser call it replaced.
 *
 * The browser client runs the PKCE flow. When resetPasswordForEmail() is called
 * from it, GoTrue mints a PKCE-style token and `{{ .TokenHash }}` in the email
 * template comes out prefixed `pkce_…`. Server-side verifyOtp() rejects that
 * prefix outright — the symptom is a reset link that lands on "expired or
 * already used" on the very first click. Verified live on Jul 29, 2026.
 *
 * PKCE is also the wrong flow for email in the first place: it stores its code
 * verifier in the browser that started the flow, so requesting a reset on a
 * laptop and tapping the link in a phone's mail app can never work. For email,
 * cross-device is the normal case.
 *
 * Requesting in implicit mode produces a plain token hash, which verifyOtp()
 * accepts from any device. No `redirectTo` is passed: the destination lives in
 * the email template (`…/auth/confirm?…&next=/auth/update-password`), so there
 * is one place to change it rather than two that can disagree.
 */
async function createImplicitFlowClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { flowType: "implicit" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — the proxy refreshes sessions.
          }
        },
      },
    },
  );
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();

  if (!email || !looksLikeEmail(email)) {
    return { error: "Enter the email address you signed up with." };
  }

  // Per-IP only. A per-address limit would leak which addresses exist, since
  // the attacker controls how often they probe each one.
  const ip = clientIp(await headers());
  const limit = await rateLimit(
    `pwreset:ip:${ip}`,
    LIMITS.passwordResetPerIp,
  );
  if (!limit.ok) {
    return {
      error: "Too many reset requests. Wait a few minutes and try again.",
    };
  }

  const supabase = await createImplicitFlowClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    // Never surface this to the caller: "user not found" would turn the form
    // into an account-enumeration oracle. Log it and report the same thing we
    // report on success.
    console.error("resetPasswordForEmail failed", error.message);
  }

  return { sent: true };
}

export { GENERIC_SENT };
