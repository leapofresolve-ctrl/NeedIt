"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, SlidersHorizontal } from "lucide-react";

import {
  SPORTS,
  TYPES,
  hrefWithoutBudget,
  resetHref,
  type BoardFilters,
  type FacetCounts,
} from "@/lib/board-filters";
// Same list the Refine sheet and /post render from, so the three surfaces can't
// disagree about what a condition is or what it's called.
import { CONDITIONS } from "@/lib/need-tags";

/**
 * The floating "Advanced search" panel (≥lg). Below that breakpoint the board
 * uses the full-screen Refine sheet instead — see refine-panel.tsx.
 *
 * WHY IT FLOATS INSTEAD OF DOCKING — READ THIS BEFORE CHANGING THE LAYOUT
 * ----------------------------------------------------------------------
 * This was a docked column in the board's flex row for two days and broke the
 * board's geometry three separate times, each time in a new way:
 *
 *   1. It took its width out of the board (1112px → 826px at 1920) while
 *      384px of page gutter sat empty either side.
 *   2. Pulling the row left to use that gutter fixed the docked case and broke
 *      the undocked one — on the production URL, where the rail doesn't render
 *      at all, the board slid 292px left and grew to 1444px.
 *   3. The fix for that was more coupling: a conditional margin.
 *
 * It is now `position: fixed`. It has no width in the flow, so there is
 * nothing to subtract, nothing to compensate for, and no breakpoint for two
 * layouts to agree on. The board's position is not *kept* independent of this
 * panel — it is structurally incapable of depending on it. Any change that
 * puts this back into the board's layout row reintroduces all three bugs.
 *
 * WHY REVEAL-ON-CLICK, REVERSING §2.5a
 * ------------------------------------
 * §2.5a rejected click-to-open on the grounds that hidden filters are unused
 * filters — the two options that matter most, "closing under 24h" and "no
 * offers yet", are how a seller finds a winnable deal, and nobody finds those
 * behind a button. That argument assumed a rail people could see. The one we
 * shipped was invisible below 15 needs (so, always, on a board at 0) and
 * unlabelled when visible; Kyle looked straight at it and asked where the
 * search had gone. A named button beats an unfindable column. Kyle's call,
 * Aug 10.
 *
 * The panel stays open while you filter — the board updates behind it, live —
 * and closes only on an explicit dismissal: click outside, Escape, or the X.
 * It deliberately does NOT close on apply; watching the board react while you
 * keep adjusting is the entire point of floating it over the board rather than
 * taking the screen.
 *
 * WHY A REAL <form> WITH REAL CHECKBOXES
 * --------------------------------------
 * Auto-apply is done by submitting this form on change, not by swapping in
 * link-styled fake checkboxes. That keeps native checkbox semantics for screen
 * readers and keyboard users, keeps the whole thing working without JS (the
 * submit button is present, just visually hidden), and keeps searchParams the
 * single source of truth — a filtered board stays a shareable URL.
 *
 * EVERYTHING DEBOUNCES, AT TWO SPEEDS (§3)
 * ----------------------------------------
 * The price inputs wait 400ms, because applying on every keystroke of "500"
 * would fire three navigations and land you on "5". Choices wait 250ms — they
 * used to apply immediately, which meant ticking Basketball, Football, Baseball
 * and Hockey fired four `router.replace` calls and four board recomputes to
 * reach one state nobody wanted the first three of. One shared timer does the
 * coalescing: each change cancels the pending apply, so a burst of toggles
 * collapses into a single navigation carrying all of them.
 *
 * The rail dims from the moment you touch it, not from the moment the request
 * starts — the 250ms window is dead time otherwise, and a control that looks
 * inert for a quarter second reads as a dropped click.
 */

const PRICE_DEBOUNCE_MS = 400;
const CHOICE_DEBOUNCE_MS = 250;
const OPEN_KEY = "exprifi:board-filter-panel-open";

