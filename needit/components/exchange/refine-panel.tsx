"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

import { SPORTS } from "@/lib/board-filters";
import { Button } from "@/components/ui/button";

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
 */

export type RefineValues = {
  type?: string;
  sport?: string;
  condition?: string;
  min?: string;
  max?: string;
  sort?: string;
};

const rowClass =
  "flex min-h-11 w-full items-center rounded-sm border border-input bg-card px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

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

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Refine the board"
            tabIndex={-1}
            className="relative flex h-full w-full max-w-[420px] flex-col border-l bg-background shadow-xl outline-none motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-200"
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

            <form
              method="get"
              action="/"
              className="flex min-h-0 flex-1 flex-col"
            >
              {/* Sort lives outside the panel, so carry it through or
                  refining would silently reset the user's sort order. */}
              {values.sort && (
                <input type="hidden" name="sort" value={values.sort} />
              )}

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                <label className={labelClass}>
                  Type
                  <select
                    name="type"
                    defaultValue={values.type ?? ""}
                    className={rowClass}
                  >
                    <option value="">Any type</option>
                    <option value="single">Single card</option>
                    <option value="bulk">Bulk lot</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Sport
                  <select
                    name="sport"
                    defaultValue={values.sport ?? ""}
                    className={rowClass}
                  >
                    <option value="">Any sport</option>
                    {SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Condition
                  <input
                    name="condition"
                    defaultValue={values.condition ?? ""}
                    placeholder="e.g. PSA 9, raw, near mint"
                    className={rowClass}
                  />
                  <span className="text-xs font-normal text-muted-foreground">
                    Matches anything containing what you type.
                  </span>
                </label>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-medium">
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
              </div>

              <div className="flex items-center gap-3 border-t px-5 py-4">
                <Button type="submit" size="lg" className="flex-1">
                  Show results
                </Button>
                {activeCount > 0 && (
                  <Button asChild size="lg" variant="ghost">
                    <Link href="/">Clear all</Link>
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
