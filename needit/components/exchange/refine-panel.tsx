"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

import { DEFAULT_SORT, SORTS, SPORTS, TYPES } from "@/lib/board-filters";
import { CONDITIONS, conditionChip } from "@/lib/need-tags";
import { Button } from "@/components/ui/button";
import {
  ChipCheckboxGroup,
  ChipSegmentedGroup,
  type ChipOption,
} from "@/components/ui/chip-group";

/**
 * 3b: replaces the inline six-select filter bar.
 *
 * The old row (Type / Sport / Condition / $min / $max / Sort + Apply) was the
 * single loudest "eBay/Craigslist" signal on the page, and the most moving
 * parts on screen — the thing the older-collector audience bounces off. This
 * collapses all of it behind ONE control; active filters render as removable
 * chips next to it, so the resting state is two controls instead of seven.
 *
 * Deliberately dependency-free: the app has no dialog/sheet primitive
 * installed, and adding one would mean an npm install in Kyle's workflow.
 * Plain state + fixed positioning does the job.
 *
 * Still a GET form posting to "/" — the searchParams contract on the board is
 * completely unchanged, so this is presentation only.
 *
 * ── Aug 8: parity with the rail ────────────────────────────────────────────
 * Two defects closed here, both of which only existed below 1024px, which is
 * where the beachhead actually is.
 *
 * 1. THE SHEET DESTROYED MULTI-SELECT. It rendered Type and Sport as single
 *    `<select>`s fed with `filters.types[0]` / `filters.sports[0]`. Open a
 *    shared `?sport=Basketball&sport=Football` URL on a phone, tap Refine, hit
 *    "Show results" — Football was gone, silently. The rail has been
 *    multi-select since Aug 1; the sheet had never caught up. Both are now
 *    checkbox groups reading the full array, which a plain GET form serializes
 *    natively by repeating the input name.
 *
 * 2. SORT WAS UNREACHABLE ON A PHONE. <SortSelect> was gated behind
 *    `hidden sm:block` and the sheet carried `sort` only as a hidden input to
 *    preserve it. Below 640px there was no sort control anywhere on the board.
 *    Sort now lives in the sheet, below a divider and under its own legend,
 *    because §2.3a is explicit that sort is NOT a filter: it never renders as
 *    a removable chip and it survives "Reset all".
 *
 * And the last four native `<select>`s on the board are gone with them (§2.2).
 * Every control here is `components/ui/chip-group` — the same primitive /post
 * uses — so tap targets, focus rings, keyboard behaviour and screen-reader
 * announcement are identical on both sides of the app and maintained once.
 */

export type RefineValues = {
  /** Owned by the search field in the locked header — carried, never edited
   *  here. Without this, refining on a phone would wipe the seller's search. */
  q?: string;
  /** Multi-select, matching the rail. Empty array = any. */
  types: string[];
  /** Multi-select, matching the rail. Empty array = any. */
  sports: string[];
  condition?: string;
  min?: string;
  max?: string;
  closing?: boolean;
  noOffers?: boolean;
  sort?: string;
};

/** The sheet's GET form. Named because the submit button and the sort group
 *  both sit outside it in the DOM — the button re-attaches with `form=`, the
 *  sort group deliberately does not, so `sort_choice` never reaches the URL. */
const FORM_ID = "board-refine";

const rowClass =
  "flex min-h-11 w-full items-center rounded-sm border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const SPORT_OPTIONS: readonly ChipOption[] = SPORTS.map((s) => ({
  value: s,
  label: s,
}));

/** Condition labels come from `conditionChip()` rather than being typed out
 *  here, so the sheet, the board row, the profile row and the detail page can
 *  never word the same value three different ways. */
const CONDITION_OPTIONS: readonly ChipOption[] = CONDITIONS.map((c) => ({
  value: c.value,
  label: conditionChip(c.value, null) ?? c.label,
}));

/** Sort preserved across a reset — clearing filters must not silently reorder
 *  the board underneath someone (§2.3a). Mirrors resetHref() in board-filters,
 *  which the sheet can't call because it only holds a RefineValues. */
