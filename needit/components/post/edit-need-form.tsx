"use client";

/**
 * Edit a private want.
 *
 * This is deliberately the same control set as the post form, in the same
 * order. It is not a nicety: the two forms write the same row, so any field
 * the post form sets and this one omits gets BLANKED the first time a buyer
 * edits — they'd pick three tags, fix a typo in the title, and silently lose
 * the tags. Parity is the feature.
 *
 * If you add a field to post-need-form.tsx, add it here in the same commit.
 */

import { useActionState, useState } from "react";
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
import {
  ChipCheckboxGroup,
  ChipRadioGroup,
  ChipSegmentedGroup,
} from "@/components/ui/chip-group";
import { PhotoPicker } from "@/components/post/photo-picker";
import { SPORTS } from "@/lib/board-filters";
import {
  CONDITIONS,
  GRADE_FLOORS,
  MAX_TAGS,
  NEED_TAGS,
} from "@/lib/need-tags";

const initialState: EditNeedState = {};

const SPORT_OPTIONS = [
  { value: "", label: "Any" },
  ...SPORTS.map((s) => ({ value: s, label: s })),
];

const TYPE_OPTIONS = [
  { value: "single", label: "Single card" },
  { value: "bulk", label: "Bulk lot" },
];

const TAG_OPTIONS = NEED_TAGS.map((t) => ({ value: t.slug, label: t.label }));
const GRADE_OPTIONS = GRADE_FLOORS.map((g) => ({ value: g, label: g }));

export type EditNeedInitial = {
  id: string;
  title: string;
  description: string | null;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  price_mode: string | null;
  condition_pref: string | null;
  grade_min: string | null;
  tags: string[] | null;
  image_url: string | null;
};

export function EditNeedForm({ need }: { need: EditNeedInitial }) {
  const action = updateNeed.bind(null, need.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [type, setType] = useState(need.type === "bulk" ? "bulk" : "single");
  const [sport, setSport] = useState(need.sport ?? "");
  const [priceMode, setPriceMode] = useState<"max" | "comp">(
    need.price_mode === "comp" ? "comp" : "max",
  );
  const [condition, setCondition] = useState(need.condition_pref ?? "");
  const [gradeMin, setGradeMin] = useState(need.grade_min ?? "");
  const [tags, setTags] = useState<string[]>(need.tags ?? []);

  const isComp = priceMode === "comp";
  const budgetDefault =
    need.budget_cents != null ? (need.budget_cents / 100).toString() : "";

  const changeCondition = (next: string) => {
    setCondition(next);
    if (next !== "graded") setGradeMin("");
  };

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
        <form action={formAction} className="flex flex-col gap-6">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="sport" value={sport} />
          <input type="hidden" name="price_mode" value={priceMode} />
          <input type="hidden" name="condition_pref" value={condition} />
          <input type="hidden" name="grade_min" value={gradeMin} />
          {tags.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

          <div className="grid gap-2">
            <Label
              htmlFor="title"
              className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground"
            >
              What are you after
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={need.title}
              required
              maxLength={120}
              className="min-h-11 text-base"
            />
          </div>

          <PhotoPicker
            existingUrl={need.image_url}
            hint={
              need.image_url
                ? "Attach a new photo to replace the current one, or leave it as is."
                : "Show the exact card or parallel you want. Large photos are resized automatically."
            }
          />

          <ChipSegmentedGroup
            legend="Kind"
            name="type_choice"
            options={TYPE_OPTIONS}
            value={type}
            onValueChange={setType}
          />

          <ChipRadioGroup
            legend="Sport"
            name="sport_choice"
            options={SPORT_OPTIONS}
            value={sport}
            onValueChange={setSport}
          />

          <fieldset>
            <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              What you&apos;ll pay
            </legend>
            <div className="flex items-stretch gap-2">
              <div
                className={`flex flex-1 items-center rounded-sm border px-3 transition-colors duration-150 ${
                  isComp ? "border-input opacity-45" : "border-input bg-card"
                }`}
              >
                <span className="num text-base text-muted-foreground" aria-hidden>
                  $
                </span>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  disabled={isComp}
                  defaultValue={budgetDefault}
                  placeholder="140"
                  aria-label="Maximum you'll pay, in dollars"
                  className="num min-h-11 w-full bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                aria-pressed={isComp}
                onClick={() => setPriceMode(isComp ? "max" : "comp")}
                className={`flex min-h-11 items-center rounded-sm border px-4 text-sm transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isComp
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-input bg-card hover:border-foreground"
                }`}
              >
                Comp
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              {isComp
                ? "Your row will read AT COMP — sellers name the price and you accept or counter."
                : "Optional. Sellers can't see your ceiling until they've made an offer."}
            </p>
          </fieldset>

          <div className="flex flex-col gap-4">
            <ChipSegmentedGroup
              legend="Condition"
              name="condition_choice"
              options={[...CONDITIONS]}
              value={condition}
              onValueChange={changeCondition}
            />
            {condition === "graded" && (
              <ChipRadioGroup
                legend="Lowest grade you'll take"
                name="grade_choice"
                options={GRADE_OPTIONS}
                value={gradeMin}
                onValueChange={setGradeMin}
              />
            )}
          </div>

          <ChipCheckboxGroup
            legend="Tags"
            note={`— up to ${MAX_TAGS}, shown on the board`}
            name="tags_choice"
            options={TAG_OPTIONS}
            values={tags}
            onValuesChange={setTags}
            max={MAX_TAGS}
          />

          <details className="border-t pt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-primary marker:content-none">
              Add detail
              <span className="ml-2 font-normal text-muted-foreground">
                Description
              </span>
            </summary>
            <div className="mt-4 grid gap-2">
              <Label
                htmlFor="description"
                className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground"
              >
                Details
              </Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={need.description ?? ""}
                className="flex w-full rounded-sm border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </details>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="min-h-12 text-base">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
