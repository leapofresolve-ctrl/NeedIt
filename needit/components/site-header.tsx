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
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 w-full">
      <SiteUtilityStrip />
      <nav className="w-full border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
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
