"use client";

import { useRouter } from "next/navigation";

import { SORTS, boardHref, type BoardFilters } from "@/lib/board-filters";
import { ChipSegmentedGroup } from "@/components/ui/chip-group";

/**
 * 3b: sort stays visible at rest while the filters collapse behind "Refine".
 *
 * Sort is not a filter — it's how you read the same set, people change it
 * constantly, and burying it costs more than it saves. Navigates on change (no
 * "Apply" step) and preserves the active filters.
 *
 * The current filters are passed down from the server rather than read with
 * useSearchParams() — that hook forces the component into a Suspense boundary
 * at build time, and the page already knows these values.
 *
 * ── Aug 8 ──────────────────────────────────────────────────────────────────
 * Was a native `<select>` — the last one on the board, and §2.2 lists "zero
 * native `<select>` on the page" as a hard goal because it is the single
 * loudest amateur signal. Now the same ChipSegmentedGroup /post uses, so the
 * two halves of the app share one keyboard and screen-reader implementation.
 *
 * The wrapper in app/page.tsx moved from `hidden sm:block` to `hidden lg:block`
 * at the same time. This control and the Refine sheet are now exact
 * complements: below 1024px sort lives inside the sheet (where it was
 * previously unreachable at all under 640px), at and above it sort lives here
 * and the sheet is gone. Exactly one sort control at every width — no
 * duplicate, and no hidden-input carry needed in either direction, because
 * boardHref() below preserves every filter and the sheet preserves sort.
 */

export function SortSelect({ filters }: { filters: BoardFilters }) {
  const router = useRouter();

  return (
    <ChipSegmentedGroup
      legend="Sort"
      // Distinct from the sheet's `sort_choice`: both can be in the DOM at
      // once (the sheet's wrapper is hidden with CSS, not unmounted), and two
      // radio groups sharing a name would fight over the checked state.
      name="sort_nav"
      options={SORTS}
      value={filters.sort}
      onValueChange={(sort) => {
        // boardHref owns the serialisation, including dropping the default
        // sort — this used to rebuild the query string by hand and lost
        // multi-value facets in the process.
        router.push(boardHref({ ...filters, sort }), { scroll: false });
      }}
      className="min-w-[280px]"
    />
  );
}
