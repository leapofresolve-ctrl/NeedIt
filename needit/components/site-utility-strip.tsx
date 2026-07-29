import Link from "next/link";

/**
 * The utility strip (3b §1.5a) — 32px of dark chrome above the masthead.
 *
 * WHY A STRIP OF STATIC TEXT IS WORTH BUILDING. "Official" is mostly furniture.
 * Every established marketplace has this band, so its absence is one of the
 * cues that reads "side project" before a visitor can articulate why. It costs
 * 32 pixels and buys the frame everything below it sits in.
 *
 * THE RULE, restated because it is the whole discipline of this component:
 * every item must be true and every link must resolve. "Buyer protection" links
 * to the section that explains what protection actually means today — which is
 * structured offers and an on-platform record, not an insurance policy we
 * don't have. A trust bar that overstates is worse than no trust bar; the
 * people we're courting have been burned before and they read carefully.
 */
export function SiteUtilityStrip() {
  return (
    <div className="w-full border-b border-hairline bg-board">
      <div className="mx-auto flex h-8 w-full max-w-5xl items-center gap-4 overflow-x-auto px-5 text-[12px] text-board-muted">
        <span className="whitespace-nowrap">Trusted seller marketplace</span>
        <span aria-hidden className="text-board-faint">
          ·
        </span>
        <Link
          href="/how-it-works#safe"
          className="whitespace-nowrap transition-colors hover:text-board-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Buyer protection
        </Link>
        <span aria-hidden className="text-board-faint">
          ·
        </span>
        <Link
          href="/help"
          className="whitespace-nowrap transition-colors hover:text-board-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Help
        </Link>
      </div>
    </div>
  );
}
