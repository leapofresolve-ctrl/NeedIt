"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  GENERIC_SENT,
  requestPasswordReset,
  type ForgotPasswordState,
} from "@/app/auth/forgot-password/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: ForgotPasswordState = {};

/**
 * Moved off the browser Supabase client to a server action — see
 * app/auth/forgot-password/actions.ts for why (short version: the browser
 * client's PKCE flow produced a token that server-side verifyOtp rejects, so
 * every reset link died on the first click).
 *
 * No `redirectTo` is sent from here any more; the email template owns the
 * destination, so there's one place to change it instead of two that can
 * disagree.
 */
export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {state.sent ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{GENERIC_SENT}</p>
            <p className="text-sm text-muted-foreground">
              The link works once and expires shortly. If it doesn&apos;t arrive
              within a few minutes, check your spam folder before requesting
              another — each new request invalidates the previous link.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="m@example.com"
                    required
                  />
                </div>
                {state.error && (
                  <p role="alert" className="text-sm text-destructive">
                    {state.error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Sending…" : "Send reset email"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
