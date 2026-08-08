"use client";

/**
 * Post a need — direction A: one screen, chip-first, detail folded away.
 *
 * The shape this replaced was eight stacked fields with two native <select>s
 * and native radios. 3b Part 0 named native selects "the single loudest
 * amateur signal" and the rail removed the last of them from the board; this
 * screen still had two. Now it has none.
 *
 * The rule the layout follows is the 3b one: FEWER CONTROLS AT REST. Everything
 * a buyer decides once — description, whether it's a private want — lives
 * behind "Add detail". Everything they decide every time is a tap.
 *
 * Two ideas here are load-bearing and easy to misread later:
 *
 *   COMP is a verbatim label. Tapping it means "I'm not naming a number,
 *   offer me at market" and the row reads AT COMP. Nothing looks a comp up.
 *   No pricing data is fetched, stored, or implied — see lib/need-tags.ts.
 *
 *   GRADE is a two-part control, not a tag. Condition picks raw/graded/any;
 *   picking graded reveals a floor. Tags stay for optional flavour, so a
 *   buyer never has to spend one of their three on "graded".
 */

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
import {
  ChipCheckboxGroup,
  ChipRadioGroup,
  ChipSegmentedGroup,
} from "@/components/ui/chip-group";
import { PhotoPicker } from "@/components/post/photo-picker";
import { SPORTS } from "@/lib/board-filters";
import {
  CONDITIONS,
  DEFAULT_EXPIRY,
  EXPIRIES,
  GRADE_FLOORS,
  MAX_TAGS,
  NEED_TAGS,
} from "@/lib/need-tags";

const initialState: PostNeedState = {};

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

export function PostNeedForm() {
  const [state, formAction, pending] = useActionState(createNeed, initialState);

  const [type, setType] = useState("single");
  const [sport, setSport] = useState("");
  const [priceMode, setPriceMode] = useState<"max" | "comp">("max");
  const [condition, setCondition] = useState("");
  const [gradeMin, setGradeMin] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [expiry, setExpiry] = useState(DEFAULT_EXPIRY);
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const isPrivate = visibility === "private";
  const isComp = priceMode === "comp";

  // Switching away from Graded drops the floor rather than keeping it around
  // invisibly — a raw need with a stashed grade_min would be rejected by the
  // DB constraint, and rightly so.
  const changeCondition = (next: string) => {
    setCondition(next);
    if (next !== "graded") setGradeMin("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Post a need</CardTitle>
        <CardDescription>Tell sellers what to bring you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6">
          {/* Hidden mirrors of the controlled chip state. The chip inputs are
              real form controls, but the ones inside ChipGroup carry the
              display value; these carry exactly what the action expects. */}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="sport" value={sport} />
          <input type="hidden" name="price_mode" value={priceMode} />
          <input type="hidden" name="condition_pref" value={condition} />
          <input type="hidden" name="grade_min" value={gradeMin} />
          <input type="hidden" name="expiry" value={expiry} />
          <input type="hidden" name="visibility" value={visibility} />
          {tags.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              What are you after
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="2003 Topps Chrome LeBron refractors"
              required
              maxLength={120}
              className="min-h-11 text-base"
            />
          </div>

          <PhotoPicker />

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

          {/* PRICE — a number or the word. Never both: the DB enforces it too
              (requests_comp_no_budget_chk), because a comp need with a hidden
              ceiling would be a lie told to sellers. */}
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

          {!isPrivate && (
            <ChipSegmentedGroup
              legend="Open for"
              name="expiry_choice"
              options={[...EXPIRIES]}
              value={expiry}
              onValueChange={setExpiry}
            />
          )}

          <details className="border-t pt-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-primary marker:content-none">
              Add detail
              <span className="ml-2 font-normal text-muted-foreground">
                Description · private want
              </span>
            </summary>

            <div className="mt-4 flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
                  Details
                </Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Specific players or sets, quantities, anything a seller should know before offering."
                  className="flex w-full rounded-sm border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <ChipSegmentedGroup
                legend="Where it goes"
                name="visibility_choice"
                options={[
                  { value: "public", label: "Post to the board" },
                  { value: "private", label: "Save privately" },
                ]}
                value={visibility}
                onValueChange={(v) => setVisibility(v as "public" | "private")}
              />
              <p className="-mt-3 text-xs text-muted-foreground">
                {isPrivate
                  ? "Only you can see it. Post it to the board later — the timer starts then."
                  : "Sellers see it and can send offers right away."}
              </p>
            </div>
          </details>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="min-h-12 text-base">
            {pending
              ? "Saving…"
              : isPrivate
                ? "Save private want"
                : "Post to the board"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
