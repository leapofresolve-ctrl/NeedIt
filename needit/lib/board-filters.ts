/**
 * Shared vocabulary for the board's filter + sort controls.
 *
 * These used to live as separate copies in the page (which validates them
 * against the query) and in the filter UI (which renders them). Two copies of
 * a validated list drift, and when they do the symptom is a filter that
 * silently returns nothing. One source, imported by both.
 *
 * 3b addendum (Aug 1) — the board now has TWO filter surfaces, and the rule
 * that keeps them safe lives here:
 *
 *   SEARCH (`q`) is dumb. Plain text across title + description only. It never
 *   tries to parse "under 500" or "basketball". If someone types that, they
 *   get an honest empty state with their query echoed back — which is
 *   self-correcting. A silent mis-parse reads as the site being broken.
 *
 *   RAIL is smart. Every structured field lives there: type, sport, price
 *   band, closing window, offer state.
 *
 * They compose with AND, and both serialize into searchParams so any board
 * view is a shareable URL.
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

export const TYPES = [
  { value: "bulk", label: "Bulk lots" },
  { value: "single", label: "Single cards" },
] as const;

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "expiring", label: "Ending soon" },
  { value: "budget", label: "Highest budget" },
] as const;

export const DEFAULT_SORT = "newest";

/**
 * Below this many OPEN needs the rail doesn't render at all: full-width board,
 * search bar retained, one honest line where the filters would be.
 *
 * A rail full of zeros makes the board look emptier than it is, and at low
 * volume the whole board is readable top to bottom anyway. Counted against the
 * UNFILTERED total so the rail doesn't vanish underneath someone the moment
 * they narrow things down.
 *
 * One constant, deliberately not a user setting — tune it once there's real
 * behaviour to look at.
 */
export const RAIL_MIN_NEEDS = 15;

/** A need closing within this many hours counts as "closing soon". Matches the
 *  amber urgency treatment on the row itself. */
export const CLOSING_SOON_HOURS = 24;

/**
 * Whether a raw URL value is a sport we actually support. Guards the query so
 * a hand-edited `?sport=` can't reach the database as an arbitrary string.
 */
export const isSport = (value: string): boolean =>
  (SPORTS as readonly string[]).includes(value);

export const isType = (value: string): boolean =>
  value === "single" || value === "bulk";

/**
 * ── THE TWO SHARED PARSERS ─────────────────────────────────────────────────
 *
 * The board's rows come from a Supabase query in app/page.tsx; the rail's
 * counts come from `matches()` in lib/board-facets.ts. Those two have to agree
 * or a seller clicks "Football · 6" and gets four rows.
 *
 * That agreement used to be a comment asking both sides to be careful, and
 * both sides drifted anyway — the page sanitised `q` before the ilike and the
 * facet counter didn't, and the page parsed money with parseFloat while the
 * counter used Number. Same input, two answers, in the one place the product
 * cannot afford to be approximately right.
 *
 * So the rules live here, once, and both sides import them. Adding a third
 * caller is now safe by construction rather than by vigilance.
 */

/**
 * Make a user's search text safe to interpolate into a PostgREST `or()` filter.
 *
 * `or()` is comma-separated and parenthesis-delimited, so an unescaped comma
 * doesn't fail to match — it corrupts the filter into something else entirely.
 * `%` and `_` are ilike wildcards and `*` is the PostgREST spelling of `%`, so
 * they go too: a seller typing "50%" should search for the literal characters,
 * not match every row.
 *
 * Returns "" when nothing usable survives, which callers must read as "apply no
 * text filter at all" — not as "match the empty string", which matches
 * everything.
 */
export function sanitiseQuery(q: string): string {
  return q.replace(/[,()%_*]/g, " ").trim();
}

/**
 * Dollars from the URL → integer cents, or null if it isn't a number.
 *
 * Strict on purpose. `parseFloat("50abc")` is 50; `Number("50abc")` is NaN.
 * The rail's inputs are `type="number"` so the browser mostly prevents this,
 * but searchParams are hand-editable and shareable, and reading "50abc" as $50
 * is the same class of silent mis-parse the dumb-search rule above exists to
 * avoid. Better to ignore a filter we can't understand than to invent one.
 *
 * Negatives are dropped rather than clamped — `?min=-5` is not a request for
 * "$0 and up", it's a broken URL, and a filter that quietly does nothing is
 * easier to notice than one that quietly does something else.
 */
export function budgetCents(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export type BoardFilters = {
  /** Dumb free text. Title + description, nothing else. */
  q?: string;
  /** Multi-select. Empty array = any. */
  types: string[];
  /** Multi-select. Empty array = any. */
  sports: string[];
  /** Free text, substring match. Kept for the mobile Refine sheet. */
  condition?: string;
  min?: string;
  max?: string;
  /** Closing within CLOSING_SOON_HOURS. */
  closing: boolean;
  /** Nobody has offered yet — you'd be first in. */
  noOffers: boolean;
  sort: string;
};

type RawParams = { [key: string]: string | string[] | undefined };

const one = (v: string | string[] | undefined): string | undefined =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const many = (v: string | string[] | undefined): string[] => {
  if (v == null) return [];
  const list = Array.isArray(v) ? v : [v];
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))];
};

