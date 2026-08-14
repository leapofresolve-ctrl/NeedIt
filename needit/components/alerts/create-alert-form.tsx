"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAlert, type AlertState } from "@/app/alerts/actions";

import { TYPES } from "@/lib/board-filters";
const SPORTS = [
  "Basketball",
  "Football",
  "Baseball",
  "Hockey",
  "Soccer",
  "Pokémon",
  "Other",
];

const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const initialState: AlertState = {};

export function CreateAlertForm({
  remaining,
  limit,
}: {
  remaining: number;
  limit: number;
}) {
  const [state, formAction, pending] = useActionState(
    createAlert,
    initialState,
  );

  // At the cap the form is replaced rather than disabled — a form you can fill
  // in but not submit is worse than no form.
  if (remaining <= 0) {
    return (
      <div className="border rounded-lg p-4 flex flex-col gap-2">
        <h2 className="font-semibold">
          You&apos;re using all {limit} of your alerts
        </h2>
        <p className="text-sm text-muted-foreground">
          Free accounts keep up to {limit}. Delete one below to make room for a
          new one.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border rounded-lg p-4 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">New alert</h2>
        <p className="text-xs text-muted-foreground">
          Describe what you&apos;re sitting on. Every field is optional — set at
          least one. {remaining} of {limit} slots left.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="keyword">Keyword</Label>
          <input
            id="keyword"
            name="keyword"
            placeholder="e.g. Jordan, rookie, PSA 10"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sport">Sport / category</Label>
          <select id="sport" name="sport" className={fieldClass}>
            <option value="">Any</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Need type</Label>
          <select id="type" name="type" className={fieldClass}>
            <option value="">Any</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="min">Budget $ min</Label>
            <input id="min" name="min" type="number" min="0" className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="max">Budget $ max</Label>
            <input id="max" name="max" type="number" min="0" className={fieldClass} />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive-foreground bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save alert"}
      </Button>
    </form>
  );
}
