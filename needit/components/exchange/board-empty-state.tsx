import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * 3b: the board's empty state used to be one muted sentence and a button
 * inside a large black box. On a board with zero needs — which is the current
 * reality — that box IS the product to a first-time visitor, and it read dead.
 *
 * This replaces it with the three things a cautious collector needs before
 * they'll sign up: what this is, what a real listing looks like, and what to
 * do next. The sample row is rendered in the exact anatomy of a live row so
 * the mental model transfers, and is explicitly labelled EXAMPLE so we are
 * never faking activity — the board's honesty is the whole brand.
 */

const STEPS = [
  {
    n: "01",
    title: "Post what you want",
    body: "The card, the lot, or just the filter — “5,000 count of 2019–21 Hoops.” Set your max budget and how long you'll wait.",
  },
  {
    n: "02",
    title: "Sellers come to you",
    body: "Anyone holding it sends a structured offer with a price and a photo. No searching, no scrolling, no bidding wars.",
  },
  {
    n: "03",
    title: "You pick the best one",
    body: "Compare offers side by side, counter on price, and accept the one you want. Identities stay private until you agree.",
  },
];

export function BoardEmptyState({
  filtered,
  query,
}: {
  filtered: boolean;
  query?: string;
}) {
  // Filtered-empty is a different situation with a different fix — don't
  // explain the product to someone who already understands it.
  if (filtered) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-sm text-board-secondary">
          {/* Echo the words back. Search is deliberately dumb — title and
              description only — so the two ways to get here are a typo and a
              structured phrase like "under 500" that search can't understand.
              Seeing your own text is what makes both self-correcting. */}
          {query ? (
            <>
              Nothing on the board matches{" "}
              <span className="font-semibold text-board-fg">
                &ldquo;{query}&rdquo;
              </span>
              . Search looks at need titles and descriptions — price and sport
              live in the filters.
            </>
          ) : (
            "Nothing on the board matches those filters right now."
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Clear filters</Link>
          </Button>
          <Button asChild>
            <Link href="/alerts">Alert me when something matches</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-xl font-bold tracking-[-0.02em] text-board-fg">
          The board is open. Nothing on it yet.
        </h3>
        <p className="mx-auto max-w-lg text-sm text-board-secondary">
          Exprifi works backwards from every other marketplace: you don&apos;t
          hunt for cards, you post what you&apos;re after and sellers bring it
          to you.
        </p>
      </div>

      {/* Three steps */}
      <ol className="grid gap-px overflow-hidden border border-hairline bg-[hsl(var(--board-hairline))] sm:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex flex-col gap-2 bg-board-card p-5 text-left"
          >
            <span className="num text-xs font-bold text-live">{s.n}</span>
            <h4 className="text-sm font-bold text-board-fg">{s.title}</h4>
            <p className="text-xs leading-relaxed text-board-muted">{s.body}</p>
          </li>
        ))}
      </ol>

      {/* Sample row — same anatomy as a live row, explicitly labelled. */}
      <div className="flex flex-col gap-2">
        <span className="microlabel text-[10px] text-board-faint">
          Example — this is what your need looks like
        </span>
        <div
          aria-hidden
          className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-board-card px-4 py-3 opacity-70"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="num rounded-sm bg-[#1E2A24] px-1.5 py-0.5 text-[10px] font-bold text-live">
                BULK
              </span>
              <span className="num text-[10px] text-board-faint">
                Basketball · any condition
              </span>
            </div>
            <span className="truncate text-sm font-semibold text-board-fg">
              5,000 count of 2019–21 Hoops base
            </span>
            <span className="num text-[11px] text-live">
              3 offers · racing
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="num text-lg font-semibold text-live">
              $212 <span className="text-[10px] text-board-faint">max</span>
            </span>
            <span className="num text-xs text-board-secondary">2d 04h</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button asChild size="lg">
          {/* scroll={false} — see the note in site-header.tsx. */}
          <Link href="/post" scroll={false}>
            Post the first need
          </Link>
        </Button>
        <Link
          href="/how-it-works"
          className="text-xs text-board-secondary underline underline-offset-4 hover:text-board-fg"
        >
          How Exprifi works
        </Link>
      </div>
    </div>
  );
}
