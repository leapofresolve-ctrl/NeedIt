"use client";

import { useActionState, useState } from "react";
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
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const isPrivate = visibility === "private";

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
            <Label htmlFor="image">Reference photo (optional)</Label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
            <p className="text-xs text-muted-foreground">
              Show the exact card or parallel you want. JPG/PNG, up to 8MB.
            </p>
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
            <Label>Visibility</Label>
            <input type="hidden" name="visibility" value={visibility} />
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="visibility_choice"
                  value="public"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Post to the board now</span>
                  <span className="block text-muted-foreground">
                    Sellers see it and can send offers right away.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="visibility_choice"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Save as a private want</span>
                  <span className="block text-muted-foreground">
                    Only you can see it. Post it to the board later when
                    you&apos;re ready — the timer starts then.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {!isPrivate && (
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
          )}

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : isPrivate
                ? "Save private want"
                : "Post Need"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
