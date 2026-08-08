/**
 * Shared vocabulary for the structured signals a buyer sets when posting a need:
 * tags, condition, and grade floor.
 *
 * Same reasoning as `lib/board-filters.ts`: these lists are validated in one
 * place (the server action) and rendered in several (post form, edit form,
 * board row, profile row, need detail). Two copies of a validated list drift,
 * and when they do the symptom is a chip that renders but can never be saved.
 * One source, imported by all of them.
 *
 * ── THE ONE DRIFT RISK IN THIS FILE ─────────────────────────────────────────
 * `NEED_TAGS` and `GRADE_FLOORS` are duplicated in check constraints on
 * `requests` (migration 0018: `requests_tags_chk`, `requests_grade_min_chk`).
 * That duplication is deliberate — the database is the backstop for any write
 * that doesn't go through the server action — but it means CHANGING A VALUE
 * HERE REQUIRES CHANGING THE CONSTRAINT IN THE SAME COMMIT. If you don't, the
 * new chip renders fine and the insert fails with a constraint violation.
 */

/** The ten tags a buyer can put on a need. Max 3 per need. Stored as slugs. */
export const NEED_TAGS = [
  { slug: "accepting-multiple", label: "Accepting multiple" },
  { slug: "set-building", label: "Set building" },
  { slug: "player-collection", label: "Player collection" },
  { slug: "team-lot", label: "Team lot" },
  { slug: "any-parallel", label: "Any parallel" },
  { slug: "numbered-only", label: "Numbered only" },
  { slug: "rookies-only", label: "Rookies only" },
  { slug: "vintage-only", label: "Vintage only" },
  { slug: "low-grade-ok", label: "Low grade OK" },
  { slug: "repeat-buyer", label: "Repeat buyer" },
] as const;

/**
 * Three. The board row already carries a type badge, a sport chip and a
 * condition chip — three tags puts a busy row at six chips, which is the
 * ceiling before it wraps twice at 375px. Tunable, but change the constraint
 * in 0018 too.
 */
export const MAX_TAGS = 3;

/**
 * Grade floors as hobby shorthand, not as a (company, number) pair. "PSA 9+"
 * is how people actually talk and ask for cards; splitting it into two
 * controls would add a second dropdown to buy precision nobody asked for.
 * Only meaningful when condition is 'graded'.
 */
export const GRADE_FLOORS = [
  "PSA 10",
  "PSA 9+",
  "PSA 8+",
  "SGC 9+",
  "BGS 9.5+",
  "Any 9+",
  "Any grade",
] as const;

/**
 * Condition. Narrowed from free text in 0018 — it used to be a 60-char box
 * whose contents rendered straight onto the board, so a chip could say
 * anything at all.
 *
 * Note "Raw only" and "Slabs only" are deliberately NOT tags. Duplicating them
 * would let a buyer post a contradiction (a "Raw only" tag on a graded need).
 */
export const CONDITIONS = [
  { value: "", label: "Any" },
  { value: "raw", label: "Raw only" },
  { value: "graded", label: "Graded" },
] as const;

export type NeedTagSlug = (typeof NEED_TAGS)[number]["slug"];
export type GradeFloor = (typeof GRADE_FLOORS)[number];
export type ConditionValue = "raw" | "graded";

/** How long a need stays on the board. Presentation for EXPIRY_HOURS in the action. */
export const EXPIRIES = [
  { value: "24h", label: "24 hours" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
] as const;

export const DEFAULT_EXPIRY = "7d";

/**
 * Price mode. 'max' = budget_cents is a ceiling. 'comp' = the buyer named no
 * number and the row reads AT COMP; sellers propose a price and the existing
 * counter-offer flow does the rest.
 *
 * IMPORTANT: "comp" here is a VERBATIM LABEL. No comparable-sales data is
 * fetched, stored, derived or implied anywhere in this codebase. Every row in
 * `card_data_providers` is inactive, and pulling sold-comps off a marketplace
 * is the live legal risk recorded in exprifi-3b-addendum-board-filtering.md
 * §1.2. If a future change makes this word depend on real pricing data, that
 * is a licensed-vendor decision, not a UI change.
 */
export type PriceMode = "max" | "comp";

export const isTag = (value: string): value is NeedTagSlug =>
  NEED_TAGS.some((t) => t.slug === value);

export const isGradeFloor = (value: string): value is GradeFloor =>
  (GRADE_FLOORS as readonly string[]).includes(value);

export const isCondition = (value: string): value is ConditionValue =>
  value === "raw" || value === "graded";

export const tagLabel = (slug: string): string =>
  NEED_TAGS.find((t) => t.slug === slug)?.label ?? slug;

/**
 * The single string that represents condition + grade on a board row, so the
 * board, the profile and the detail page can never word it differently.
 * Returns null when the buyer didn't care, which renders no chip at all.
 */
export const conditionChip = (
  condition: string | null,
  gradeMin: string | null,
): string | null => {
  if (condition === "raw") return "Raw only";
  if (condition === "graded")
    return gradeMin ? `Graded · ${gradeMin}` : "Graded";
  return null;
};

/**
 * Normalise a submitted tag list: unknown values dropped, duplicates removed,
 * capped at MAX_TAGS. Returns the reason when something was rejected outright
 * rather than quietly trimmed, so the action can surface a real message
 * instead of silently saving less than the buyer chose.
 */
export function normaliseTags(raw: string[]): {
  tags: string[];
  error?: string;
} {
  const known = [...new Set(raw.map((t) => t.trim()).filter(Boolean))].filter(
    isTag,
  );
  if (raw.length > 0 && known.length === 0)
    return { tags: [], error: "Those tags aren't available." };
  if (known.length > MAX_TAGS)
    return { tags: [], error: `Pick up to ${MAX_TAGS} tags.` };
  return { tags: known };
}
