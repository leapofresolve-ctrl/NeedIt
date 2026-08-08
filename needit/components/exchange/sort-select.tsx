"use client";

import { useRouter } from "next/navigation";

import { SORTS, boardHref, type BoardFilters } from "@/lib/board-filters";

/**
 * 3b: sort stays visible at rest while the filters collapse behind "Refine".
 *
 * Sort is not a filter — it's how you read the same set, people change it
 * constantly, and burying it costs more than it saves. Kept as one quiet
 * inline control, right-aligned, so the resting board is exactly two controls.
 *
 * Navigates on change (no "Apply" step) and preserves the active filters.
 *
 * The current filters are passed down from the server rather than read with
 * useSearchParams() — that hook forces the component into a Suspense boundary
 * at build time, and the page already knows these values.
 */

export function SortSelect({ filters }: { filters: BoardFilters }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Sort
      <select
        value={filters.sort}
        onChange={(e) => {
          // boardHref owns the serialisation, including dropping the default
          // sort — this used to rebuild the query string by hand and lost
          // multi-value facets in the process.
          router.push(boardHref({ ...filters, sort: e.target.value }), {
            scroll: false,
          });
        }}
        className="min-h-11 rounded-sm border border-input bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
