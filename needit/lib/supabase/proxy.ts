import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

/**
 * Routes that require a signed-in user. EVERYTHING ELSE IS PUBLIC.
 *
 * This is the Jul 29 inversion (3b spec §3.2). The gate used to be an
 * allowlist: redirect everything to /auth/login unless the path was one of a
 * hand-maintained set of exemptions. That design had two costs. It made the
 * whole marketplace invisible to logged-out visitors and to search engines —
 * which is the acquisition funnel — and it silently broke every new
 * server-to-server route: the Resend webhook 307'd to the login page for weeks
 * in July, and the Stripe webhook needed its own bespoke exemption line.
 *
 * With a denylist, webhooks are public by construction (they authenticate
 * themselves — Resend by shared secret, Stripe by signature), and adding a
 * public marketing page requires no change here at all.
 *
 * ⚠️ GUARDRAIL — READ BEFORE TOUCHING THIS FILE.
 * The proxy is NEVER the only auth check. Every protected page still calls
 * getClaims()/getUser() itself, every server action re-checks the caller, and
 * RLS is the real boundary in the database. This list is a UX optimization
 * (send people to a login screen instead of an empty page). If it were the only
 * gate, inverting it would have been a security regression rather than a
 * routing change. See migration 0015 for the anon-role deny-tests that prove
 * the database holds the line on its own.
 */
const PROTECTED: RegExp[] = [
  /^\/post(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/notifications(\/|$)/,
  /^\/alerts(\/|$)/,
  /^\/completed-deals(\/|$)/,
  /^\/metrics(\/|$)/,
  /^\/deals(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/protected(\/|$)/,
  // The need itself is public; editing it is not.
  /^\/request\/[^/]+\/edit(\/|$)/,
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  //
  // Note this still runs on public routes. That is deliberate: it refreshes the
  // token so a logged-in visitor browsing the public board stays logged in, and
  // it lets the header personalize without a second round trip.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED.some((re) => re.test(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    // `next` is what makes the 3b §3.3 promise real: sign in and land back on
    // the exact thing you were trying to do, not on a generic home page.
    // Path + query only, never an absolute URL — an absolute value here would
    // turn the login page into an open redirect a phisher could aim at their
    // own domain. The login action re-validates that it starts with "/".
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
