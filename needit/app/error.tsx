"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  SUPPORT_EMAIL,
  SUPPORT_INBOX_LIVE,
  supportMailto,
} from "@/lib/contact";

/**
 * 3b: branded 500. Deliberately does NOT print the error message or digest to
 * the page — internal detail is exactly what an error screen shouldn't leak,
 * and it means nothing to a collector anyway. It goes to the console (and to
 * Sentry once that's wired) instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to Sentry once it's configured (Phase 1).
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16">
      <div className="notched flex w-full max-w-lg flex-col items-start gap-5 border border-board bg-board p-8">
        <span className="microlabel text-[10px] text-board-faint">
          Something broke
        </span>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-board-fg">
          That&apos;s on us, not you.
        </h1>
        <p className="text-sm text-board-secondary">
          Something went wrong loading this page. Nothing you did caused it, and
          no deal or offer was affected. Try again — if it keeps happening,
          let us know and we&apos;ll sort it out.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Back to the board</Link>
          </Button>
        </div>
        {SUPPORT_INBOX_LIVE && (
          <a
            href={supportMailto("Something broke on Exprifi")}
            className="text-xs text-board-secondary underline underline-offset-4"
          >
            {SUPPORT_EMAIL}
          </a>
        )}
      </div>
    </main>
  );
}