function Group({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t py-4 first:border-t-0 first:pt-0">
      <legend className="microlabel mb-3 text-[11px] text-muted-foreground">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function Option({
  name,
  value,
  label,
  count,
  defaultChecked,
  type = "checkbox",
}: {
  name: string;
  value: string;
  label: string;
  /** Omit only where no honest count exists — see the Condition group below.
   *  Never pass a placeholder; §2.6 forbids inventing one. */
  count?: number;
  defaultChecked: boolean;
  type?: "checkbox" | "radio";
}) {
  // Zero-count options stay visible and dimmed, showing their real count.
  // Hiding them makes the board look smaller than it is; faking the number is
  // a trust violation you can't take back. An absent count is not a zero, so
  // it doesn't dim either.
  const empty = count === 0 && !defaultChecked;
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 text-[15px] ${
        empty ? "text-faint" : ""
      }`}
    >
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className={`size-[18px] shrink-0 border-input accent-foreground ${
          type === "radio" ? "rounded-full" : "rounded-sm"
        }`}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span className="num shrink-0 text-xs text-faint">{count}</span>
      )}
    </label>
  );
}

export function BoardRail({
  filters,
  counts,
  matching,
  activeCount,
}: {
  filters: BoardFilters;
  counts: FacetCounts;
  matching: number;
  /** Number of active filters, for the badge on the trigger. Computed once on
   *  the server and shared with the header chips so the two can't disagree. */
  activeCount: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // Portal target only exists on the client. Rendering the panel before mount
  // would mean calling createPortal with no document.
  const [mounted, setMounted] = useState(false);
  // True from the change event until the debounced apply actually fires. See
  // the header note: without it the panel looks dead for the debounce window.
  const [queued, setQueued] = useState(false);
  const busy = queued || isPending;

  // Open state is remembered across navigations. Auto-apply calls
  // router.replace on every filter change, and while that doesn't remount this
  // component today, "the panel survives its own filtering" is the single most
  // load-bearing behaviour here — Kyle asked for it explicitly — so it does not
  // rest on that assumption holding.
  //
  // Read after mount, never during render: touching localStorage during render
  // makes the server and first client render disagree, which is a hydration
  // error rather than a wrong panel.
  useEffect(() => {
    setOpen(window.localStorage.getItem(OPEN_KEY) === "1");
    setMounted(true);
  }, []);

  const setOpenPersisted = (next: boolean) => {
    setOpen(next);
    window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
  };

  // DISMISSAL — outside click and Escape only. Never on apply.
  //
  // `mousedown`, not `click`: a click that starts inside the panel and ends
  // outside it (dragging across a price input, or releasing off a checkbox)
  // fires `click` on the document and would close the panel mid-interaction.
  // mousedown fires where the gesture actually began.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      // The trigger toggles itself; letting this handler also fire would close
      // and immediately reopen, so the button would never appear to close.
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpenPersisted(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenPersisted(false);
      // Focus goes back where it came from, or a keyboard user is stranded at
      // the top of the document with no idea what just happened.
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const apply = (form: HTMLFormElement) => {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string" && value.trim()) {
        params.append(key, value.trim());
      }
    }
    const qs = params.toString();
    // Cleared in the same tick that opens the transition, so `busy` never
    // flickers false in the handoff between the debounce and the navigation.
    setQueued(false);
    // replace, not push: 20 filter toggles shouldn't mean 20 presses of Back
    // to get off the board. scroll:false keeps your place in a long list.
    startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
  };

  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const target = e.target;
    // Checkboxes and radios are choices — one click, whole value, 250ms.
    // Anything else here is a typed number, which needs the longer window.
    const isChoice =
      target instanceof HTMLInputElement &&
      (target.type === "checkbox" || target.type === "radio");
    setQueued(true);
    // The single shared timer IS the coalescing: a second toggle inside the
    // window cancels the first apply rather than queueing another one.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => apply(form),
      isChoice ? CHOICE_DEBOUNCE_MS : PRICE_DEBOUNCE_MS,
    );
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);


  // `condition` is hand-editable in the URL and parseBoardFilters doesn't
  // validate it, so anything that isn't one of the two real values falls back
  // to "Any" — which also means submitting the rail quietly drops the garbage.
  const condition =
    filters.condition === "raw" || filters.condition === "graded"
      ? filters.condition
      : "";

  return (
    <>
      {/* THE TRIGGER. Lives in the board's locked header beside search and
          sort, so the thing that opens the filters sits with the other
          controls rather than floating somewhere on its own. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenPersisted(!open)}
        aria-expanded={open}
        aria-controls="board-filter-panel"
        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm border bg-card px-3 text-sm font-semibold transition-colors hover:border-foreground"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Advanced search
        {activeCount > 0 && (
          <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-foreground px-1.5 text-xs font-semibold text-background">
            {activeCount}
          </span>
        )}
      </button>

      {/* THE PANEL. `position: fixed` (see .board-filter-panel in globals.css),
          so it is out of flow and cannot move the board. No backdrop and no
          focus trap on purpose: this is a non-modal panel. The board behind it
          stays readable and stays live — that is the whole reason it floats
          over the board's left edge instead of taking the screen.

          ⚠️ PORTALLED TO <body> ON PURPOSE — DO NOT INLINE IT.
          The trigger lives inside BoardLockedHeader, which uses `backdrop-blur`.
          A `backdrop-filter` (like `transform`, `filter` and `will-change`)
          makes an element a CONTAINING BLOCK for fixed-position descendants, so
          rendering the panel in place silently anchored it to the header's box
          instead of the viewport: measured live at 1920, `left` resolved to
          484px — inside the board — rather than the intended 100px. `vw` units
          stayed viewport-relative while the origin didn't, which is why the
          number looked plausible and was wrong. The portal removes the
          dependency on which ancestors happen to have filters on them. */}
      {open && mounted && createPortal(
        <div
          ref={panelRef}
          id="board-filter-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Advanced search"
          className="board-filter-panel motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-200"
        >
          {/* THE CARD — deliberately the board's own anatomy, not a generic
              popover: `notched` 5c corner, same `rounded-sm border`, same
              header bar (`px-4 py-3 border-b` + microlabel) that carries "Live
              board" on the panel to the right of it. Light surface rather than
              `bg-board`, because this is chrome you operate, not data you read,
              and that is the same call the post-a-need panel makes.

              `overflow-hidden` matters twice: it keeps the notch clean at the
              corner, and it makes the rounded corners clip the scrolling body
              instead of the body's square edge poking through the radius. */}
          <div className="notched flex max-h-full flex-col overflow-hidden rounded-sm border bg-background">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <h2 className="microlabel text-[11px] font-bold">
                  Advanced search
                </h2>
              </div>
              <button
              type="button"
              onClick={() => {
                setOpenPersisted(false);
                triggerRef.current?.focus();
              }}
                aria-label="Close advanced search"
                className="-mr-1.5 inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </button>
            </div>

            {/* THE SCROLLING BODY. Scrolling lives here and not on the panel so
                the footer below stays pinned — the match count and "Reset all"
                are the two things that tell you the filters did anything, and
                they were previously off the bottom of a 711px panel on a 1000px
                screen. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          <form
            ref={formRef}
            method="get"
            action="/"
            onChange={onChange}
            className="board-rail-form flex flex-col pb-4"
            aria-busy={busy}
          >
        {/* Carried, not shown: these belong to the header. Without them,
            touching any rail filter would silently reset the seller's search
            or sort. `condition` used to be carried here too — it's a real
            group now (see below), so carrying it as well would submit the
            value twice. */}
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.sort && filters.sort !== "newest" && (
          <input type="hidden" name="sort" value={filters.sort} />
        )}
        <Group legend="What kind">
          {TYPES.map((t) => (
            <Option
              key={t.value}
              name="type"
              value={t.value}
              label={t.label}
              count={counts.types[t.value] ?? 0}
              defaultChecked={filters.types.includes(t.value)}
            />
          ))}
        </Group>

        <Group legend="Sport">
          {SPORTS.map((s) => (
            <Option
              key={s}
              name="sport"
              value={s}
              label={s}
              count={counts.sports[s] ?? 0}
              defaultChecked={filters.sports.includes(s)}
            />
          ))}
        </Group>

        {/* CONDITION — the mobile sheet has had this picker since 0018 and the
            rail didn't, so a seller on a 1440px monitor could see a condition
            filter in the header chips but had no way to set one, and no way to
            clear it except the chip's ×.

            RADIOS, NOT CHECKBOXES. `condition` is a single value in the URL —
            parseBoardFilters takes the first — and since 0018 the column is
            'raw' | 'graded' | null, which are mutually exclusive. Two
            checkboxes would let a seller tick both and then silently apply only
            one, which is the class of quiet mis-apply the dumb-search rule
            exists to avoid. "Any condition" is a real row rather than an
            un-tick, so the group is clearable with the keyboard and without JS
            (a radio can't be un-checked). Submitting value="" is a no-op both
            ways: apply() drops empty strings, and `one()` reads a bare
            `?condition=` as undefined.

            TODO(condition-facet): no counts on these rows. computeFacets() in
            lib/board-facets.ts doesn't emit a condition facet, and that file —
            along with the FacetCounts type in lib/board-filters.ts — is owned
            by another workstream, so this change doesn't touch it. The addition
            is strictly additive when someone gets to it: count rows by
            condition_pref with skip="condition" in matches(), expose
            `counts.condition: Record<string, number>`, and pass it as `count`
            here. Rendering countless rows is the honest interim state; a
            hardcoded 0 would dim options that may well have matches. */}
        <Group legend="Condition">
          {CONDITIONS.map((c) => (
            <Option
              key={c.value || "any"}
              type="radio"
              name="condition"
              value={c.value}
              label={c.label}
              defaultChecked={condition === c.value}
            />
          ))}
        </Group>

        <Group legend="Buyer's max">
          <div className="flex items-center gap-2">
            <label className="flex-1">
              <span className="sr-only">Minimum budget</span>
              <input
                name="min"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="$0"
                defaultValue={filters.min ?? ""}
                className="num flex min-h-11 w-full rounded-sm border border-input bg-card px-3 text-[15px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </label>
            <span aria-hidden className="text-faint">
              –
            </span>
            <label className="flex-1">
              <span className="sr-only">Maximum budget</span>
              <input
                name="max"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Any"
                defaultValue={filters.max ?? ""}
                className="num flex min-h-11 w-full rounded-sm border border-input bg-card px-3 text-[15px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </label>
          </div>

          {/* A budget range can't have an honest opinion about a need that
              names no number — "At comp" (0018 forces budget_cents null on
              those) or open-ended. Postgres drops them from any range
              comparison, so they vanish the instant a seller types a figure.
              Faithful to the query, invisible to the seller.

              §2.6's rule is that the board never hides what it's leaving out,
              so we say the number and offer the way back. Not a link that
              clears one end — clearing min alone still leaves max excluding
              them, so it has to drop both to do what it says. */}
          {counts.unpriced > 0 && (
            <p className="mt-3 text-xs leading-snug text-muted-foreground">
              Hiding{" "}
              <span className="num font-semibold">{counts.unpriced}</span> need
              {counts.unpriced === 1 ? "" : "s"} with no set budget.{" "}
              <Link
                href={hrefWithoutBudget(filters)}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Clear the range
              </Link>{" "}
              to see {counts.unpriced === 1 ? "it" : "them"}.
            </p>
          )}
        </Group>

        <Group legend="Closing">
          <Option
            name="closing"
            value="1"
            label="Under 24 hours"
            count={counts.closing}
            defaultChecked={filters.closing}
          />
          <Option
            name="nooffers"
            value="1"
            label="No offers yet"
            count={counts.noOffers}
            defaultChecked={filters.noOffers}
          />
        </Group>

        {/* Present for keyboard and no-JS users; the onChange handler makes it
            redundant when JS is running. */}
        <button type="submit" className="sr-only">
          Show results
        </button>

          </form>
            </div>

            {/* PINNED FOOTER — outside the scrolling body and outside the form.
                Neither control is a form field (a live count and a link), so
                lifting them out costs nothing and buys a footer that is always
                on screen. */}
            <div
              className="board-rail-footer flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 text-sm"
              data-busy={busy ? "true" : undefined}
            >
              {/* The count used to swap to "…" while pending, which changed the
                  width of the one element here whose whole job is to hold
                  still, and pushed a stale-then-ellipsis-then-fresh sequence
                  through the live region. The pending state is now the dim
                  (§3), which costs no layout at all; the live region stays
                  quiet until there's a real number to announce, so a screen
                  reader hears each recompute once instead of three times. */}
              <span
                className="num font-semibold"
                aria-live="polite"
                aria-busy={busy}
              >
                {matching} {matching === 1 ? "need" : "needs"}
              </span>
              <Link
                href={resetHref(filters)}
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Reset all
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
