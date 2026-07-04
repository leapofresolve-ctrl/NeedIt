import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/exchange/countdown";

type RequestRow = {
  id: string;
  buyer_id: string;
  title: string;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  condition_pref: string | null;
  image_url: string | null;
  expires_at: string | null;
  created_at: string;
  offer_count: number;
};

const SPORTS = [
  "Basketball",
  "Football",
  "Baseball",
  "Hockey",
  "Soccer",
  "Pokémon",
  "Other",
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "expiring", label: "Ending soon" },
  { value: "budget", label: "Highest budget" },
] as const;

const fieldClass =
  "flex rounded-sm border border-input bg-card px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function formatBudget(cents: number | null) {
  if (cents == null) return "Open";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

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

  // Logged-out: split landing — hero tagline + the two intent doors.
  if (!userId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-6">
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
            <Button
              asChild
              className="w-fit mt-2 bg-foreground text-background hover:bg-foreground/90"
            >
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
            <Button asChild className="w-fit mt-2">
              <Link href="/auth/login">Browse the board</Link>
            </Button>
          </div>
        </div>

        <p className="num text-xs text-muted-foreground">
          every account does both — intent, not identity
        </p>
      </main>
    );
  }

  // Logged-in: require a username.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.username) {
    redirect("/onboarding");
  }

  // ----- Filters + sort from the URL -----
  const params = await searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

  const fType = one(params.type);
  const fSport = one(params.sport);
  const fCondition = one(params.condition);
  const fMin = one(params.min);
  const fMax = one(params.max);
  const sort = one(params.sort) ?? "newest";
  const hasFilters = !!(fType || fSport || fCondition || fMin || fMax);

  let query = supabase
    .from("requests")
    .select(
      "id, buyer_id, title, type, sport, budget_cents, condition_pref, image_url, expires_at, created_at, offer_count",
    )
    .eq("status", "open")
    .eq("visibility", "public");

  if (fType === "single" || fType === "bulk") query = query.eq("type", fType);
  if (fSport && SPORTS.includes(fSport)) query = query.eq("sport", fSport);
  if (fCondition) query = query.ilike("condition_pref", `%${fCondition}%`);
  const minCents = fMin ? Math.round(parseFloat(fMin) * 100) : NaN;
  const maxCents = fMax ? Math.round(parseFloat(fMax) * 100) : NaN;
  if (Number.isFinite(minCents)) query = query.gte("budget_cents", minCents);
  if (Number.isFinite(maxCents)) query = query.lte("budget_cents", maxCents);

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
      <div className="w-full max-w-5xl flex flex-col gap-4 px-2.5 sm:px-5 py-4">
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

        {/* H1 + stats */}
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h1 className="text-2xl font-bold tracking-[-0.03em]">Open demand</h1>
          <span className="num text-xs text-muted-foreground">
            {rows.length} open · {totalOffers}{" "}
            {totalOffers === 1 ? "offer" : "offers"} in play
          </span>
        </div>

        {/* Quiet filter row (functional GET form) */}
        <form
          method="get"
          className="flex flex-wrap items-end gap-2 bg-card border rounded-sm p-3"
        >
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Type
            <select name="type" defaultValue={fType ?? ""} className={fieldClass}>
              <option value="">All</option>
              <option value="single">Single</option>
              <option value="bulk">Bulk lot</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Sport
            <select name="sport" defaultValue={fSport ?? ""} className={fieldClass}>
              <option value="">All</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Condition
            <input
              name="condition"
              defaultValue={fCondition ?? ""}
              placeholder="e.g. psa 9"
              className={`${fieldClass} w-24`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            $ min
            <input name="min" type="number" min="0" defaultValue={fMin ?? ""} className={`${fieldClass} w-20`} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            $ max
            <input name="max" type="number" min="0" defaultValue={fMax ?? ""} className={`${fieldClass} w-20`} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Sort
            <select name="sort" defaultValue={sort} className={fieldClass}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/">Clear</Link>
            </Button>
          )}
        </form>

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
            <div className="p-10 flex flex-col items-center gap-3 text-center">
              <p className="text-board-muted text-sm">
                {hasFilters
                  ? "Nothing matches these filters."
                  : "The demand exchange — post what you want, sellers come to you."}
              </p>
              {hasFilters ? (
                <Button asChild variant="outline">
                  <Link href="/">Clear filters</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/post">Post a need</Link>
                </Button>
              )}
            </div>
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
  return (
    <Link
      href={`/request/${r.id}`}
      className="block px-4 py-3.5 min-h-[44px] transition-[background-color,box-shadow] duration-150 hover:bg-[rgba(46,217,138,0.06)] hover:shadow-[inset_0_0_0_1px_hsl(var(--primary-live))] active:bg-[rgba(46,217,138,0.14)]"
    >
      {/* Top line: type badge + attribute chips · offer count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {r.type === "bulk" ? (
            <span className="num text-[9px] font-bold uppercase tracking-[0.08em] bg-[#1E2A24] text-live rounded-sm px-1.5 py-0.5 shrink-0">
              Bulk
            </span>
          ) : (
            <span className="num text-[9px] font-bold uppercase tracking-[0.08em] border border-[hsl(var(--primary-live))] text-live rounded-sm px-1.5 py-0.5 shrink-0">
              Single
            </span>
          )}
          {[r.sport, r.condition_pref].filter(Boolean).map((chip) => (
            <span
              key={chip as string}
              className="num text-[9px] uppercase tracking-[0.08em] text-board-muted border border-board rounded-sm px-1.5 py-0.5 shrink-0"
            >
              {chip}
            </span>
          ))}
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
        <span className="num text-lg font-semibold text-live leading-none">
          {formatBudget(r.budget_cents)}
          {r.budget_cents != null && (
            <span className="text-[9px] font-normal text-board-muted ml-1">
              max
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
