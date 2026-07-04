import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

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
  "flex rounded-md border border-input bg-card px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function formatBudget(cents: number | null) {
  if (cents == null) return "Open budget";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// Countdown per brand spec: mono; amber <24h; blinks <12h (the ONLY motion on the board).
function countdown(expiresAt: string | null): {
  label: string;
  hours: number | null;
} {
  if (!expiresAt) return { label: "", hours: null };
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "expired", hours: 0 };
  const totalHours = ms / 3_600_000;
  const d = Math.floor(totalHours / 24);
  const h = Math.floor(totalHours % 24);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const label =
    d > 0 ? `${d}d ${String(h).padStart(2, "0")}h` : `${h}h ${String(m).padStart(2, "0")}m`;
  return { label, hours: totalHours };
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

  // Logged-out: brand landing — hero tagline + the two intent doors.
  if (!userId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-12 p-8">
        <div className="flex flex-col gap-4 max-w-2xl text-center items-center">
          <span className="text-2xl font-bold tracking-tight">
            exprifi<span className="text-primary">.</span>
          </span>
          <h1 className="text-5xl font-bold tracking-tight leading-[1.05]">
            The marketplace
            <br />
            that <span className="text-primary">hunts for you.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            The demand exchange — post what you want, sellers come to you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-3xl">
          <div className="border bg-card rounded-xl p-7 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Find cards
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              Where demand finds supply.
            </h2>
            <p className="text-sm text-muted-foreground">
              Post a need. Watch sellers race to fill it.
            </p>
            <Button asChild className="w-fit mt-2">
              <Link href="/auth/sign-up">Post a need</Link>
            </Button>
          </div>
          <div className="bg-board border border-board rounded-xl p-7 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-board-muted">
              Sell cards
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-board-fg">
              Where supply finds demand.
            </h2>
            <p className="text-sm text-board-muted">
              Browse open needs. Be first to strike the deal.
            </p>
            <Button asChild variant="outline" className="w-fit mt-2">
              <Link href="/auth/login">Browse the board</Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
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
      <div className="w-full max-w-5xl flex flex-col gap-5 p-5">
        {/* Filters + sort — light chrome above the dark live board */}
        <form
          method="get"
          className="flex flex-wrap items-end gap-2 bg-card border rounded-xl p-3"
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

        {/* THE LIVE BOARD — dark exchange panel */}
        <section className="bg-board border border-board rounded-xl p-5 flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-live" />
              <h1 className="text-sm font-bold tracking-[0.22em] uppercase text-board-fg">
                Live board
              </h1>
            </div>
            <span className="num text-xs text-board-muted">
              {rows.length} open · {totalOffers} offers in play
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="border border-board rounded-lg p-10 flex flex-col items-center gap-3 text-center">
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
            <ul className="grid gap-3 sm:grid-cols-2">
              {rows.map((r) => {
                const cd = countdown(r.expires_at);
                const urgent = cd.hours != null && cd.hours < 12;
                const soon = cd.hours != null && cd.hours < 24;
                const poster = usernameById[r.buyer_id];
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border border-board bg-white/[0.03] hover:border-board-muted transition-colors"
                  >
                    <Link href={`/request/${r.id}`} className="block p-4">
                      {/* Row 1: type badge + condition · offer count */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {r.type === "bulk" ? (
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] bg-primary text-primary-foreground rounded px-2 py-0.5">
                              Bulk
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] border border-board-muted text-board-fg rounded px-2 py-0.5">
                              Single
                            </span>
                          )}
                          {(r.sport || r.condition_pref) && (
                            <span className="text-[10px] uppercase tracking-[0.12em] text-board-muted">
                              {[r.sport, r.condition_pref]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </div>
                        <span
                          className={`num text-xs ${
                            r.offer_count > 0 ? "text-live" : "text-board-muted"
                          }`}
                        >
                          {r.offer_count > 0
                            ? `${r.offer_count} offer${r.offer_count === 1 ? "" : "s"}${r.offer_count >= 3 ? " · racing" : ""}`
                            : "no offers — be first"}
                        </span>
                      </div>

                      {/* Row 2: title */}
                      <h2 className="mt-3 font-semibold text-[15px] leading-snug text-board-fg line-clamp-1">
                        {r.title}
                      </h2>

                      {/* Row 3: budget anchor + countdown */}
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <span className="num text-2xl font-bold text-live leading-none">
                          {formatBudget(r.budget_cents)}
                          {r.budget_cents != null && (
                            <span className="text-[11px] font-normal text-board-muted ml-1.5">
                              max
                            </span>
                          )}
                        </span>
                        {cd.label && (
                          <span
                            className={`num text-xs ${
                              urgent
                                ? "text-warn blink-urgent"
                                : soon
                                  ? "text-warn"
                                  : "text-board-muted"
                            }`}
                          >
                            {urgent ? `closing ${cd.label}` : cd.label}
                          </span>
                        )}
                      </div>
                    </Link>
                    {poster && (
                      <div className="px-4 pb-3 -mt-1">
                        <Link
                          href={`/u/${poster}`}
                          className="text-[11px] text-board-muted hover:text-board-fg hover:underline"
                        >
                          by {poster}
                        </Link>
                      </div>
                    )}
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
