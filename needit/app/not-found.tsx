import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * 3b: a default framework 404 is the loudest "side project" signal a site can
 * emit — it's the one page a visitor sees when something has already gone
 * wrong, so it's the page that most needs to look like a company built it.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16">
      <div className="notched flex w-full max-w-lg flex-col items-start gap-5 border border-board bg-board p-8">
        <span className="microlabel text-[10px] text-board-faint">
          Error 404
        </span>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-board-fg">
          This page isn&apos;t on the board.
        </h1>
        <p className="text-sm text-board-secondary">
          It may have expired, been filled, or been taken private by whoever
          posted it. Needs don&apos;t stay up forever — that&apos;s rather the
          point.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Back to the board</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/how-it-works">How Exprifi works</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
