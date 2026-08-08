import {
  CLOSING_SOON_HOURS,
  SPORTS,
  TYPES,
  type BoardFilters,
  type FacetCounts,
} from "@/lib/board-filters";

/**
 * Facet counts for the board rail.
 *
 * WHY IN MEMORY
 * -------------
 * Proper faceting means counting each option with its OWN selection excluded —
 * "Football · 6" has to mean "6 more would appear if you ticked Football", not
 * "6 of the ones already showing". Done in SQL that's one query per facet
 * group, each with a slightly different WHERE clause: a lot of round trips and
 * a lot of places for the filter logic to drift out of sync with the rows the
 * board actually renders.
 *
 * Instead we fetch the facet columns for every open, public need once and
 * count in JS. At the board sizes this product will see for a long time
 * (hundreds, not millions) that's cheaper than the round trips, and there is
 * exactly one copy of the matching rules.
 *
 * ⚠️ WHEN TO REPLACE: if the open board ever passes a few thousand rows, this
 * fetch stops being free. At that point move to a Postgres function returning
 * all facet counts in one call — NOT to N queries from here.
 *
 * ⚠️ INVARIANT: `matches()` below must agree with the SQL query in app/page.tsx
 * that selects the displayed rows. If they disagree the symptom is a count
 * that doesn't match what you get when you click it. Any change to one is a
 * change to both.
 */

export type FacetRow = {
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  condition_pref: string | null;
  expires_at: string | null;
  offer_count: number | null;
  title: string | null;
  description: string | null;
};

/** The columns board-facets needs. Exported so the page can't select the wrong
 *  set and silently break counting. */
export const FACET_COLUMNS =
  "type, sport, budget_cents, condition_pref, expires_at, offer_count, title, description";

const centsFrom = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/**
 * Does this row satisfy the given filters? `skip` lets a facet exclude its own
 * dimension while counting.
 */
function matches(
  row: FacetRow,
  f: BoardFilters,
  skip?: "types" | "sports" | "closing" | "noOffers",
  now = Date.now(),
): boolean {
  if (skip !== "types" && f.types.length && !f.types.includes(row.type)) {
    return false;
  }
  if (
    skip !== "sports" &&
    f.sports.length &&
    !(row.sport && f.sports.includes(row.sport))
  ) {
    return false;
  }

  const min = centsFrom(f.min);
  const max = centsFrom(f.max);
  if (min != null && (row.budget_cents == null || row.budget_cents < min)) {
    return false;
  }
  if (max != null && (row.budget_cents == null || row.budget_cents > max)) {
    return false;
  }

  // Exact match, mirroring the page query since 0018 narrowed condition_pref
  // to 'raw' | 'graded' | null. Before that it was free text and this couldn't
  // be counted honestly, so it was skipped.
  if (f.condition && row.condition_pref !== f.condition) return false;

  if (f.q) {
    const needle = f.q.toLowerCase();
    const hay = `${row.title ?? ""} ${row.description ?? ""}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }

  if (skip !== "closing" && f.closing) {
    if (!row.expires_at) return false;
    const ms = new Date(row.expires_at).getTime() - now;
    if (!(ms > 0 && ms < CLOSING_SOON_HOURS * 3_600_000)) return false;
  }

  if (skip !== "noOffers" && f.noOffers && (row.offer_count ?? 0) !== 0) {
    return false;
  }

  return true;
}

export function computeFacets(
  rows: FacetRow[],
  f: BoardFilters,
): FacetCounts {
  const now = Date.now();
  const counts: FacetCounts = {
    types: {},
    sports: {},
    closing: 0,
    noOffers: 0,
  };

  for (const t of TYPES) counts.types[t.value] = 0;
  for (const s of SPORTS) counts.sports[s] = 0;

  for (const row of rows) {
    if (matches(row, f, "types", now)) {
      counts.types[row.type] = (counts.types[row.type] ?? 0) + 1;
    }
    if (row.sport && matches(row, f, "sports", now)) {
      counts.sports[row.sport] = (counts.sports[row.sport] ?? 0) + 1;
    }
    if (matches(row, f, "closing", now) && row.expires_at) {
      const ms = new Date(row.expires_at).getTime() - now;
      if (ms > 0 && ms < CLOSING_SOON_HOURS * 3_600_000) counts.closing += 1;
    }
    if (matches(row, f, "noOffers", now) && (row.offer_count ?? 0) === 0) {
      counts.noOffers += 1;
    }
  }

  return counts;
}
