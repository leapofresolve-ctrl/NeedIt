import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { OfferForm } from "@/components/offer/offer-form";
import { CounterForm } from "@/components/offer/counter-form";
import { Button } from "@/components/ui/button";
import { acceptOffer, declineOffer } from "./actions";

const COUNTER_LIMIT = 10;

type OfferRow = {
  id: string;
  seller_id: string;
  price_cents: number;
  current_price_cents: number | null;
  counter_by: "buyer" | "seller" | null;
  counter_round: number | null;
  condition: string | null;
  photo_url: string | null;
  note: string | null;
  status: string;
  sellerName: string;
};

const OFFER_SELECT =
  "id, seller_id, price_cents, current_price_cents, counter_by, counter_round, condition, photo_url, note, status";

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

// Who can act next = the party who did NOT make the last move.
function turnFor(counterBy: OfferRow["counter_by"]) {
  return counterBy === "buyer" ? "seller" : "buyer";
}

function describeLastMove(
  counterBy: OfferRow["counter_by"],
  viewerIsBuyer: boolean,
) {
  if (counterBy == null) return viewerIsBuyer ? "Seller's offer" : "Your offer";
  if (counterBy === "buyer")
    return viewerIsBuyer ? "You countered" : "Buyer countered";
  return viewerIsBuyer ? "Seller countered" : "You countered";
}

