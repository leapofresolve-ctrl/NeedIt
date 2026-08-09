"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Post a need, rendered over the board instead of replacing it.
 *
 * WHY THIS EXISTS. On a 1518px laptop, clicking "Post a need" from the board
 * took away a board the seller was reading and put a max-w-lg column in the
 * middle of an otherwise empty screen. §1.4 of the 3b addendum already flags
 * that dead space; the rail fills the left gutter, this fills the right one.
 * Presentation only — the form, the action and the URL are unchanged.
 *
 * WHY IT IS A ROUTE AND NOT A STATE FLAG. This component is rendered by
 * app/@panel/(.)post/page.tsx, a parallel + intercepting route. Soft-navigating
 * to /post renders this over whatever was underneath; a hard load or refresh of
 * /post renders the full page. A `?post=1` searchParam or a client boolean
 * would have broken both refresh and Back.
 *
 * DELIBERATELY DEPENDENCY-FREE, exactly like components/exchange/refine-panel.tsx.
 * The app has no dialog primitive and Radix's react-dialog is NOT installed —
 * that was a call, not an oversight. Plain state + fixed positioning does the
 * whole job: Escape, focus move, focus return, scroll lock, role="dialog".
 *
 * TWO PRESENTATIONS, ONE COMPONENT.
 *   ≥1024px  right-gutter panel, max-w-[480px], own scroll, dimmed board behind.
 *   <1024px  full-bleed, carrying the real SiteHeader, so the phone flow reads
 *            exactly as the standalone page does today. The breakpoint is `lg`
 *            because that is where board-rail.tsx docks and the gutter appears.
 *
 * THE DIRTY GUARD. Refine holds nothing and can be dismissed freely. This holds
 * a photo and eight fields, so a stray backdrop click must not silently destroy
 * a half-written need. Dirtiness is detected by listening for native `input` and
 * `change` events bubbling out of the panel — every control in the form,
 * including the two file inputs inside PhotoPicker, is a real form control, so
 * this needs no cooperation from PostNeedForm and cannot drift when the form
 * changes. A clean panel closes with no prompt; a confirm on an untouched form
 * is its own kind of amateur.
 *
 * BACK/FORWARD — DECIDED, NOT LEFT TO CHANCE. Browser Back is a real navigation:
 * it unmounts the panel and the draft is gone, with no prompt. Guarding it would
 * mean pushing a sentinel history entry and re-pushing on popstate, which is
 * fragile and can strand the URL out of sync with what is on screen. Escape and
 * the backdrop are the two accidental dismissals, and those are the two that
 * warn.
 *
 * FINISHING. createNeed ends in redirect("/") or redirect("/u/<username>").
 * That is a real navigation away from /post, so the interception stops matching,
 * app/@panel/default.tsx takes over and returns null, and the panel is gone. No
 * close handler runs and no discard prompt fires — the form left, it wasn't
 * dismissed.
 */
export function PostNeedPanel({
  mobileHeader,
  children,
}: {
  /** The real <SiteHeader />, passed in from the server component. Shown only
   *  below lg, where the panel covers the whole viewport and the header
   *  underneath it isn't visible. At lg it's hidden and the page's own header
   *  shows through the dim. */
  mobileHeader: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = useCallback(() => {
    // Focus first, then navigate: the trigger lives on the page underneath,
    // which is still mounted, so focus lands somewhere sensible instead of on
    // <body>.
    const opener = openerRef.current;
    if (opener && document.contains(opener)) {
      opener.focus({ preventScroll: true });
    }
    router.back();
  }, [router]);

  const requestClose = useCallback(() => {
    if (dirty) setConfirming(true);
    else close();
  }, [dirty, close]);

  // Remember the trigger, move focus in, lock the background.
  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape closes — through the guard, not around it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirming) {
        setConfirming(false);
        return;
      }
      requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirming, requestClose]);

  // Any real edit anywhere in the panel makes it dirty. Native listeners rather
  // than React's onChange because React's synthetic change never fires for the
  // file inputs PhotoPicker uses.
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const mark = () => setDirty(true);
    node.addEventListener("input", mark);
    node.addEventListener("change", mark);
    return () => {
      node.removeEventListener("input", mark);
      node.removeEventListener("change", mark);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 lg:flex lg:justify-end">
      {/* Backdrop — desktop only. Below lg the panel is the whole screen, so
          there is nothing to dim and nothing to click past. */}
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className="absolute inset-0 hidden bg-foreground/40 lg:block"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Post a need"
        tabIndex={-1}
        className="relative flex h-full w-full flex-col bg-background outline-none lg:max-w-[480px] lg:border-l lg:shadow-xl motion-safe:lg:animate-in motion-safe:lg:slide-in-from-right motion-safe:lg:duration-200"
      >
        <div className="lg:hidden">{mobileHeader}</div>

        {/* Desktop chrome. No title text: the form's own card is already headed
            "Post a need", and the dialog carries the accessible name. */}
        <div className="hidden items-center justify-end border-b px-5 py-3 lg:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={requestClose}
            aria-label="Close"
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-5">
            {children}
          </div>
        </div>

        {/* In-panel confirmation, not window.confirm — a browser dialog on top
            of a panel is the amateur signal 3b spent a whole pass removing. */}
        {confirming && (
          <div className="absolute inset-0 flex items-end justify-center bg-foreground/40 p-5 lg:items-center">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="discard-need-title"
              className="w-full max-w-sm rounded-sm border bg-background p-5 shadow-xl"
            >
              <h2
                id="discard-need-title"
                className="text-base font-bold tracking-[-0.02em]"
              >
                Discard this need?
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                You&apos;ve started filling this in. Closing now throws it away.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-11 flex-1"
                  onClick={() => setConfirming(false)}
                  autoFocus
                >
                  Keep editing
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="min-h-11 flex-1 text-destructive"
                  onClick={close}
                >
                  Discard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