function clearAllHref(sort: string | undefined): string {
  return sort && sort !== DEFAULT_SORT
    ? `/?sort=${encodeURIComponent(sort)}`
    : "/";
}

export function RefinePanel({
  values,
  activeCount,
}: {
  values: RefineValues;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Portal target only exists on the client. Rendering before mount would mean
  // calling createPortal with no document.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape, lock background scroll, and move focus into the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Return focus to the trigger when the panel closes — keyboard users
  // otherwise get dumped at the top of the document.
  useEffect(() => {
    if (!open) triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <SlidersHorizontal aria-hidden />
        Refine
        {activeCount > 0 && (
          <span className="num ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-foreground px-1.5 text-xs font-semibold text-background">
            {activeCount}
          </span>
        )}
      </Button>

      {/* ⚠️ PORTALLED TO <body> — NOT OPTIONAL, AND NOT FOR TIDINESS.
          This sheet is `position: fixed`, and it renders from inside
          `.board-locked-header`, which carries `backdrop-blur`. An ancestor
          with `backdrop-filter` becomes the containing block for fixed-position
          descendants, so `inset-0` was resolving to the header's ~83px strip
          instead of the viewport: the sheet was drawn inside a thin bar and
          pushed to its right edge, which read as a sliver of nothing sliding in
          from the right. Every filter group was rendering correctly and none of
          it was reachable.

          The desktop advanced-search panel hit this identical bug on Aug 10 and
          was fixed the identical way (board-rail.tsx, commit e474673). The
          mobile sheet never got the same treatment. Anything `fixed` on this
          page has to escape the header, because the header is blurred.

          ⚠️ AND BECAUSE IT'S PORTALLED, IT CARRIES ITS OWN BREAKPOINT.
          The trigger sits in a `lg:hidden` wrapper in app/page.tsx, but that
          wrapper is no longer this element's DOM parent — it hides the button
          and NOT the sheet. `lg:hidden` on the root below is what keeps a
          full-screen mobile sheet off a desktop monitor. Same lesson the
          desktop panel already paid for at 606px. */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex justify-start lg:hidden">
          {/* Backdrop. Full-width sheet means none of this is visible on a
              phone — it's here for the scrim on larger phones in landscape and
              as a click target that can't be reached anyway. Dismissal is the X
              and the Escape key. */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />

          {/* Full width, entering from the LEFT (Kyle, Aug 10). The old
              `max-w-[420px]` + right-hand entry was a desktop drawer shape
              worn by a phone; on a 375px screen a filter surface should simply
              be the screen. `border-l` goes with it — there is no left edge to
              draw against when the sheet is the whole viewport. */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Refine the board"
            tabIndex={-1}
            className="relative flex h-full w-full flex-col bg-background shadow-xl outline-none motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold tracking-[-0.02em]">Refine</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X aria-hidden />
              </Button>
            </div>

            {/* Mounted only while open, so every group's initial state is read
                fresh from the URL each time the sheet is opened. Closing
                without submitting therefore discards edits rather than leaving
                a stale selection behind for the next open. */}
            <RefineForm values={values} activeCount={activeCount} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function RefineForm({
  values,
  activeCount,
}: {
  values: RefineValues;
  activeCount: number;
}) {
  // The chip primitives are controlled, so the multi-selects need state — but
  // the state is only mirroring real <input type="checkbox" name="type"> nodes
  // inside a plain GET form. Multi-value still comes from the browser
  // repeating the name, not from anything this component does at submit time.
  const [types, setTypes] = useState<string[]>(values.types);
  const [sports, setSports] = useState<string[]>(values.sports);
  const [condition, setCondition] = useState(values.condition ?? "");
  const [sort, setSort] = useState(values.sort ?? DEFAULT_SORT);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        {/* `display: contents` — the form is a real submission boundary but
            lays out as if it weren't, so the groups below stay direct children
            of the scrolling flex column. That matters because the sort group
            deliberately sits OUTSIDE this form (see below) while still
            scrolling with everything else. The submit button in the footer is
            wired back in with `form={FORM_ID}`. */}
        <form
          id={FORM_ID}
          method="get"
          action="/"
          className="contents"
        >
          {/* Search lives in the locked header, not in here. Carry it or
              refining on a phone would wipe the seller's query. */}
          {values.q && <input type="hidden" name="q" value={values.q} />}

          {/* The only thing that writes `sort` to the URL. Non-default values
              only, so a cleared board stays `/` rather than `/?sort=newest` —
              the same rule boardHref() follows. */}
          {sort !== DEFAULT_SORT && (
            <input type="hidden" name="sort" value={sort} />
          )}

          <ChipCheckboxGroup
            legend="What kind"
            name="type"
            options={TYPES}
            values={types}
            onValuesChange={setTypes}
          />

          <ChipCheckboxGroup
            legend="Sport"
            name="sport"
            options={SPORT_OPTIONS}
            values={sports}
            onValuesChange={setSports}
          />

          {/* 0018 narrowed condition_pref from free buyer-typed text to
              'raw' | 'graded' | null. This was a text box doing an ilike
              against it, which after the migration can only ever match those
              two words — so typing "PSA 9" silently returned nothing. A
              picker of the values that actually exist can't lie to the
              seller. Labels come from conditionChip() rather than being typed
              here a third time. */}
          <ChipSegmentedGroup
            legend="Condition"
            name="condition"
            options={CONDITION_OPTIONS}
            value={condition}
            onValueChange={setCondition}
          />

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Buyer&apos;s budget
            </legend>
            <div className="flex items-center gap-3">
              <label className="flex flex-1 flex-col gap-1.5 text-xs text-muted-foreground">
                Minimum
                <input
                  name="min"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  defaultValue={values.min ?? ""}
                  placeholder="$0"
                  className={rowClass}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5 text-xs text-muted-foreground">
                Maximum
                <input
                  name="max"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  defaultValue={values.max ?? ""}
                  placeholder="Any"
                  className={rowClass}
                />
              </label>
            </div>
          </fieldset>

          {/* The two filters that find a winnable deal rather than one
              with six offers already on it. They're the highest-value
              options in the rail, so they belong on mobile too. */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Closing
            </legend>
            <label className="flex min-h-11 items-center gap-3 text-base">
              <input
                type="checkbox"
                name="closing"
                value="1"
                defaultChecked={values.closing}
                className="size-[18px] rounded-sm border-input accent-foreground"
              />
              Under 24 hours
            </label>
            <label className="flex min-h-11 items-center gap-3 text-base">
              <input
                type="checkbox"
                name="nooffers"
                value="1"
                defaultChecked={values.noOffers}
                className="size-[18px] rounded-sm border-input accent-foreground"
              />
              No offers yet
            </label>
          </fieldset>
        </form>

        {/* ── Sort ─────────────────────────────────────────────────────────
            Above the divider: what to show. Below it: how to read it.
            Sort is not a filter (§2.3a) — it doesn't count toward the badge,
            it never becomes a removable chip, and "Reset all" leaves it
            alone. The rule survived on desktop only because sort had its own
            control up there; the divider and the separate legend are what
            carry the same distinction into a single scrolling sheet. */}
        <div className="border-t pt-5">
          <ChipSegmentedGroup
            legend="Sort"
            note="— not a filter"
            name="sort_choice"
            options={SORTS}
            value={sort}
            onValueChange={setSort}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t px-5 py-4">
        {/* Outside the <form> in the DOM, re-attached by id. Keeps the commit
            button pinned below the scroll area without wrapping the sort group
            in the form. */}
        <Button type="submit" form={FORM_ID} size="lg" className="flex-1">
          Show results
        </Button>
        {activeCount > 0 && (
          <Button asChild size="lg" variant="ghost">
            {/* Not `/` — that would reset sort too (§2.3a). */}
            <Link href={clearAllHref(values.sort)}>Clear all</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
