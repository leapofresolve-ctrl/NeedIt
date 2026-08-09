"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The sticky shell around the board's locked header (§2.3a).
 *
 * WHY THIS EXISTS AS A SEPARATE COMPONENT
 * ---------------------------------------
 * app/page.tsx is a server component, and condensing is a scroll-position
 * question, so something client-side has to own the boolean. Everything
 * *inside* the header stays in page.tsx — this only wraps it. The condensed
 * styling is CSS keyed off `data-condensed` (app/globals.css) rather than
 * classNames threaded down through props, because the things that have to
 * respond to it — the search form, the chip row — are descendants owned by
 * other components. A stylesheet can reach them; a prop can't without editing
 * files this change has no business editing.
 *
 * WHY IT PINS AT --site-header-h RATHER THAN 0
 * --------------------------------------------
 * It used to be `sticky top-0 z-20`, which is exactly what the masthead is, so
 * the two claimed the same slot and the board header rode up into the masthead
 * on scroll instead of stopping beneath it. Now it parks at the masthead's
 * published height and sits one z-layer under it, so the stacking order matches
 * the physical one.
 *
 * THE HYSTERESIS IS DELIBERATE
 * ----------------------------
 * Condense at 120px (the spec's number), expand again at 90 — not at 120. With
 * a single threshold, a header that shrinks by ~24px can pull the document
 * short enough to drop the scroll position back under the line, which un-shrinks
 * it, which pushes it back over: a flicker loop you can trigger by parking the
 * scroll exactly on the boundary. A 30px gap between the two edges makes that
 * impossible.
 */

const CONDENSE_AT = 120;
const EXPAND_AT = 90;

export function BoardLockedHeader({ children }: { children: React.ReactNode }) {
  const [condensed, setCondensed] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const read = () => {
      frame.current = null;
      // Read inside the state updater so the threshold depends on the CURRENT
      // state without making `condensed` a dependency of this effect — the
      // listener attaches once, not on every toggle.
      setCondensed((prev) =>
        prev ? window.scrollY > EXPAND_AT : window.scrollY > CONDENSE_AT,
      );
    };
    const onScroll = () => {
      if (frame.current == null) {
        frame.current = window.requestAnimationFrame(read);
      }
    };

    // Restored scroll position on a back-navigation or a reload doesn't fire a
    // scroll event, so measure once on mount too.
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current != null) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      data-condensed={condensed}
      className="board-locked-header sticky z-10 -mx-2.5 flex flex-col gap-2.5 border-b bg-background/95 px-2.5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-5 sm:px-5"
    >
      {children}
    </div>
  );
}
