import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
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
  { value: "expiring", label: "Expiring soon" },
  { value: "budget", label: "Highest budget" },
] as const;

const fieldClass =
  "flex rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function formatBudget(cents: number | null) {
  if (cents == null) return "Open budget";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function timeLeft(expiresAt: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
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

  // Logged-out: simple Exprifi landing.
  if (!userId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center">
        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight">Exprifi</h1>
          <p className="text-lg text-muted-foreground">
            Post the card or lot you want. Sellers bring it to you.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
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

  const fType = one(params.type); // 'single' | 'bulk'
  const fSport = one(params.sport);
  const fCondition = one(params.condition);
  const fMin = one(params.min); // dollars
  const fMax = one(params.max); // dollars
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
      <div className="w-full max-w-5xl flex flex-col gap-6 p-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">The Board</h1>
            <p className="text-sm text-muted-foreground">
              Open needs from buyers. Bring them what they&apos;re looking for.
            </p>
          </div>
        </div>

        {/* Filters + sort (GET form → searchParams, server-rendered) */}
        <form
          method="get"
          className="flex flex-wrap items-end gap-2 border rounded-lg p-3"
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
            Budget $ min
            <input
              name="min"
              type="number"
              min="0"
              defaultValue={fMin ?? ""}
              className={`${fieldClass} w-20`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Budget $ max
            <input
              name="max"
              type="number"
              min="0"
              defaultValue={fMax ?? ""}
              className={`${fieldClass} w-20`}
            />
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
          <Button type="submit" size="sm" variant="default">
            Apply
          </Button>
          {hasFilters && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/">Clear</Link>
            </Button>
          )}
        </form>

        {rows.length === 0 ? (
          <div className="border rounded-lg p-10 flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? "Nothing matches these filters."
                : "No open needs yet. Be the first to post one."}
            </p>
            {hasFilters ? (
              <Button asChild variant="outline">
                <Link href="/">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/post">Post a Need</Link>
              </Button>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {rows.map((r) => {
              const left = timeLeft(r.expires_at);
              const poster = usernameById[r.buyer_id];
              return (
                <li
                  key={r.id}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors h-full flex flex-col"
                >
                  <Link href={`/request/${r.id}`} className="block">
                    {r.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt=""
                        className="w-full h-36 object-cover rounded-md mb-3"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold leading-tight">{r.title}</h2>
                      <span className="font-semibold whitespace-nowrap">
                        {formatBudget(r.budget_cents)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">
                        {r.type === "bulk" ? "Bulk lot" : "Single"}
                      </Badge>
                      {r.sport && <Badge variant="outline">{r.sport}</Badge>}
                      {r.condition_pref && (
                        <Badge variant="outline">{r.condition_pref}</Badge>
                      )}
                      {r.offer_count > 0 && (
                        <Badge variant="default">
                          {r.offer_count}{" "}
                          {r.offer_count === 1 ? "offer" : "offers"}
                        </Badge>
                      )}
                      {left && (
                        <Badge variant="outline" className="ml-auto">
                          {left}
                        </Badge>
                      )}
                    </div>
                  </Link>
                  {poster && (
                    <Link
                      href={`/u/${poster}`}
                      className="text-xs text-muted-foreground hover:underline mt-3 w-fit"
                    >
                      by {poster}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
