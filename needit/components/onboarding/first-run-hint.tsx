"use client";

import { useEffect, useState } from "react";

/**
 * One sentence, at the moment of confusion.
 *
 * Not up front, not in a queue, not part of a tour. Each hint appears once, in
 * place, the first time someone reaches a screen where the reverse-marketplace
 * logic actually bites — and then never again. Cheapest onboarding surface we
 * have and probably the highest-yield: the thing people misunderstand is
 * always *direction*, and direction is best explained while they're looking at
 * the thing pointing the wrong way in their head.
 *
 * `id` keys the dismissal, so adding a hint is one line and no migration.
 * See teach-strip.tsx for why this is localStorage rather than the profile.
 */

export function FirstRunHint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(window.localStorage.getItem(`exprifi:hint:${id}`) !== "1");
  }, [id]);

  if (!show) return null;

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-l-2 border-primary bg-primary/5 px-3.5 py-2.5 text-sm">
      <span className="min-w-0 flex-1">{children}</span>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(`exprifi:hint:${id}`, "1");
          setShow(false);
        }}
        className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Got it
      </button>
    </p>
  );
}
