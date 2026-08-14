import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateAlertForm } from "@/components/alerts/create-alert-form";
import { FREE_ALERT_LIMIT, DIGEST_CADENCE_COPY } from "@/lib/alerts";
import { toggleAlert, deleteAlert } from "./actions";

import { typeLabel } from "@/lib/board-filters";
type AlertRow = {
  id: string;
  keyword: string | null;
  sport: string | null;
  type: "single" | "bulk" | "sealed" | null;
  min_budget_cents: number | null;
  max_budget_cents: number | null;
  active: boolean;
  created_at: string;
};

function money(cents: number | null) {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function summarize(a: AlertRow) {
  const parts: string[] = [];
  if (a.keyword) parts.push(`“${a.keyword}”`);
  if (a.sport) parts.push(a.sport);
  if (a.type) parts.push(typeLabel(a.type));
  const min = money(a.min_budget_cents);
  const max = money(a.max_budget_cents);
  if (min && max) parts.push(`${min}–${max}`);
  else if (min) parts.push(`${min}+`);
  else if (max) parts.push(`up to ${max}`);
  return parts.join(" · ") || "Anything";
}

export default async function AlertsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!me?.username) redirect("/onboarding");

  const { data } = await supabase
    .from("demand_alerts")
    .select(
      "id, keyword, sport, type, min_budget_cents, max_budget_cents, active, created_at",
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  const alerts = (data ?? []) as AlertRow[];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-3xl flex flex-col gap-6 p-5">
        <div>
          <h1 className="text-2xl font-bold">Demand alerts</h1>
          {/* Say what the product actually does. The old copy promised "the
              moment a buyer posts", which stopped being true when the free
              tier moved to a periodic, deliberately vague nudge (0017). Copy
              that overpromises is how you teach people to ignore your email. */}
          <p className="text-sm text-muted-foreground">
            Tell us what you&apos;re holding and we&apos;ll flag matching demand
            in your notifications. We&apos;ll email you{" "}
            {DIGEST_CADENCE_COPY} to let you know there&apos;s something worth
            a look. Alerts are private — buyers never see them.
          </p>
        </div>

        <CreateAlertForm
          remaining={Math.max(0, FREE_ALERT_LIMIT - alerts.length)}
          limit={FREE_ALERT_LIMIT}
        />

        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-lg p-5">
            No alerts yet. Save one above — e.g. keyword &ldquo;Jordan&rdquo; +
            Basketball, or Bulk lots up to $500.
          </p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Your demand alerts">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="border rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium truncate">{summarize(a)}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Paused</Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={toggleAlert.bind(null, a.id, !a.active)}>
                    <Button type="submit" size="sm" variant="outline">
                      {a.active ? "Pause" : "Resume"}
                    </Button>
                  </form>
                  <form action={deleteAlert.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
