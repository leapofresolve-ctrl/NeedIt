import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <nav className="w-full border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-3 px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Exprifi
          </Link>
          <Button asChild size="sm" variant="default">
            <Link href="/post">Post a Need</Link>
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
