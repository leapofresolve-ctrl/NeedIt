"use client";

import { useRouter } from "next/navigation";

import { SORTS } from "@/lib/board-filters";

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

export function SortSelect({
  value,
  filters,
}: {
  value: string;
  filters: Record<string, string | undefined>;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Sort
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams();
          for (const [k, v] of Object.entries(filters)) {
            if (v) next.set(k, v);
          }
          // "newest" is the default — leave it out so URLs stay clean.
          if (e.target.value !== "newest") next.set("sort", e.target.value);
          const qs = next.toString();
          router.push(qs ? `/?${qs}` : "/");
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
