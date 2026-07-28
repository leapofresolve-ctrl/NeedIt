/**
 * Shared vocabulary for the board's filter + sort controls.
 *
 * These used to live as separate copies in the page (which validates them
 * against the query) and in the filter UI (which renders them). Two copies of
 * a validated list drift, and when they do the symptom is a filter that
 * silently returns nothing. One source, imported by both.
 */

export const SPORTS = [
  "Basketball",
  "Football",
  "Baseball",
  "Hockey",
  "Soccer",
  "Pokémon",
  "Other",
] as const;

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "expiring", label: "Ending soon" },
  { value: "budget", label: "Highest budget" },
] as const;

export const DEFAULT_SORT = "newest";

/**
 * Whether a raw URL value is a sport we actually support. Guards the query so
 * a hand-edited `?sport=` can't reach the database as an arbitrary string.
 */
export const isSport = (value: string): boolean =>
  (SPORTS as readonly string[]).includes(value);
