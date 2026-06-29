import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";

function formatMoney(cents: number | null) {
  if (cents == null) return "Open budget";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function CompletedDealsPage() {
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

  // Bought: your needs that matched.
  const { data: boughtData } = await supabase
    .from("requests")
    .select("id, title, budget_cents, created_at")
    .eq("buyer_id", userId)
    .eq("status", "matched")
    .order("created_at", { ascending: false });
  const bought = boughtData ?? [];

  // Sold: offers you made that were accepted.
  const { data: soldRaw } = await supabase
    .from("offers")
    .select("id, request_id, price_cents, current_price_cents, created_at, requests(title)")
    .eq("seller_id", userId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
  const sold = (
    (soldRaw ?? []) as Array<{
      id: string;
      request_id: string;
      price_cents: number;
      current_price_cents: number | null;
      requests: { title: string } | { title: string }[] | null;
    }>
  ).map((row) => {
    const req = Array.isArray(row.requests) ? row.requests[0] : row.requests;
    return {
      id: row.id,
      request_id: row.request_id,
      price: row.current_price_cents ?? row.price_cents,
      title: req?.title ?? "a need",
    };
  });

  const total = bought.length + sold.length;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-3xl flex flex-col gap-6 p-5">
        <Link
          href={`/u/${me.username}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to your profile
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Completed deals</h1>
          <p className="text-sm text-muted-foreground">
            {total} completed {total === 1 ? "deal" : "deals"}
          </p>
        </div>

        {total === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-lg p-5">
            No completed deals yet. Once you match on a need or a seller accepts
            your offer, it&apos;ll show up here.
          </p>
        ) : (
          <>
            {bought.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Bought</h2>
                <ul className="flex flex-col gap-3">
                  {bought.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/request/${r.id}`}
                        className="flex items-center justify-between gap-3 border rounded-lg p-4 hover:bg-accent transition-colors"
                      >
                        <span className="font-medium truncate">{r.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold">
                            {formatMoney(r.budget_cents)}
                          </span>
                          <Badge variant="default">Matched 🎉</Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {sold.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Sold</h2>
                <ul className="flex flex-col gap-3">
                  {sold.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/request/${o.request_id}`}
                        className="flex items-center justify-between gap-3 border rounded-lg p-4 hover:bg-accent transition-colors"
                      >
                        <span className="font-medium truncate">{o.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold">
                            {formatMoney(o.price)}
                          </span>
                          <Badge variant="default">Sold 🎉</Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
