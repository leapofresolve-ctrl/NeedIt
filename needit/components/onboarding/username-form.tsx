"use client";

import { useActionState } from "react";
import { setUsername, type UsernameState } from "@/app/onboarding/actions";
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

const initialState: UsernameState = {};

export function UsernameForm() {
  const [state, formAction, pending] = useActionState(
    setUsername,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Exprifi</CardTitle>
        <CardDescription>
          Pick a username so other members know who they&apos;re dealing with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="e.g. cardhunter23"
              autoFocus
              required
              minLength={3}
              maxLength={20}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              3–20 characters. Letters, numbers, and underscores only.
            </p>
          </div>
          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
