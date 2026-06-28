"use client";

import { useActionState } from "react";
import { updateNeed, type EditNeedState } from "@/app/request/[id]/actions";
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

const initialState: EditNeedState = {};

export type EditNeedInitial = {
  id: string;
  title: string;
  description: string | null;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  condition_pref: string | null;
  image_url: string | null;
};

export function EditNeedForm({ need }: { need: EditNeedInitial }) {
  const action = updateNeed.bind(null, need.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const budgetDefault =
    need.budget_cents != null ? (need.budget_cents / 100).toString() : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Edit private want</CardTitle>
        <CardDescription>
          Tweak it as much as you like — it stays private until you post it to
          the board.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">What are you looking for?</Label>
            <Input
              id="title"
              name="title"
              defaultValue={need.title}
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
              defaultValue={need.description ?? ""}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Reference photo (optional)</Label>
            {need.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={need.image_url}
                alt="Current reference"
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
            )}
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
            <p className="text-xs text-muted-foreground">
              {need.image_url
                ? "Upload a new image to replace the current one. Leave empty to keep it."
                : "Show the exact card or parallel you want. JPG/PNG, up to 8MB."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="single"
                  defaultChecked={need.type !== "bulk"}
                />
                Single card
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="bulk"
                  defaultChecked={need.type === "bulk"}
                />
                Bulk lot
              </label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sport">Sport / category</Label>
            <select
              id="sport"
              name="sport"
              defaultValue={need.sport ?? ""}
              className={fieldClass}
            >
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
              defaultValue={budgetDefault}
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
              defaultValue={need.condition_pref ?? ""}
              placeholder="e.g. Raw, PSA 9+, any"
              maxLength={60}
            />
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
