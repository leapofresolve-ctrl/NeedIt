"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from "lucide-react";

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
 * The docked filter rail (≥lg). Below that breakpoint the board uses the
 * Refine sheet instead — see refine-panel.tsx.
 *
 * WHY IT'S ALWAYS VISIBLE
 * -----------------------
 * Reveal-on-click was considered and rejected. The two most valuable options
 * here — "closing under 24h" and "no offers yet" — are how a seller finds a
 * winnable deal rather than one with six offers on it, and nobody discovers
 * those behind a button they have no reason to press. The counts are demand
 * data too, not just chrome: "Basketball · 11" is the best at-a-glance proof
 * the board is alive. Hidden filters are unused filters.
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
const COLLAPSE_KEY = "exprifi:board-rail-collapsed";

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
  railOverride = false,
}: {
  filters: BoardFilters;
  counts: FacetCounts;
  matching: number;
  /** `?rail=1` is on. Carried through so testing the rail below the volume
   *  threshold doesn't destroy the rail on the first click. */
  railOverride?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // True from the change event until the debounced apply actually fires. See
  // the header note: without it the rail looks dead for the debounce window.
  const [queued, setQueued] = useState(false);
  const busy = queued || isPending;

  // Collapse preference is remembered. Read after mount so the server render
  // and the first client render agree — reading localStorage during render is
  // a hydration mismatch waiting to happen.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

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

  if (hydrated && collapsed) {
    const active =
      filters.types.length +
      filters.sports.length +
      (filters.condition ? 1 : 0) +
      (filters.min ? 1 : 0) +
      (filters.max ? 1 : 0) +
      (filters.closing ? 1 : 0) +
      (filters.noOffers ? 1 : 0);
    return (
      <div className="board-rail hidden rail:block">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={false}
          className="flex min-h-[150px] w-11 flex-col items-center gap-3 rounded-r-sm border border-l-0 bg-card py-4 text-xs font-semibold transition-colors hover:border-foreground"
        >
          <PanelLeftOpen className="size-4" aria-hidden />
          <span className="microlabel [writing-mode:vertical-rl] text-[11px]">
            Filters
          </span>
          {active > 0 && <span className="num text-primary">{active}</span>}
        </button>
      </div>
    );
  }

  // `condition` is hand-editable in the URL and parseBoardFilters doesn't
  // validate it, so anything that isn't one of the two real values falls back
  // to "Any" — which also means submitting the rail quietly drops the garbage.
  const condition =
    filters.condition === "raw" || filters.condition === "graded"
      ? filters.condition
      : "";

  return (
    <aside className="board-rail hidden w-[264px] shrink-0 rail:block">
      <form
        ref={formRef}
        method="get"
        action="/"
        onChange={onChange}
        className="board-rail-form flex flex-col"
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
        {/* The `?rail=1` debug override. Not a filter, but it has to survive a
            submit or the rail deletes itself the first time you use it while
            the board is under RAIL_MIN_NEEDS. */}
        {railOverride && <input type="hidden" name="rail" value="1" />}

        {/* WHAT THIS COLUMN IS. Without a title the rail is an unlabelled
            stack of checkboxes in the margin — Kyle looked straight at it and
            asked where the advanced search had gone (Aug 9).

            It is a heading, NOT a button. §2.5a rejects reveal-on-click on
            desktop: hidden filters are unused filters, and the two options
            that decide whether a seller finds a winnable deal — closing under
            24 hours, no offers yet — are exactly the ones nobody goes looking
            for behind a control. The affordance this adds is a name, not a
            gate. `SlidersHorizontal` is the same icon the Refine button uses,
            so the two presentations of this one component read as the same
            feature at different widths rather than two unrelated things. */}
        {/* No border-b here on purpose. `Group` is `border-t … first:border-t-0`,
            and inserting this div means the first fieldset is no longer
            :first-child — so it takes its top border back and draws the divider
            under this title for us. A border-b as well would double it. */}
        <div className="flex items-center gap-2 pb-4">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="microlabel text-[11px] font-bold">Advanced search</h2>
        </div>

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

        <div className="board-rail-footer flex items-center justify-between border-t pt-4 text-sm">
          {/* The count used to swap to "…" while pending, which changed the
              width of the one element in the rail whose whole job is to hold
              still, and pushed a stale-then-ellipsis-then-fresh sequence
              through the live region. The pending state is now the dim (§3),
              which costs no layout at all; the live region stays quiet until
              there's a real number to announce, so a screen reader hears each
              recompute once instead of three times. */}
          <span className="num font-semibold" aria-live="polite" aria-busy={busy}>
            {matching} {matching === 1 ? "need" : "needs"}
          </span>
          <Link
            href={resetHref(filters)}
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Reset all
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded
          className="mt-3 flex items-center gap-2 self-start text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          <PanelLeftClose className="size-3.5" aria-hidden />
          Hide filters
        </button>
      </form>
    </aside>
  );
}
