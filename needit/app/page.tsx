import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { X } from "lucide-react";

import {
  CLOSING_SOON_HOURS,
  RAIL_MIN_NEEDS,
  activeFilterCount,
  budgetCents,
  hasAnyFilter,
  hrefWithout,
  parseBoardFilters,
  resetHref,
  sanitiseQuery,
} from "@/lib/board-filters";
import { FACET_COLUMNS, computeFacets, type FacetRow } from "@/lib/board-facets";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/exchange/countdown";
import { RefinePanel } from "@/components/exchange/refine-panel";
import { SortSelect } from "@/components/exchange/sort-select";
import { BoardRail } from "@/components/exchange/board-rail";
import { BoardLockedHeader } from "@/components/exchange/board-locked-header";
import { BoardSearch } from "@/components/exchange/board-search";
import { BoardEmptyState } from "@/components/exchange/board-empty-state";
import { TeachStrip } from "@/components/onboarding/teach-strip";
import { FirstRunHint } from "@/components/onboarding/first-run-hint";
import { NeedChips, priceAnchor } from "@/components/exchange/need-chips";

type RequestRow = {
  id: string;
  buyer_id: string;
  title: string;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  price_mode: string | null;
  condition_pref: string | null;
  grade_min: string | null;
  tags: string[] | null;
  image_url: string | null;
  expires_at: string | null;
  created_at: string;
  offer_count: number;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!hasEnvVars) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 text-center">
        <p>Environment is not configured yet.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  // Logged-in: require a username before showing the board.
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.username) {
      redirect("/onboarding");
    }
  }

  // ── The logged-out hero ───────────────────────────────────────────────────
  // Jul 29: this used to be an early `return` — a logged-out visitor saw the
  // two doors and nothing else, because the board itself was behind the login
  // gate. That is the single worst thing a marketplace can do to a stranger:
  // ask them to take it on faith that anyone is inside.
  //
  // Now the hero renders ABOVE the live board rather than instead of it. The
  // pitch and the proof arrive in the same scroll. This is also what makes the
  // board indexable — see app/sitemap.ts.
  const heroForLoggedOut = !userId ? (
    <section className="flex w-full flex-col items-center gap-8 px-6 pb-4 pt-10">
      <div className="flex flex-col gap-4 max-w-2xl text-center items-center">
          <span className="text-2xl font-bold tracking-[-0.04em]">
            exprifi
            <span className="wordmark-tick" aria-hidden />
          </span>
          <h1 className="text-5xl font-bold tracking-[-0.04em] leading-[1.05]">
            The marketplace
            <br />
            that hunts for you.
          </h1>
          <p className="text-lg text-muted-foreground">
            The demand exchange — post what you want, sellers come to you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 w-full max-w-3xl border bg-card notched">
          <div className="p-7 flex flex-col gap-3 border-b sm:border-b-0 sm:border-r">
            <span className="microlabel text-[10px] text-muted-foreground">
              Find cards
            </span>
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              Where demand finds supply.
            </h2>
            <p className="text-sm text-muted-foreground">
              Post a need. Watch sellers race to fill it.
            </p>
            {/* 3b: the door is the target, the button is the affordance.
                Full-width + lg = a 48px control inside a large hit area. */}
            <Button asChild size="lg" className="w-full mt-auto">
              <Link href="/auth/sign-up">Post a need</Link>
            </Button>
          </div>
          <div className="p-7 flex flex-col gap-3">
            <span className="microlabel text-[10px] text-muted-foreground">
              Sell cards
            </span>
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              Where supply finds demand.
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse open needs. Be first to strike the deal.
            </p>
            {/* One primary per screen (3b §1.2): "Post a need" is the primary,
                so the Sell door is secondary — same size, quieter weight.
                Block B landed Jul 29: this is now an anchor to the live board
                sitting directly below, not a login redirect. Nobody has to
                create an account to find out whether anyone is here. */}
            <Button asChild size="lg" variant="outline" className="w-full mt-auto">
              <Link href="#board">Browse the board</Link>
            </Button>
          </div>
        </div>

      <p className="num text-xs text-muted-foreground">
        every account does both — intent, not identity
      </p>
    </section>
  ) : null;

  // ----- Filters + sort from the URL -----
  const params = await searchParams;
  const filters = parseBoardFilters(params);
  const { sort } = filters;
  const hasFilters = hasAnyFilter(filters);

  // ----- Facets + the unfiltered total, in one pass ------------------------
  // Every open, public need, minimal columns. Serves two jobs: the per-option
  // counts in the rail, and the unfiltered total that decides whether the rail
  // renders at all. See lib/board-facets.ts for why this is counted in memory
  // and when that stops being the right call.
  const { data: facetData } = await supabase
    .from("requests")
    .select(FACET_COLUMNS)
    .eq("status", "open")
    .eq("visibility", "public");
  const facetRows = (facetData ?? []) as unknown as FacetRow[];
  const totalOpen = facetRows.length;
  const counts = computeFacets(facetRows, filters);
  // Threshold is measured against the UNFILTERED total so the rail doesn't
  // vanish underneath someone the moment they narrow things down.
  //
  // `?rail=1` forces it on regardless. The board is at 0 needs, so without an
  // override the rail is invisible on the live site and there's no way to eyeball
  // it — and seeding fake needs to see a filter panel would break the one rule
  // the board can't break. With the override you get real zero counts, dimmed,
  // which is exactly the honest low-volume state we specced.
  //
  // The override has to be CARRIED, not just read. It isn't a form field, so
  // the first version of the rail dropped it the moment you ticked anything —
  // one click and the rail you were testing disappeared, at 0 needs, with no
  // way back except editing the URL again. Threaded into the rail and the
  // search box below so it survives a round trip.
  const railOverride =
    (Array.isArray(params.rail) ? params.rail[0] : params.rail) === "1";
  const showRail = totalOpen >= RAIL_MIN_NEEDS || railOverride;

  // ----- Active-filter chips -----
  // Each active filter renders as a removable chip. `sort` is deliberately
  // excluded — it isn't a filter, it has its own always-visible control, and
  // it's never "removable". The text query gets a dashed chip so it reads as a
  // different kind of filter from the structured ones.
  const money = (v: string) => `$${Number(v).toLocaleString("en-US")}`;
  // One count, two consumers: the badge on the mobile Refine button and the
  // "N filters" chip the condensed header shows in place of the chip row.
  const activeCount = activeFilterCount(filters);
  const activeFilters: { key: string; label: string; dashed?: boolean }[] = [
    filters.q && { key: "q", label: `“${filters.q}”`, dashed: true },
    ...filters.types.map((t) => ({
      key: `type:${t}`,
      label: t === "bulk" ? "Bulk lots" : "Single cards",
    })),
    ...filters.sports.map((s) => ({ key: `sport:${s}`, label: s })),
    filters.condition && {
      key: "condition",
      label: filters.condition === "raw" ? "Raw only" : "Graded",
    },
    filters.min && { key: "min", label: `Min ${money(filters.min)}` },
    filters.max && { key: "max", label: `Max ${money(filters.max)}` },
    filters.closing && { key: "closing", label: "Closing under 24h" },
    filters.noOffers && { key: "nooffers", label: "No offers yet" },
  ].filter(Boolean) as { key: string; label: string; dashed?: boolean }[];

  let query = supabase
    .from("requests")
    .select(
      "id, buyer_id, title, type, sport, budget_cents, price_mode, condition_pref, grade_min, tags, image_url, expires_at, created_at, offer_count",
    )
    .eq("status", "open")
    .eq("visibility", "public");

  // ⚠️ These rules must stay in step with `matches()` in lib/board-facets.ts.
  // If they drift, the symptom is a count that doesn't match what you get when
  // you click it.
  if (filters.types.length) query = query.in("type", filters.types);
  if (filters.sports.length) query = query.in("sport", filters.sports);
  // Exact match since 0018 — condition_pref is now 'raw' | 'graded' | null, so
  // the old substring ilike would only ever have matched those two words anyway.
  if (filters.condition) query = query.eq("condition_pref", filters.condition);
  if (filters.q) {
    // Dumb on purpose: title + description, nothing else. sanitiseQuery() is
    // shared with the facet counter so both sides strip the same characters —
    // they didn't, and the counts disagreed with the rows for any query
    // containing a comma, a percent or a parenthesis.
    const safe = sanitiseQuery(filters.q);
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
  }
  // Also shared, for the same reason: this used to be parseFloat here and
  // Number in the counter, which disagree on "50abc".
  //
  // Note both are `null`-blind by nature — an unpriced need ("At comp", or
  // open-ended) fails any range comparison in Postgres and drops off the board.
  // That's correct, but silent, so the rail discloses `counts.unpriced`.
  const minCents = budgetCents(filters.min);
  const maxCents = budgetCents(filters.max);
  if (minCents != null) query = query.gte("budget_cents", minCents);
  if (maxCents != null) query = query.lte("budget_cents", maxCents);
  if (filters.closing) {
    query = query
      .gt("expires_at", new Date().toISOString())
      .lt(
        "expires_at",
        new Date(Date.now() + CLOSING_SOON_HOURS * 3_600_000).toISOString(),
      );
  }
  if (filters.noOffers) query = query.eq("offer_count", 0);

  if (sort === "expiring") {
    query = query.order("expires_at", { ascending: true, nullsFirst: false });
  } else if (sort === "budget") {
    query = query.order("budget_cents", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: requests } = await query;
  const rows = (requests ?? []) as RequestRow[];
  const totalOffers = rows.reduce((s, r) => s + (r.offer_count ?? 0), 0);

  // Map buyer ids → pseudonymous usernames for card attribution / profile links.
  const buyerIds = [...new Set(rows.map((r) => r.buyer_id))];
  let usernameById: Record<string, string> = {};
  if (buyerIds.length) {
    const { data: buyers } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", buyerIds);
    usernameById = Object.fromEntries(
      (buyers ?? [])
        .filter((b) => b.username)
        .map((b) => [b.id, b.username as string]),
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      {heroForLoggedOut}
      <div
        id="board"
        className="w-full max-w-6xl flex flex-col gap-4 px-2.5 sm:px-5 py-4 scroll-mt-28"
      >
        {/* Category pills — sports cards live; the platform is category-agnostic */}
        <div className="flex flex-wrap gap-2 px-1">
          <span className="rounded-sm bg-foreground text-background text-xs font-semibold px-3 py-1.5">
            Sports cards
          </span>
          <span className="rounded-sm border bg-card text-xs font-semibold px-3 py-1.5 text-muted-foreground">
            TCG
          </span>
          <span className="rounded-sm border bg-card text-xs font-semibold px-3 py-1.5 text-muted-foreground">
            Comics
          </span>
          <span className="rounded-sm border border-dashed text-xs font-semibold px-3 py-1.5 text-faint">
            Coins — soon
          </span>
        </div>

        {/* H1 + stats. When logged out the H1 is already spent on the hero, so
            this drops to an h2 — one h1 per document, and screen-reader users
            shouldn't hit two competing page titles. */}
        <div className="flex items-baseline justify-between gap-3 px-1">
          {userId ? (
            <h1 className="text-2xl font-bold tracking-[-0.03em]">
              Open demand
            </h1>
          ) : (
            <h2 className="text-2xl font-bold tracking-[-0.03em]">
              Open demand
            </h2>
          )}
          <span className="num text-xs text-muted-foreground">
            {rows.length} open · {totalOffers}{" "}
            {totalOffers === 1 ? "offer" : "offers"} in play
          </span>
        </div>

        {/* Trust strip (3b §1.5d). One line, static, no decorative icons. It
            sits under the H1 because that is where a cautious buyer's eye
            lands after the headline, and because these three sentences are the
            actual product differences — not marketing claims we'd have to
            defend later. */}
        <p className="px-1 text-sm text-muted-foreground">
          Structured offers only · No public contact sharing · Identities stay
          private until a deal is agreed
        </p>

        {/* First-run teaching. Sits above the locked header so it scrolls away
            naturally — it's an explanation, not a control. */}
        <TeachStrip />

        {/* ── THE LOCKED HEADER ──────────────────────────────────────────
            Search + active filters + sort, pinned. A seller scanning forty
            rows should never scroll away from their controls.

            Two filter surfaces, one rule (lib/board-filters.ts): search is
            dumb (text only), the rail is smart (everything structured), and
            they compose with AND. Below the `rail` screen (1736px) the rail
            can't dock without eating the board's width, so "Refine" reappears
            here — it is the narrow-viewport presentation of the rail, not a
            desktop control.

            It pins beneath the masthead now, not on top of it. Both were
            `sticky top-0 z-20`; see board-locked-header.tsx. */}
        <BoardLockedHeader>
          <div className="flex items-center gap-2.5">
            <BoardSearch filters={filters} railOverride={railOverride} />

            {/* The condensed header's stand-in for the chip row (§2.3a). CSS
                swaps the two on `data-condensed`, so both are always in the
                DOM and neither depends on JS to render its content — only on
                which one is shown. Deliberately not a link: at ≥1736px the rail is
                stuck open two inches to the left with per-option state and its
                own "Reset all", so this is a readout, not a control, and
                nothing is reachable only from here. */}
            {activeCount > 0 && (
              <span className="board-filter-summary num min-h-10 shrink-0 items-center gap-1.5 rounded-sm border bg-card px-3 text-sm font-semibold">
                {activeCount}
                <span className="font-medium text-muted-foreground">
                  {activeCount === 1 ? "filter" : "filters"}
                </span>
              </span>
            )}

            {/* Aug 8: this used to hand the sheet `filters.types[0]` and
                `filters.sports[0]` — one value each out of a multi-select —
                so a shared multi-facet URL lost everything after the first
                the moment a phone user tapped "Show results". The arrays go
                through whole now, and `sort` goes through as its real value
                rather than being nulled at the default, because the sheet
                owns the sort control below the rail's dock width.

                The two surfaces are exact complements: sheet below the `rail`
                screen (1736px), inline sort at and above it. Never both, never
                neither — that invariant is why these two wrappers must always
                be edited as a pair.

                Aug 9: both moved from `lg` (1024) to `rail` (1736) when the
                rail moved into the page gutter. The band from 1024–1735 now
                gets the sheet, because at those widths the rail can only exist
                by taking width from the board, and the board doesn't give any
                back. See RAIL_DOCK_MIN_PX in lib/board-filters.ts. */}
            <div className="rail:hidden">
              <RefinePanel
                values={{
                  q: filters.q,
                  types: filters.types,
                  sports: filters.sports,
                  condition: filters.condition,
                  min: filters.min,
                  max: filters.max,
                  closing: filters.closing,
                  noOffers: filters.noOffers,
                  sort,
                }}
                activeCount={activeCount}
              />
            </div>
            <div className="hidden rail:block">
              <SortSelect filters={filters} />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="board-chip-row flex flex-wrap items-center gap-2">
              {activeFilters.map((f) => (
                <Link
                  key={f.key}
                  href={hrefWithout(filters, f.key)}
                  className={`group inline-flex min-h-9 items-center gap-2 rounded-sm border bg-card px-3 text-sm font-medium transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    f.dashed ? "border-dashed text-muted-foreground" : ""
                  }`}
                >
                  {f.label}
                  <X
                    className="size-3.5 text-muted-foreground group-hover:text-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">Remove this filter</span>
                </Link>
              ))}
              {activeFilters.length > 1 && (
                <Link
                  href={resetHref(filters)}
                  className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Reset all
                </Link>
              )}
            </div>
          )}
        </BoardLockedHeader>

        {/* THE ROW EXTENDS LEFT INTO THE GUTTER, THE BOARD DOES NOT MOVE.
            `rail:-ml-[292px]` (264px rail + 28px gap) pulls this row's left
            edge out past the container into margin that was already empty. The
            board column below is `flex-1`, so it ends up occupying exactly the
            container width it had when no rail was present — 1112px — with its
            left edge unmoved. The rail costs the board nothing.

            The negative margin is on THIS ROW ONLY. Putting it on the
            container would drag the locked header (which bleeds to the
            container edges via `-mx-5`) left along with it, sliding the search
            field into the gutter. See RAIL_DOCK_MIN_PX in lib/board-filters.ts
            for why the breakpoint is 1736 and what it costs. */}
        {/* ⚠️ THE MARGIN IS CONDITIONAL ON THE RAIL ACTUALLY RENDERING.
            Shipped Aug 9 unconditional, which was wrong: `showRail` is false
            whenever the board is under RAIL_MIN_NEEDS, so on the real
            production URL (0 needs, no ?rail=1) there was no rail to occupy
            the 292px — the board simply slid 292px left and grew to 1444px.
            Verified at 1920 on ?rail=1 only, never on plain `/`, which is the
            URL every visitor loads. Don't re-couple these. */}
        <div
          className={`flex items-start gap-7 ${
            showRail ? "rail:-ml-[292px]" : ""
          }`}
        >
          {showRail && (
            <BoardRail
              filters={filters}
              counts={counts}
              matching={rows.length}
              railOverride={railOverride}
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {/* Under the threshold the rail doesn't render at all: a column of
                zeros makes the board look emptier than it is, and at this size
                the whole thing is readable top to bottom anyway. */}
            {!showRail && totalOpen > 0 && (
              <p className="text-sm text-muted-foreground">
                Everything open right now — small enough to read top to bottom.
              </p>
            )}

            {totalOpen > 0 && (
              <FirstRunHint id="board">
                <strong className="font-semibold">
                  Every row here is a buyer.
                </strong>{" "}
                Narrow it down to what you already have in boxes, then make an
                offer. Amber means it&apos;s closing within 24 hours.
              </FirstRunHint>
            )}

            {/* THE LIVE BOARD — dark exchange panel, hairline rows */}
            <section className="notched bg-board border border-board rounded-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-hairline">
            <h2 className="microlabel text-[11px] font-bold text-board-fg">
              Live board
            </h2>
            <span className="num text-xs text-live flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-live" aria-hidden />
              {rows.length} open
            </span>
          </div>

          {rows.length === 0 ? (
            <BoardEmptyState filtered={hasFilters} query={filters.q} />
          ) : (
            <ul>
              {rows.map((r, i) => {
                const poster = usernameById[r.buyer_id];
                const noOffers = r.offer_count === 0;
                // Urgent (<12h): the row becomes an amber-bordered notched card —
                // "urgency fills the notch amber". Computed at render; the blink
                // itself stays client-side in <Countdown>.
                const msLeft = r.expires_at
                  ? new Date(r.expires_at).getTime() - Date.now()
                  : null;
                const urgentNow =
                  msLeft != null && msLeft > 0 && msLeft < 12 * 3_600_000;
                if (urgentNow) {
                  return (
                    <li key={r.id} className="relative m-3">
                      <span aria-hidden className="notch-fill" />
                      <div className="notched border border-warn bg-board-card rounded-sm">
                        <NeedRowLink r={r} poster={poster} noOffers={noOffers} />
                      </div>
                    </li>
                  );
                }
                return (
                  <li
                    key={r.id}
                    className={i > 0 ? "border-t border-hairline" : ""}
                  >
                    <NeedRowLink r={r} poster={poster} noOffers={noOffers} />
                  </li>
                );
              })}
            </ul>
          )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

// <NeedRow> — the anatomy: type badge → chips → title → budget anchor → countdown.
// Whole row is the tap target (min 44px); hover = inset live border + tint;
// transitions on border/background only, 150ms — no transform on rows.
function NeedRowLink({
  r,
  poster,
  noOffers,
}: {
  r: RequestRow;
  poster: string | undefined;
  noOffers: boolean;
}) {
  const anchor = priceAnchor(r.price_mode, r.budget_cents);
  return (
    <Link
      href={`/request/${r.id}`}
      className="block px-4 py-3.5 min-h-[44px] transition-[background-color,box-shadow] duration-150 hover:bg-[rgba(46,217,138,0.06)] hover:shadow-[inset_0_0_0_1px_hsl(var(--primary-live))] active:bg-[rgba(46,217,138,0.14)]"
    >
      {/* Top line: type badge + attribute chips · offer count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <NeedChips need={r} />
        </div>
        <span
          className={`num text-[10.5px] shrink-0 ${
            noOffers || r.offer_count >= 5 ? "text-live" : "text-board-secondary"
          }`}
        >
          {noOffers
            ? "no offers — be first"
            : `${r.offer_count} offer${r.offer_count === 1 ? "" : "s"}${r.offer_count >= 5 ? " · racing" : ""}`}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-2 font-semibold text-[14.5px] leading-[1.3] text-board-fg line-clamp-1">
        {r.title}
      </h3>

      {/* Bottom line: budget anchor · countdown */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="num text-lg font-semibold text-live leading-none uppercase">
          {anchor.text}
          {anchor.suffix && (
            <span className="text-[9px] font-normal text-board-muted ml-1 normal-case">
              {anchor.suffix}
            </span>
          )}
        </span>
        <span className="flex items-center gap-3">
          <Countdown expiresAt={r.expires_at} />
          {poster && (
            <span className="num text-[10px] text-board-faint">@{poster}</span>
          )}
        </span>
      </div>
    </Link>
  );
}
