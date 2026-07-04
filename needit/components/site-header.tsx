import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <nav className="w-full border-b bg-card h-16 sticky top-0 z-20">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
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
  );
}
