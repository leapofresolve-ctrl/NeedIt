"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * First-run teaching for the board.
 *
 * WHY IT EXISTS
 * -------------
 * The 0-needs empty state was already doing tutorial work — it has nothing to
 * show, so it explains what the place *is* instead. That teaching vanishes the
 * moment the board fills up, but new users don't. This carries the same three
 * ideas onto a live board.
 *
 * Only one thing about Exprifi is genuinely unfamiliar: the direction.
 * Posting, offering and accepting are things everyone already knows from every
 * marketplace they've used, so we don't teach those. We teach the flip, the
 * two doors, and why it's safe to say what you want out loud — that last one
 * isn't a trust badge, it's load-bearing, because a reseller's edge *is*
 * knowing what to look for and we're asking them to post it.
 *
 * WHAT THIS DELIBERATELY IS NOT
 * -----------------------------
 * Not a modal, not a carousel, not coach-marks, not a Next/Skip tour, no
 * progress bar, no confetti, and it never emails. The beachhead is 45+ and
 * allergic to feeling handled; a tour that blocks the screen reads as a
 * startup demo, while a quiet line of text next to the thing it describes
 * reads as a business that thought about you. Same "official = restraint +
 * furniture" principle as the rest of the 3b pass.
 *
 * STORAGE: localStorage, not the profile. Dismissing this is a per-device
 * preference of no business value; a column and a server action would mean a
 * write on every dismissal and a migration for something nobody will ever
 * query. It also works signed-out, which a profile flag can't.
 */

const KEY = "exprifi:teach-strip";

const CARDS = [
  {
    n: "01",
    title: "You don't shop here",
    body: "Nothing below is for sale. Every row is a buyer telling you what they'll pay for.",
  },
  {
    n: "02",
    title: "Two doors, one account",
    body: "Selling? Work the board. Buying? Post a need — that's the only way to buy here.",
  },
  {
    n: "03",
    title: "Nobody sees your business",
    body: "Offers are private and structured. Names stay masked until a deal is agreed.",
  },
];

export function TeachStrip() {
  // "full" until we've read storage; render nothing before that so a returning
  // user never sees the strip flash in and disappear.
  const [state, setState] = useState<"unknown" | "full" | "mini">("unknown");

  useEffect(() => {
    setState(window.localStorage.getItem(KEY) === "1" ? "mini" : "full");
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(KEY, "1");
    setState("mini");
  };

  if (state === "unknown") return null;

  // Shrinks, doesn't vanish. People dismiss things by reflex and then want
  // them back ten minutes later; making them hunt through a Help menu is
  // where onboarding actually fails.
  if (state === "mini") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-card px-4 py-3">
        <p className="text-sm">
          <span className="font-semibold">New to Exprifi?</span>{" "}
          <span className="text-muted-foreground">
            Every row below is a buyer, not a listing.
          </span>
        </p>
        <Link
          href="/how-it-works"
          className="text-sm font-semibold underline underline-offset-2"
        >
          How it works →
        </Link>
      </div>
    );
  }

  return (
    <section
      aria-label="How Exprifi works"
      className="relative rounded-sm border border-foreground bg-card p-5"
    >
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className="microlabel text-[11px] text-muted-foreground">
          New here — 30 seconds
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Got it, hide this
        </button>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <li key={c.n} className="rounded-sm border bg-background p-4">
            <span className="num text-xs font-semibold text-primary">
              {c.n}
            </span>
            <h3 className="mt-2 text-base font-bold tracking-[-0.01em]">
              {c.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {c.body}
            </p>
          </li>
        ))}
      </ol>

      <Link
        href="/how-it-works"
        className="mt-4 inline-block text-sm font-semibold underline underline-offset-2"
      >
        The longer version →
      </Link>
    </section>
  );
}
