import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

// Admin-only M1 liquidity dashboard. Data comes from the admin_metrics()
// SECURITY DEFINER function (migration 0006), which itself re-checks
// profiles.is_admin — this page's check is UX, the DB check is the gate.

export const dynamic = "force-dynamic";

type TrendDay = {
  day: string;
  needs: number;
  offers: number;
  matches: number;
};

type Metrics = {
  published_needs: number;
  needs_with_offer: number;
  pct_with_offer: number | null;
  ttfo_median_secs: number | null;
  ttfo_p90_secs: number | null;
  offers_total: number;
  offers_per_need: number | null;
  offers_per_engaged_need: number | null;
  avg_counter_rounds_negotiated: number | null;
  negotiated_offers: number;
  matched_needs: number;
  match_rate_pct: number | null;
  trend: TrendDay[] | null;
};

function formatDuration(secs: number | null) {
  if (secs == null) return "—";
  if (secs < 60) return `${Math.round(secs)}s`;
  if (secs < 3_600) return `${Math.round(secs / 60)}m`;
  if (secs < 86_400) return `${(secs / 3_600).toFixed(1)}h`;
  return `${(secs / 86_400).toFixed(1)}d`;
}

function formatPct(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

function formatNum(v: number | null) {
  return v == null ? "—" : `${v}`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-bold">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  );
}

function TrendBars({
  trend,
  field,
  label,
}: {
  trend: TrendDay[];
  field: "needs" | "offers" | "matches";
  label: string;
}) {
  const max = Math.max(1, ...trend.map((d) => d[field]));
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label} — last 7 days
      </span>
      <div className="flex items-end gap-2 h-24">
        {trend.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{d[field]}</span>
            <div
              className="w-full rounded-t bg-foreground/80 min-h-[2px]"
              style={{ height: `${(d[field] / max) * 100}%` }}
            />
            <span className="text-[10px] text-muted-foreground">
              {new Date(`${d.day}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MetricsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!me?.username) redirect("/onboarding");
  if (!me.is_admin) redirect("/");

  const { data, error } = await supabase.rpc("admin_metrics");
  if (error || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center">
        <SiteHeader />
        <div className="w-full max-w-3xl p-5">
          <h1 className="text-2xl font-bold">Metrics</h1>
          <p className="text-sm text-muted-foreground mt-2 border rounded-lg p-5">
            Couldn&apos;t load metrics{error ? `: ${error.message}` : ""}. Has
            migration 0006 been run in Supabase?
          </p>
        </div>
      </main>
    );
  }

  const m = data as Metrics;
  const trend = m.trend ?? [];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-3xl flex flex-col gap-6 p-5">
        <div>
          <h1 className="text-2xl font-bold">Liquidity metrics</h1>
          <p className="text-sm text-muted-foreground">
            M1 north star: do needs get offers, and how fast. Admin-only.
          </p>
        </div>

        {/* North-star row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Needs with ≥1 offer"
            value={formatPct(m.pct_with_offer)}
            sub={`${m.needs_with_offer} of ${m.published_needs} published needs`}
          />
          <StatCard
            label="Time to first offer (median)"
            value={formatDuration(m.ttfo_median_secs)}
            sub="from need posted"
          />
          <StatCard
            label="Time to first offer (p90)"
            value={formatDuration(m.ttfo_p90_secs)}
            sub="slowest 10% excluded"
          />
        </div>

        {/* Depth row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Offers per need"
            value={formatNum(m.offers_per_need)}
            sub={`${m.offers_total} offers total`}
          />
          <StatCard
            label="Offers per engaged need"
            value={formatNum(m.offers_per_engaged_need)}
            sub="needs with ≥1 offer"
          />
          <StatCard
            label="Counter rounds"
            value={formatNum(m.avg_counter_rounds_negotiated)}
            sub={`avg across ${m.negotiated_offers} negotiated offers`}
          />
          <StatCard
            label="Match rate"
            value={formatPct(m.match_rate_pct)}
            sub={`${m.matched_needs} matched`}
          />
        </div>

        {/* Trends */}
        {trend.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TrendBars trend={trend} field="needs" label="Needs posted" />
            <TrendBars trend={trend} field="offers" label="Offers sent" />
            <TrendBars trend={trend} field="matches" label="Matches" />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Notes: &ldquo;published&rdquo; = needs with public visibility (private
          wishlist rows excluded). Time-to-first-offer is measured from the
          need&apos;s creation time. All numbers computed live from
          requests/offers/deals — no separate tracking events.
        </p>
      </div>
    </main>
  );
}
