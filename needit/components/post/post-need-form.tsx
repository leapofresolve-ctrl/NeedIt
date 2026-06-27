"use client";

import { useActionState } from "react";
import { createNeed, type PostNeedState } from "@/app/post/actions";
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

const initialState: PostNeedState = {};

export function PostNeedForm() {
  const [state, formAction, pending] = useActionState(createNeed, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Post a Need</CardTitle>
        <CardDescription>
          Tell sellers exactly what you&apos;re after.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">What are you looking for?</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. 2003 LeBron rookies, any /99 numbered"
              required
              maxLength={120}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Details (optional)</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Condition, specific players/sets, quantities…"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="single" defaultChecked />
                Single card
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="type" value="bulk" />
                Bulk lot
              </label>
            </div>
          </div>

          <div className="grid gap-2">
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

          <div className="grid gap-2">
            <Label htmlFor="budget">Max budget (USD, optional)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="condition_pref">
              Condition preference (optional)
            </Label>
            <Input
              id="condition_pref"
              name="condition_pref"
              placeholder="e.g. Raw, PSA 9+, any"
              maxLength={60}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiry">Expires in</Label>
            <select
              id="expiry"
              name="expiry"
              defaultValue="7d"
              className={fieldClass}
            >
              <option value="24h">24 hours</option>
              <option value="3d">3 days</option>
              <option value="7d">7 days</option>
            </select>
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post Need"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
