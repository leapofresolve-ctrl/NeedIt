import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { NotificationBell } from "@/components/notification-bell";
import { SiteUtilityStrip } from "@/components/site-utility-strip";
import { Button } from "@/components/ui/button";

/**
 * Masthead (3b §1.5b), now with the utility strip above it.
 *
 * The centre nav is new. Before public browsing there was nowhere to go except
 * the board, because everything else sat behind a login — a nav would have been
 * three links to a redirect. Now that How it works and Help render for anyone,
 * a logged-out visitor has an actual path through the site, which is the point
 * of opening the doors.
 *
 * Sticky positioning moved to the wrapper so the strip doesn't detach from the
 * masthead on scroll.
 *
 * HEIGHT IS A PUBLISHED NUMBER (--site-header-h, app/globals.css).
 * The board's locked header and the docked rail both pin themselves beneath
 * this thing, and until Aug 8 they didn't — the board header was `top-0 z-20`
 * exactly like this one, so on scroll it rode up into the masthead instead of
 * stopping below it. The nav row now takes its height FROM the variable rather
 * than declaring 64px next to it, so resizing the masthead moves everything
 * that depends on it. Note the real total is 98px, not 64: the utility strip
 * and both 1px bottom borders count.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 w-full">
      <SiteUtilityStrip />
      <nav className="w-full border-b bg-card">
        <div className="mx-auto flex h-[var(--site-masthead-h)] w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xl font-bold tracking-[-0.04em] text-foreground"
            >
              exprifi
              <span className="wordmark-tick" aria-hidden />
            </Link>
            <Button asChild size="sm" variant="default">
              <Link href="/post">Post a need</Link>
            </Button>
          </div>

          {/* Hidden below md: the footer carries the same routes, and a cramped
              nav is worse than no nav at 375px. */}
          <div className="hidden items-center gap-5 md:flex">
            <HeaderLink href="/">Board</HeaderLink>
            <HeaderLink href="/how-it-works">How it works</HeaderLink>
            <HeaderLink href="/help">Help</HeaderLink>
          </div>

          <div className="flex items-center gap-2">
            <Suspense>
              <NotificationBell />
            </Suspense>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>
    </header>
  );
}

function HeaderLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}
