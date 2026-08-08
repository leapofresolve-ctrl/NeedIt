/**
 * The chips that describe a need, in one place.
 *
 * The board row, the profile row and the need detail page all render the same
 * set of attributes. Before this file they each built their own list inline,
 * which is exactly how "GRADED · PSA 9+" on one screen becomes "graded" on
 * another. One component, three call sites.
 *
 * Order is fixed and meaningful — it is the order a seller reads a row:
 *   type badge → sport → condition/grade → tags
 *
 * Tags are truncated to `maxTags` with a +N overflow. Two is the board's
 * budget: the row already carries a type badge, a sport chip and a condition
 * chip, and six chips wraps twice at 375px. The detail page passes Infinity.
 */

import { conditionChip, tagLabel } from "@/lib/need-tags";

export type NeedChipData = {
  type: "single" | "bulk";
  sport: string | null;
  condition_pref: string | null;
  grade_min: string | null;
  tags: string[] | null;
};

const chip =
  "num text-[9px] uppercase tracking-[0.08em] rounded-sm px-1.5 py-0.5 shrink-0";

/** Dark-board variant — used on the live board and the profile board. */
export function NeedChips({
  need,
  maxTags = 2,
}: {
  need: NeedChipData;
  maxTags?: number;
}) {
  const condition = conditionChip(need.condition_pref, need.grade_min);
  const tags = need.tags ?? [];
  const shown = tags.slice(0, maxTags);
  const hidden = tags.length - shown.length;

  return (
    <>
      {need.type === "bulk" ? (
        <span className={`${chip} font-bold bg-[#1E2A24] text-live`}>Bulk</span>
      ) : (
        <span
          className={`${chip} font-bold border border-[hsl(var(--primary-live))] text-live`}
        >
          Single
        </span>
      )}

      {need.sport && (
        <span className={`${chip} text-board-muted border border-board`}>
          {need.sport}
        </span>
      )}

      {condition && (
        <span className={`${chip} text-board-muted border border-board`}>
          {condition}
        </span>
      )}

      {shown.map((slug) => (
        <span key={slug} className={`${chip} bg-[#1E2A24] text-live font-medium`}>
          {tagLabel(slug)}
        </span>
      ))}

      {hidden > 0 && (
        <span className={`${chip} text-board-faint`} title={tags.slice(maxTags).map(tagLabel).join(", ")}>
          +{hidden}
        </span>
      )}
    </>
  );
}

/**
 * Light-chrome variant for the need detail page, which sits on the platform
 * background rather than the dark board panel. Shows every tag — there is no
 * horizontal pressure here and the detail page is where you go for the full
 * picture.
 */
export function NeedChipsLight({ need }: { need: NeedChipData }) {
  const condition = conditionChip(need.condition_pref, need.grade_min);
  const tags = need.tags ?? [];

  return (
    <>
      <span className="rounded-sm border px-2 py-0.5 text-xs font-medium capitalize">
        {need.type === "bulk" ? "Bulk lot" : "Single card"}
      </span>
      {need.sport && (
        <span className="rounded-sm border px-2 py-0.5 text-xs">{need.sport}</span>
      )}
      {condition && (
        <span className="rounded-sm border px-2 py-0.5 text-xs">{condition}</span>
      )}
      {tags.map((slug) => (
        <span
          key={slug}
          className="rounded-sm border border-primary bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tagLabel(slug)}
        </span>
      ))}
    </>
  );
}

/**
 * The price anchor. A comp need has no number by definition, so it renders the
 * words instead of a figure in the same slot, at the same weight — the anchor
 * is what a seller's eye lands on and it must not go missing.
 *
 * `AT COMP` rather than bare `COMP` on purpose: it reads as an instruction
 * ("offer me at comp") rather than as a label for a value we're not showing.
 */
export function priceAnchor(
  priceMode: string | null,
  cents: number | null,
): { text: string; suffix: string | null } {
  if (priceMode === "comp") return { text: "At comp", suffix: null };
  if (cents == null) return { text: "Open", suffix: null };
  return {
    text: `$${(cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`,
    suffix: "max",
  };
}
