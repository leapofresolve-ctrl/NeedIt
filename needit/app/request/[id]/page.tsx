import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { OfferForm } from "@/components/offer/offer-form";

function formatMoney(cents: number | null) {
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
  const hours = Math.ceil(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

export default async function RequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, buyer_id, title, description, type, sport, budget_cents, condition_pref, image_url, status, expires_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!request) notFound();

  const isBuyer = request.buyer_id === userId;

  const { data: buyer } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", request.buyer_id)
    .maybeSingle();

  // Buyer sees the offers on their need (RLS restricts visibility to parties).
  let offers: Array<{
    id: string;
    seller_id: string;
    price_cents: number;
    condition: string | null;
    photo_url: string | null;
    note: string | null;
    status: string;
    sellerName: string;
  }> = [];

  if (isBuyer) {
    const { data: offerRows } = await supabase
      .from("offers")
      .select("id, seller_id, price_cents, condition, photo_url, note, status")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    const rows = offerRows ?? [];
    const sellerIds = [...new Set(rows.map((o) => o.seller_id))];
    let nameById: Record<string, string> = {};
    if (sellerIds.length) {
      const { data: sellers } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", sellerIds);
      nameById = Object.fromEntries(
        (sellers ?? []).map((s) => [s.id, s.username ?? "member"]),
      );
    }
    offers = rows.map((o) => ({
      ...o,
      sellerName: nameById[o.seller_id] ?? "member",
    }));
  }

  const left = timeLeft(request.expires_at);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-2xl flex flex-col gap-6 p-5">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to the board
        </Link>

        {/* Request details */}
        <div className="border rounded-lg p-5 flex flex-col gap-4">
          {request.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={request.image_url}
              alt=""
              className="w-full max-h-80 object-contain rounded-md bg-muted"
            />
          )}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight">
              {request.title}
            </h1>
            <span className="text-xl font-bold whitespace-nowrap">
              {formatMoney(request.budget_cents)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {request.type === "bulk" ? "Bulk lot" : "Single"}
            </Badge>
            {request.sport && <Badge variant="outline">{request.sport}</Badge>}
            {request.condition_pref && (
              <Badge variant="outline">{request.condition_pref}</Badge>
            )}
            {left && <Badge variant="outline">{left}</Badge>}
            {request.status !== "open" && (
              <Badge variant="secondary">{request.status}</Badge>
            )}
          </div>
          {request.description && (
            <p className="text-sm whitespace-pre-wrap">{request.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Posted by {buyer?.username ?? "member"}
          </p>
        </div>

        {/* Offer area */}
        {isBuyer ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              Offers ({offers.length})
            </h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg p-5">
                No offers yet. Sellers who can fill this will show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {offers.map((o) => (
                  <li key={o.id} className="border rounded-lg p-4 flex gap-4">
                    {o.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.photo_url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-md shrink-0"
                      />
                    )}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatMoney(o.price_cents)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          from {o.sellerName}
                        </span>
                        {o.status !== "pending" && (
                          <Badge variant="secondary">{o.status}</Badge>
                        )}
                      </div>
                      {o.condition && (
                        <span className="text-sm">Condition: {o.condition}</span>
                      )}
                      {o.note && (
                        <span className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {o.note}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Accepting an offer (and unlocking the match) is the next feature.
            </p>
          </section>
        ) : request.status === "open" ? (
          <OfferForm requestId={request.id} />
        ) : (
          <p className="text-sm text-muted-foreground border rounded-lg p-5">
            This need is no longer open for offers.
          </p>
        )}
      </div>
    </main>
  );
}
