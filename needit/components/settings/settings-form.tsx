"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";

const initialState: SettingsState = {};

export function SettingsForm({
  emailDefault,
}: {
  emailDefault: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateSettings,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="email_notifications"
          defaultChecked={emailDefault}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="font-medium">Email me about activity</span>
          <span className="block text-sm text-muted-foreground">
            Get an email when you receive an offer, a counter is waiting on you,
            or a deal is matched. In-app notifications stay on either way.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.saved && (
          <span className="text-sm text-green-600">Saved ✓</span>
        )}
        {state.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  );
}
