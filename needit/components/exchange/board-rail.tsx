"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  SPORTS,
  TYPES,
  resetHref,
  type BoardFilters,
  type FacetCounts,
} from "@/lib/board-filters";

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
 * Checkboxes apply immediately; the price inputs debounce, because applying on
 * every keystroke of "500" would fire three navigations and land you on "5".
 */

const PRICE_DEBOUNCE_MS = 400;
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
}: {
  name: string;
  value: string;
  label: string;
  count: number;
  defaultChecked: boolean;
}) {
  // Zero-count options stay visible and dimmed, showing their real count.
  // Hiding them makes the board look smaller than it is; faking the number is
  // a trust violation you can't take back.
  const empty = count === 0 && !defaultChecked;
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 text-[15px] ${
        empty ? "text-faint" : ""
      }`}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-[18px] shrink-0 rounded-sm border-input accent-foreground"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="num shrink-0 text-xs text-faint">{count}</span>
    </label>
  );
}

export function BoardRail({
  filters,
  counts,
  matching,
}: {
  filters: BoardFilters;
  counts: FacetCounts;
  matching: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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
    // replace, not push: 20 filter toggles shouldn't mean 20 presses of Back
    // to get off the board. scroll:false keeps your place in a long list.
    startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
  };

  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const isText =
      e.target instanceof HTMLInputElement && e.target.type !== "checkbox";
    if (timer.current) clearTimeout(timer.current);
    if (isText) {
      timer.current = setTimeout(() => apply(form), PRICE_DEBOUNCE_MS);
    } else {
      apply(form);
    }
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  if (hydrated && collapsed) {
    const active =
      filters.types.length +
      filters.sports.length +
      (filters.min ? 1 : 0) +
      (filters.max ? 1 : 0) +
      (filters.closing ? 1 : 0) +
      (filters.noOffers ? 1 : 0);
    return (
      <div className="hidden lg:block">
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

  return (
    <aside className="hidden w-[264px] shrink-0 lg:block">
      <form
        ref={formRef}
        method="get"
        action="/"
        onChange={onChange}
        className="flex flex-col"
        aria-busy={isPending}
      >
        {/* Carried, not shown: these belong to the header and the mobile
            sheet. Without them, touching any rail filter would silently reset
            the seller's search, sort or condition. */}
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.sort && filters.sort !== "newest" && (
          <input type="hidden" name="sort" value={filters.sort} />
        )}
        {filters.condition && (
          <input type="hidden" name="condition" value={filters.condition} />
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

        <div className="flex items-center justify-between border-t pt-4 text-sm">
          <span className="num font-semibold" aria-live="polite">
            {isPending ? "…" : `${matching} ${matching === 1 ? "need" : "needs"}`}
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