function OfferBody({
  o,
  viewerIsBuyer,
}: {
  o: OfferRow;
  viewerIsBuyer: boolean;
}) {
  const live = o.current_price_cents ?? o.price_cents;
  const round = o.counter_round ?? 0;
  const remaining = Math.max(0, COUNTER_LIMIT - round);
  return (
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-lg">{formatMoney(live)}</span>
        {round > 0 && live !== o.price_cents && (
          <span className="text-xs text-muted-foreground">
            opened at {formatMoney(o.price_cents)}
          </span>
        )}
        {o.status === "pending" ? (
          <Badge variant={remaining === 0 ? "secondary" : "outline"}>
            {remaining === 0
              ? "No counters left"
              : `${remaining} ${remaining === 1 ? "counter" : "counters"} left`}
          </Badge>
        ) : (
          <Badge variant="secondary">{o.status}</Badge>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {describeLastMove(o.counter_by, viewerIsBuyer)}
        {round > 0 ? ` · round ${round} of ${COUNTER_LIMIT}` : ""}
        {viewerIsBuyer ? ` · from ${o.sellerName}` : ""}
      </span>
      {o.condition && <span className="text-sm">Condition: {o.condition}</span>}
      {o.note && (
        <span className="text-sm text-muted-foreground whitespace-pre-wrap">
          {o.note}
        </span>
      )}
    </div>
  );
}

function OfferActions({ o, requestId }: { o: OfferRow; requestId: string }) {
  const atLimit = (o.counter_round ?? 0) >= COUNTER_LIMIT;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <form action={acceptOffer}>
        <input type="hidden" name="offer_id" value={o.id} />
        <input type="hidden" name="request_id" value={requestId} />
        <Button type="submit" size="sm">
          Accept {formatMoney(o.current_price_cents ?? o.price_cents)}
        </Button>
      </form>
      {!atLimit && <CounterForm offerId={o.id} requestId={requestId} />}
      <form action={declineOffer}>
        <input type="hidden" name="offer_id" value={o.id} />
        <input type="hidden" name="request_id" value={requestId} />
        <Button type="submit" size="sm" variant="ghost">
          Decline
        </Button>
      </form>
    </div>
  );
}

function OfferListItem({
  o,
  requestId,
  viewerIsBuyer,
  requestOpen,
}: {
  o: OfferRow;
  requestId: string;
  viewerIsBuyer: boolean;
  requestOpen: boolean;
}) {
  const myRole = viewerIsBuyer ? "buyer" : "seller";
  const myTurn =
    requestOpen && o.status === "pending" && turnFor(o.counter_by) === myRole;
  const waiting =
    requestOpen && o.status === "pending" && turnFor(o.counter_by) !== myRole;
  return (
    <li className="border rounded-lg p-4 flex gap-4">
      {o.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={o.photo_url}
          alt=""
          className="w-20 h-20 object-cover rounded-md shrink-0"
        />
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <OfferBody o={o} viewerIsBuyer={viewerIsBuyer} />
        {myTurn && <OfferActions o={o} requestId={requestId} />}
        {waiting && (
          <p className="text-xs text-muted-foreground mt-2">
            {viewerIsBuyer
              ? `Waiting on ${o.sellerName} to respond to your counter.`
              : "Waiting on the buyer to respond."}
          </p>
        )}
      </div>
    </li>
  );
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
  const requestOpen = request.status === "open";

  const { data: buyer } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", request.buyer_id)
    .maybeSingle();

  // Fetch offers: the buyer sees all; a seller sees only their own.
  let offerQuery = supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("request_id", id)
    .order("created_at", { ascending: false });
  if (!isBuyer) offerQuery = offerQuery.eq("seller_id", userId);
  const { data: offerRows } = await offerQuery;
  const baseOffers = (offerRows ?? []) as Omit<OfferRow, "sellerName">[];

  // Attach seller usernames.
  const sellerIds = [...new Set(baseOffers.map((o) => o.seller_id))];
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
  const offers: OfferRow[] = baseOffers.map((o) => ({
    ...o,
    sellerName: nameById[o.seller_id] ?? "member",
  }));

  const accepted = offers.find((o) => o.status === "accepted") ?? null;
  const sellerHasActive = offers.some((o) => o.status === "pending");
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
            <h1 className="text-2xl font-bold leading-tight">{request.title}</h1>
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
            Posted by{" "}
            {buyer?.username ? (
              <Link
                href={`/u/${buyer.username}`}
                className="font-medium hover:underline"
              >
                {buyer.username}
              </Link>
            ) : (
              "member"
            )}
          </p>
        </div>

        {/* ===== Buyer view ===== */}
        {isBuyer && (
          <section className="flex flex-col gap-4">
            {request.status === "matched" && accepted && (
              <div className="border rounded-lg p-5 bg-accent">
                <h2 className="text-xl font-bold">It&apos;s a match! 🎉</h2>
                <p className="text-sm mt-1">
                  You accepted {formatMoney(accepted.price_cents)} from{" "}
                  <strong>{accepted.sellerName}</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Payments &amp; shipping are coming soon — for now, coordinate
                  your first deals directly.
                </p>
              </div>
            )}

            <h2 className="text-lg font-semibold">Offers ({offers.length})</h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg p-5">
                No offers yet. Sellers who can fill this will show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {offers.map((o) => (
                  <OfferListItem
                    key={o.id}
                    o={o}
                    requestId={request.id}
                    viewerIsBuyer={true}
                    requestOpen={requestOpen}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ===== Seller view ===== */}
        {!isBuyer && accepted && (
          <div className="border rounded-lg p-5 bg-accent">
            <h2 className="text-xl font-bold">It&apos;s a match! 🎉</h2>
            <p className="text-sm mt-1">
              {buyer?.username ?? "The buyer"} accepted your offer at{" "}
              <strong>{formatMoney(accepted.price_cents)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Payments &amp; shipping are coming soon — coordinate your first
              deals directly.
            </p>
          </div>
        )}

        {!isBuyer && !accepted && (
          <section className="flex flex-col gap-4">
            {offers.length > 0 && (
              <>
                <h2 className="text-lg font-semibold">Your offer</h2>
                <ul className="flex flex-col gap-3">
                  {offers.map((o) => (
                    <OfferListItem
                      key={o.id}
                      o={o}
                      requestId={request.id}
                      viewerIsBuyer={false}
                      requestOpen={requestOpen}
                    />
                  ))}
                </ul>
              </>
            )}

            {requestOpen && !sellerHasActive && (
              <OfferForm requestId={request.id} />
            )}

            {!requestOpen && (
              <p className="text-sm text-muted-foreground border rounded-lg p-5">
                This need is no longer open for offers.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