/**
 * Read filters out of searchParams. Tolerant of the old single-value URLs —
 * `?sport=Basketball` still works, it just parses into a one-element array —
 * so links shared before the rail landed don't break.
 */
export function parseBoardFilters(params: RawParams): BoardFilters {
  return {
    q: one(params.q),
    types: many(params.type).filter(isType),
    sports: many(params.sport).filter(isSport),
    condition: one(params.condition),
    min: one(params.min),
    max: one(params.max),
    closing: one(params.closing) === "1",
    noOffers: one(params.nooffers) === "1",
    sort: one(params.sort) ?? DEFAULT_SORT,
  };
}

/** True if anything at all is narrowing the board. Drives the empty state's
 *  wording — "nothing matches" vs "nothing posted yet" are different messages. */
export function hasAnyFilter(f: BoardFilters): boolean {
  return !!(
    f.q ||
    f.types.length ||
    f.sports.length ||
    f.condition ||
    f.min ||
    f.max ||
    f.closing ||
    f.noOffers
  );
}

/** How many filters are active, for the "N filters" chip in the condensed
 *  header and the count badge on the mobile Refine button. */
export function activeFilterCount(f: BoardFilters): number {
  return (
    (f.q ? 1 : 0) +
    f.types.length +
    f.sports.length +
    (f.condition ? 1 : 0) +
    (f.min ? 1 : 0) +
    (f.max ? 1 : 0) +
    (f.closing ? 1 : 0) +
    (f.noOffers ? 1 : 0)
  );
}

/** Serialize back to a board URL. Defaults are omitted so a clean board is `/`
 *  rather than `/?sort=newest`, which matters for canonical URLs and sharing. */
export function boardHref(f: BoardFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const t of f.types) p.append("type", t);
  for (const s of f.sports) p.append("sport", s);
  if (f.condition) p.set("condition", f.condition);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.closing) p.set("closing", "1");
  if (f.noOffers) p.set("nooffers", "1");
  if (f.sort && f.sort !== DEFAULT_SORT) p.set("sort", f.sort);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

/** Toggle one value in a multi-select facet and return the resulting URL. */
export function hrefWithToggled(
  f: BoardFilters,
  key: "types" | "sports",
  value: string,
): string {
  const current = f[key];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return boardHref({ ...f, [key]: next });
}

/** Drop a single filter — powers the chip "×" links. */
export function hrefWithout(f: BoardFilters, key: string): string {
  const next: BoardFilters = { ...f };
  if (key === "q") next.q = undefined;
  else if (key === "condition") next.condition = undefined;
  else if (key === "min") next.min = undefined;
  else if (key === "max") next.max = undefined;
  else if (key === "closing") next.closing = false;
  else if (key === "nooffers") next.noOffers = false;
  else if (key.startsWith("type:"))
    next.types = f.types.filter((t) => t !== key.slice(5));
  else if (key.startsWith("sport:"))
    next.sports = f.sports.filter((s) => s !== key.slice(6));
  return boardHref(next);
}

/** Drop both ends of the budget range at once. Powers the rail's "show the N
 *  unpriced needs this range is hiding" escape hatch — clearing one end still
 *  leaves the other excluding them, so removing them one at a time wouldn't
 *  do what the link says it does. */
export function hrefWithoutBudget(f: BoardFilters): string {
  return boardHref({ ...f, min: undefined, max: undefined });
}

/** Everything cleared except sort — "Reset all" shouldn't silently reorder the
 *  board underneath someone. */
export function resetHref(f: BoardFilters): string {
  return boardHref({
    types: [],
    sports: [],
    closing: false,
    noOffers: false,
    sort: f.sort,
  });
}

/** Facet counts, keyed by value. Computed with each facet's OWN selection
 *  excluded (standard faceting) so a seller can see what adding Football would
 *  bring in, not just what's already showing. */
export type FacetCounts = {
  types: Record<string, number>;
  sports: Record<string, number>;
  closing: number;
  noOffers: number;
  /**
   * How many needs the active budget range is hiding *because they carry no
   * number at all* — "At comp" needs (0018: `price_mode = 'comp'` forces
   * `budget_cents` null) and open-ended ones.
   *
   * Postgres compares NULL to a range as false, so the moment a seller types
   * anything into Buyer's max, every one of these silently vanishes. They
   * aren't too expensive or too cheap; they're unpriced, and a filter on price
   * has no honest opinion about them. §2.6's rule is that the board never hides
   * what it's leaving out, so the rail discloses this number instead.
   *
   * 0 whenever no budget range is set.
   */
  unpriced: number;
};
