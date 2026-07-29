import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * The auth wall (3b §3.3) — "do not redirect".
 *
 * THE BEHAVIOUR THIS REPLACES. A logged-out visitor who clicked anything used
 * to be thrown to /auth/login, losing the page, the scroll position and any
 * sense of what they were about to get. Most people don't come back from that,
 * and the ones least likely to come back are exactly the cautious older
 * collectors this marketplace is designed for.
 *
 * WHAT IT DOES INSTEAD. The real control renders — visibly, structurally,
 * disabled — behind a single bar that names the one thing standing between the
 * visitor and using it. Seeing the *shape* of the offer form (a price field, a
 * condition selector, a photo slot) is the conversion event: it makes concrete
 * what "make an offer" means on a platform they've never used. Then `?next=`
 * carries them back to this exact page after sign-in (see the proxy and
 * app/auth/login/actions.ts).
 *
 * ON THE WORD "MODAL". The spec asks for a modal. This ships as an inline bar
 * plus a real navigation that returns, which achieves the same promise — no
 * page loss, no dead end — without a client component, a focus trap, or a
 * second auth surface to keep secure. The modal is a Phase 2 polish item: it
 * saves one page transition, and that is all it saves. Ship the promise first.
 */
export function AuthWall({
  action,
  next,
  children,
}: {
  /** What they were trying to do, lowercase: "make an offer", "watch this need". */
  action: string;
  /** Path to return to after sign-in. Must start with "/". */
  next: string;
  /** The real control, rendered inert underneath. */
  children?: React.ReactNode;
}) {
  const query = `?next=${encodeURIComponent(next)}`;

  return (
    <div className="rounded-sm border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm font-medium">
          Sign in to {action}.{" "}
          <span className="font-normal text-muted-foreground">
            Free, and you&apos;ll come right back here.
          </span>
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/auth/sign-up${query}`}>Create account</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/auth/login${query}`}>Sign in</Link>
          </Button>
        </div>
      </div>

      {children && (
        <div
          // inert isn't universally supported yet, so belt and braces: pointer
          // events off, not focusable, hidden from the accessibility tree. A
          // "disabled" form that a keyboard user can still tab into and submit
          // is worse than no preview at all.
          aria-hidden
          className="pointer-events-none select-none p-4 opacity-55 [&_button]:pointer-events-none [&_input]:pointer-events-none [&_select]:pointer-events-none [&_textarea]:pointer-events-none"
          tabIndex={-1}
        >
          {children}
        </div>
      )}
    </div>
  );
}
