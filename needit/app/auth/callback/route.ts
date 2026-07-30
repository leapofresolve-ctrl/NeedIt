import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE code exchange.
 *
 * Why this route exists: the browser Supabase client uses the PKCE flow, so a
 * password-recovery email produces a link like
 *   <project>.supabase.co/auth/v1/verify?token=pkce_…&redirect_to=<app URL>
 * and Supabase bounces the member to `<app URL>?code=…`. That `code` is not a
 * session — something has to call exchangeCodeForSession() before the member is
 * actually signed in.
 *
 * Before this route, `redirect_to` pointed straight at /auth/update-password,
 * which is a page, not a route handler. Nothing exchanged the code, so
 * updateUser() ran with no session and every reset died on "Auth session
 * missing!". The exchange has to happen in a Route Handler (or Server Action)
 * because only those can write the auth cookies — a page render cannot.
 *
 * Kept even though the email templates now use the token_hash + /auth/confirm
 * pattern: any recovery link already sitting in an inbox still uses PKCE, and
 * OAuth providers would land here too.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  // Supabase reports failures as ?error=…&error_description=… on the redirect.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    redirect(`/auth/error?error=${encodeURIComponent(providerError)}`);
  }

  if (!code) {
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "That link is missing its sign-in code. Request a new email and use the most recent link.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Overwhelmingly this is an expired, already-used, or wrong-browser link
    // (PKCE stores its verifier in the browser that started the flow). Say that
    // in words rather than surfacing the raw SDK string.
    redirect(
      `/auth/error?error=${encodeURIComponent(
        "That link has expired or was already used. Request a new password reset email, and open the link in the same browser you requested it from.",
      )}`,
    );
  }

  redirect(next);
}
