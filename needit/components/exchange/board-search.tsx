"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { boardHref, type BoardFilters } from "@/lib/board-filters";

/**
 * The board's text search — deliberately dumb.
 *
 * It matches title and description. That's it. It does not parse "under 500",
 * it does not recognise "basketball", it does not try to be clever. Type
 * "under 500" and you get an honest empty state with your words echoed back,
 * which is self-correcting; a silent mis-parse reads as the site being broken,
 * and there's no usage data yet to tune a parser against. Everything
 * structured lives in the rail (or the Refine sheet on mobile), and the two
 * compose with AND.
 *
 * Lives in the locked header so a seller scanning forty rows never scrolls
 * away from it.
 */

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export function BoardSearch({ filters }: { filters: BoardFilters }) {
  const router = useRouter();
  const [value, setValue] = useState(filters.q ?? "");
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep in step when the URL changes from somewhere else — a chip "×", the
  // Reset link, or the browser Back button.
  useEffect(() => {
    setValue(filters.q ?? "");
  }, [filters.q]);

  const push = (next: string) => {
    const trimmed = next.trim();
    const q = trimmed.length >= MIN_CHARS ? trimmed : undefined;
    if ((filters.q ?? "") === (q ?? "")) return;
    const href = boardHref({ ...filters, q });
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next), DEBOUNCE_MS);
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        push(value);
      }}
      className="flex min-h-11 flex-1 items-center gap-2.5 rounded-sm border border-foreground bg-card px-3.5 sm:min-h-[52px]"
    >
      <Search className="size-[18px] shrink-0 text-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by player, set or team"
        aria-label="Search open demand by player, set or team"
        className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            if (timer.current) clearTimeout(timer.current);
            push("");
          }}
          className="shrink-0 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          <X className="size-4 sm:hidden" aria-hidden />
          <span className="sr-only sm:not-sr-only">Clear</span>
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {isPending ? "Updating results" : ""}
      </span>
    </form>
  );
}
