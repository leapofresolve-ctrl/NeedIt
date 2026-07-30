import Link from "next/link";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/components/update-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate the reset form on an actual session.
 *
 * This page used to render the form unconditionally. If the member arrived
 * without a session, the failure surfaced only after they had typed a new
 * password and hit save — as the raw SDK string "Auth session missing!", which
 * tells them nothing and looks like the site is broken at the exact moment they
 * are locked out of their own account.
 *
 * Two arrival paths are handled:
 *  - `?code=…` — a PKCE link (what Supabase's default template produces, and
 *    what any already-delivered email still contains). Hand it to
 *    /auth/callback, which is a Route Handler and can therefore write the auth
 *    cookies, then come back here with a session.
 *  - no code — either a token_hash link that already ran through /auth/confirm
 *    (session present, render the form) or someone opening this URL cold
 *    (session absent, explain why and offer the way out).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(
        code,
      )}&next=${encodeURIComponent("/auth/update-password")}`,
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">This link has expired</CardTitle>
              <CardDescription>
                Password reset links are single-use and time-limited.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Request a fresh one and open the most recent email — older links
                stop working as soon as a newer one is sent.
              </p>
              <Link
                href="/auth/forgot-password"
                className="text-sm underline underline-offset-4"
              >
                Send a new reset link
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
