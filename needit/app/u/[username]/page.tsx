import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/exchange/countdown";
import { publishNeed } from "./actions";
import { conditionChip, tagLabel } from "@/lib/need-tags";

type RequestRow = {
  id: string;
  title: string;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  price_mode: string | null;
  condition_pref: string | null;
  grade_min: string | null;
  tags: string[] | null;
  image_url: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
};

type YourOffer = {
  id: string;
  request_id: string;
  live: number;
  counter_by: "buyer" | "seller" | null;
  status: string;
  requestTitle: string;
  requestStatus: string;
};

type DemandAlert = {
  id: string;
  keyword: string | null;
  sport: string | null;
  type: "single" | "bulk" | null;
  min_budget_cents: number | null;
  max_budget_cents: number | null;
  active: boolean;
};

function summarizeAlert(a: DemandAlert) {
  const parts: string[] = [];
  if (a.keyword) parts.push(`“${a.keyword}”`);
  if (a.sport) parts.push(a.sport);
  if (a.type) parts.push(a.type === "bulk" ? "Bulk lots" : "Singles");
  const money = (c: number) =>
    `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (a.min_budget_cents != null && a.max_budget_cents != null)
    parts.push(`${money(a.min_budget_cents)}–${money(a.max_budget_cents)}`);
  else if (a.min_budget_cents != null) parts.push(`${money(a.min_budget_cents)}+`);
  else if (a.max_budget_cents != null)
    parts.push(`up to ${money(a.max_budget_cents)}`);
  return parts.join(" · ") || "Anything";
}

/**
 * The price anchor. A comp need names no number by definition — it renders the
 * words in the same slot at the same weight, because the anchor is what the
 * eye lands on and it must not go missing. Offers on this page are always
 * real amounts, so they keep the plain currency path.
 */
function formatBudget(cents: number | null) {
  if (cents == null) return "Open";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatAnchor(priceMode: string | null, cents: number | null) {
  return priceMode === "comp" ? "At comp" : formatBudget(cents);
}

/* Micro-label section header: mono, uppercase, restrained (3b). */
function SectionHead({
  label,
  sub,
  action,
}: {
  label: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="microlabel text-[11px] font-bold text-foreground">
          {label}
        </h2>
        {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* Type + attribute chips, shared by dark and light surfaces. */
function Chips({
  r,
  dark,
}: {
  r: Pick<
    RequestRow,
    "type" | "sport" | "condition_pref" | "grade_min" | "tags"
  >;
  dark?: boolean;
}) {
  // Wording comes from lib/need-tags so the profile can never say "graded"
  // where the board says "Graded · PSA 9+". Tags truncate at 2 like the board.
  const condition = conditionChip(r.condition_pref, r.grade_min);
  const tags = r.tags ?? [];
  const shownTags = tags.slice(0, 2);
  const hiddenTags = tags.length - shownTags.length;
  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
      {r.type === "bulk" ? (
        <span
          className={`num text-[9px] font-bold uppercase tracking-[0.08em] rounded-sm px-1.5 py-0.5 shrink-0 ${
            dark ? "bg-[#1E2A24] text-live" : "bg-secondary text-primary-deep"
          }`}
        >
          Bulk
        </span>
      ) : (
        <span
          className={`num text-[9px] font-bold uppercase tracking-[0.08em] border rounded-sm px-1.5 py-0.5 shrink-0 ${
            dark
              ? "border-[hsl(var(--primary-live))] text-live"
              : "border-[hsl(var(--primary-deep))] text-primary-deep"
          }`}
        >
          Single
        </span>
      )}
      {[r.sport, condition].filter(Boolean).map((chip) => (
        <span
          key={chip as string}
          className={`num text-[9px] uppercase tracking-[0.08em] border rounded-sm px-1.5 py-0.5 shrink-0 ${
            dark
              ? "text-board-muted border-board"
              : "text-muted-foreground border-border"
          }`}
        >
          {chip}
        </span>
      ))}
      {shownTags.map((slug) => (
        <span
          key={slug}
          className={`num text-[9px] font-medium uppercase tracking-[0.08em] rounded-sm px-1.5 py-0.5 shrink-0 ${
            dark ? "bg-[#1E2A24] text-live" : "bg-secondary text-primary-deep"
          }`}
        >
          {tagLabel(slug)}
        </span>
      ))}
      {hiddenTags > 0 && (
        <span
          className={`num text-[9px] uppercase tracking-[0.08em] rounded-sm px-1.5 py-0.5 shrink-0 ${
            dark ? "text-board-faint" : "text-muted-foreground"
          }`}
        >
          +{hiddenTags}
        </span>
      )}
    </div>
  );
}

/* Dark want-board card — the profile's slice of the live board (3a). */
function BoardCard({
  r,
  offerCount,
}: {
  r: RequestRow;
  offerCount?: number;
}) {
  const msLeft = r.expires_at
    ? new Date(r.expires_at).getTime() - Date.now()
    : null;
  const urgentNow = msLeft != null && msLeft > 0 && msLeft < 12 * 3_600_000;
  const noOffers = offerCount === 0;

  const card = (
    <Link
      href={`/request/${r.id}`}
      className="flex flex-col h-full p-3.5 transition-[background-color,box-shadow] duration-150 hover:bg-[rgba(46,217,138,0.06)] hover:shadow-[inset_0_0_0_1px_hsl(var(--primary-live))] active:bg-[rgba(46,217,138,0.14)]"
    >
      {r.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.image_url}
          alt=""
          className="w-full h-32 object-cover rounded-sm mb-3 border border-hairline"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <Chips r={r} dark />
        {offerCount !== undefined && (
          <span
            className={`num text-[10.5px] shrink-0 ${
              noOffers || offerCount >= 5 ? "text-live" : "text-board-secondary"
            }`}
          >
            {noOffers
              ? "no offers"
              : `${offerCount} offer${offerCount === 1 ? "" : "s"}`}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-[14.5px] leading-[1.3] text-board-fg line-clamp-2">
        {r.title}
      </h3>
      <div className="mt-auto pt-3 flex items-end justify-between gap-2">
        <span className="num text-lg font-semibold text-live leading-none uppercase">
          {formatAnchor(r.price_mode, r.budget_cents)}
          {r.price_mode !== "comp" && r.budget_cents != null && (
            <span className="text-[9px] font-normal text-board-muted ml-1 normal-case">
              max
            </span>
          )}
        </span>
        <Countdown expiresAt={r.expires_at} />
      </div>
    </Link>
  );

  if (urgentNow) {
    return (
      <li className="relative h-full">
        <span aria-hidden className="notch-fill" />
        <div className="notched border border-warn bg-board-card rounded-sm h-full">
          {card}
        </div>
      </li>
    );
  }
  return (
    <li className="notched bg-board-card border border-board rounded-sm h-full">
      {card}
    </li>
  );
}

/* Light row — history + private wants live on platform chrome, not the board. */
function LightRow({
  r,
  right,
  footer,
}: {
  r: RequestRow;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <li className="bg-card border rounded-sm">
      <Link
        href={`/request/${r.id}`}
        className="flex items-center gap-3 p-3.5 hover:bg-accent transition-colors"
      >
        {r.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.image_url}
            alt=""
            className="w-12 h-12 object-cover rounded-sm border shrink-0"
          />
        )}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span className="font-semibold text-[14.5px] leading-[1.3] line-clamp-1">
            {r.title}
          </span>
          <Chips r={r} />
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="num text-[15px] font-semibold text-primary-deep leading-none">
            {formatAnchor(r.price_mode, r.budget_cents)}
          </span>
          {right}
        </div>
      </Link>
      {footer && <div className="px-3.5 pb-3.5">{footer}</div>}
    </li>
  );
}

const PAGE_SIZES = [10, 25, 50];

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ hsize?: string; hpage?: string }>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const hsize = PAGE_SIZES.includes(Number(sp.hsize)) ? Number(sp.hsize) : 10;
  const hpage = Math.max(1, Number(sp.hpage) || 1);
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;

  // Jul 29 (3b §3.1): public wants are public. A logged-out visitor sees a
  // member's open public needs and nothing else — no private wants, no offers,
  // no owner tools. Which columns anon may even read is enforced in the
  // database by column privileges, not here (migration 0015).
  if (viewerId) {
    // Viewer must be onboarded (have a username) to browse.
    const { data: viewer } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", viewerId)
      .maybeSingle();
    if (!viewer?.username) redirect("/onboarding");
  }

  // Resolve the profile being viewed (case-insensitive exact match). For anon
  // this returns nothing when the member has switched `profile_public` off —
  // the RLS policy filters the row out, so an opted-out profile is a 404 to a
  // stranger and unchanged for members.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, created_at")
    .ilike("username", username)
    .maybeSingle();
  if (!profile?.username) notFound();

  const isOwner = profile.id === viewerId;

  // The want board: this user's open, PUBLIC needs (private wants never show here).
  const { data: openData } = await supabase
    .from("requests")
    .select(
      "id, title, type, sport, budget_cents, price_mode, condition_pref, grade_min, tags, image_url, status, expires_at, created_at",
    )
    .eq("buyer_id", profile.id)
    .eq("status", "open")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  const openNeeds = (openData ?? []) as RequestRow[];

  // Owner-only: offer counts, private wants, and a matched/closed section.
  // RLS lets the buyer read offers on their own requests, so counts are safe here.
  const offerCountByReq: Record<string, number> = {};
  let privateNeeds: RequestRow[] = [];
  let historyNeeds: RequestRow[] = [];
  let historyCount = 0;
  let yourOffers: YourOffer[] = [];
  let demandAlerts: DemandAlert[] = [];
  if (isOwner) {
    // Offers this user has SENT (as a seller) — incl. counters waiting on them.
    // Only ACTIVE offers belong here — matched/declined live in history & completed deals.
    const { data: sentData } = await supabase
      .from("offers")
      .select(
        "id, request_id, price_cents, current_price_cents, counter_by, status, created_at, requests(title, status)",
      )
      .eq("seller_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    yourOffers = (
      (sentData ?? []) as Array<{
        id: string;
        request_id: string;
        price_cents: number;
        current_price_cents: number | null;
        counter_by: "buyer" | "seller" | null;
        status: string;
        requests:
          | { title: string; status: string }
          | { title: string; status: string }[]
          | null;
      }>
    ).map((row) => {
      const req = Array.isArray(row.requests) ? row.requests[0] : row.requests;
      return {
        id: row.id,
        request_id: row.request_id,
        live: row.current_price_cents ?? row.price_cents,
        counter_by: row.counter_by,
        status: row.status,
        requestTitle: req?.title ?? "a need",
        requestStatus: req?.status ?? "open",
      };
    });

    const { data: privateData } = await supabase
      .from("requests")
      .select(
        "id, title, type, sport, budget_cents, price_mode, condition_pref, grade_min, tags, image_url, status, expires_at, created_at",
      )
      .eq("buyer_id", profile.id)
      .eq("status", "open")
      .eq("visibility", "private")
      .order("created_at", { ascending: false });
    privateNeeds = (privateData ?? []) as RequestRow[];

    const openIds = openNeeds.map((r) => r.id);
    if (openIds.length) {
      const { data: offerRows } = await supabase
        .from("offers")
        .select("request_id")
        .in("request_id", openIds);
      for (const o of offerRows ?? []) {
        offerCountByReq[o.request_id] = (offerCountByReq[o.request_id] ?? 0) + 1;
      }
    }

    // Full history (every past need) → paginated running log at the bottom.
    const from = (hpage - 1) * hsize;
    const { data: historyData, count } = await supabase
      .from("requests")
      .select(
        "id, title, type, sport, budget_cents, price_mode, condition_pref, grade_min, tags, image_url, status, expires_at, created_at",
        { count: "exact" },
      )
      .eq("buyer_id", profile.id)
      .neq("status", "open")
      .order("created_at", { ascending: false })
      .range(from, from + hsize - 1);
    historyNeeds = (historyData ?? []) as RequestRow[];
    historyCount = count ?? 0;

    // Seller side: your saved demand alerts (own rows only via RLS).
    const { data: alertData } = await supabase
      .from("demand_alerts")
      .select(
        "id, keyword, sport, type, min_budget_cents, max_budget_cents, active",
      )
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false });
    demandAlerts = (alertData ?? []) as DemandAlert[];
  }

  const totalHistoryPages = Math.max(1, Math.ceil(historyCount / hsize));

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-5xl flex flex-col gap-7 p-5">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline self-start"
        >
          ← Back to the board
        </Link>

        {/* Profile header — light platform chrome, ink CTA, green as data only */}
        <div className="bg-card border rounded-sm p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-[-0.02em] leading-tight">
              {profile.display_name?.trim() || profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
              {memberSince ? ` · member since ${memberSince}` : ""}
            </p>
            <p className="num text-xs text-muted-foreground mt-1.5">
              <span className="font-semibold text-primary-deep">
                {openNeeds.length}
              </span>{" "}
              open {openNeeds.length === 1 ? "need" : "needs"}
              {isOwner && (
                <>
                  {" · "}
                  <span className="font-semibold text-primary-deep">
                    {yourOffers.length}
                  </span>{" "}
                  {yourOffers.length === 1 ? "offer" : "offers"} in play
                </>
              )}
            </p>
          </div>
          {isOwner && (
            <Button asChild>
              {/* scroll={false} — see the note in site-header.tsx. */}
              <Link href="/post" scroll={false}>
                Post a need
              </Link>
            </Button>
          )}
        </div>

        {/* THE WANT BOARD — this profile's slice of the live board (3a dark) */}
        <section className="notched bg-board border border-board rounded-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-hairline">
            <h2 className="microlabel text-[11px] font-bold text-board-fg">
              {isOwner ? "Your want board" : `${profile.username}'s want board`}
            </h2>
            <span className="num text-xs text-live flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-live" aria-hidden />
              {openNeeds.length} open
            </span>
          </div>
          {openNeeds.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-board-muted">
                {isOwner
                  ? "Nothing on your board. Post a need and let sellers hunt for you."
                  : "No open needs right now."}
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href="/post" scroll={false}>
                    Post your first need
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 p-3">
              {openNeeds.map((r) => (
                <BoardCard
                  key={r.id}
                  r={r}
                  offerCount={isOwner ? offerCountByReq[r.id] ?? 0 : undefined}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Owner-only: offers you've sent (as a seller), incl. counters waiting on you */}
        {isOwner && yourOffers.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHead
              label="Your offers"
              sub="Active offers you've sent. Completed ones move to your history."
            />
            <ul className="flex flex-col gap-2">
              {yourOffers.map((o) => {
                const open = o.requestStatus === "open";
                const yourMove =
                  open && o.status === "pending" && o.counter_by === "buyer";
                const waiting =
                  open && o.status === "pending" && o.counter_by !== "buyer";
                return (
                  <li key={o.id}>
                    <Link
                      href={`/request/${o.request_id}`}
                      className="flex items-center justify-between gap-3 bg-card border rounded-sm p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium text-[14.5px] truncate">
                          {o.requestTitle}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Your offer:{" "}
                          <span className="num font-semibold text-primary-deep">
                            {formatBudget(o.live)}
                          </span>
                        </span>
                      </div>
                      {o.status === "accepted" ? (
                        <Badge variant="default">Matched</Badge>
                      ) : o.status === "declined" ? (
                        <Badge variant="secondary">Declined</Badge>
                      ) : !open ? (
                        <Badge variant="secondary">Closed</Badge>
                      ) : yourMove ? (
                        <span className="num text-[10px] font-bold uppercase tracking-[0.08em] text-warn border border-warn rounded-sm px-2 py-1 shrink-0">
                          Your move
                        </span>
                      ) : waiting ? (
                        <span className="num text-[10px] uppercase tracking-[0.08em] text-muted-foreground border rounded-sm px-2 py-1 shrink-0">
                          Waiting on buyer
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Owner-only: your demand alerts (seller side — what you're hunting for) */}
        {isOwner && (
          <section className="flex flex-col gap-3">
            <SectionHead
              label="Demand alerts"
              sub="What you're watching for. You're notified the moment a matching need hits the board. Only you see these."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/alerts">
                    {demandAlerts.length > 0 ? "Manage" : "Create one"}
                  </Link>
                </Button>
              }
            />
            {demandAlerts.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {demandAlerts.map((a) => (
                  <li key={a.id}>
                    <Link href="/alerts">
                      <span
                        className={`inline-block text-xs border rounded-full px-3 py-1 transition-colors hover:bg-accent ${
                          a.active
                            ? "border-[hsl(var(--primary-deep))] text-primary-deep"
                            : "text-muted-foreground"
                        }`}
                      >
                        {summarizeAlert(a)}
                        {!a.active && " (paused)"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Owner-only: private wants (your wishlist, not on the board yet) */}
        {isOwner && privateNeeds.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHead
              label="Private wants"
              sub="Only you can see these. Post one to the board when you're ready to take offers."
            />
            <ul className="flex flex-col gap-2">
              {privateNeeds.map((r) => (
                <LightRow
                  key={r.id}
                  r={r}
                  right={
                    <span className="num text-[9px] uppercase tracking-[0.08em] text-muted-foreground border rounded-sm px-1.5 py-0.5">
                      Private
                    </span>
                  }
                  footer={
                    <div className="flex flex-wrap items-end gap-2 pt-3 border-t">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/request/${r.id}/edit`}>Edit</Link>
                      </Button>
                      <form
                        action={publishNeed}
                        className="flex items-end gap-2 ml-auto"
                      >
                        <input type="hidden" name="request_id" value={r.id} />
                        <input
                          type="hidden"
                          name="username"
                          value={profile.username ?? ""}
                        />
                        <select
                          name="expiry"
                          defaultValue="7d"
                          aria-label="Expires in"
                          className="flex h-9 rounded-sm border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="24h">24h</option>
                          <option value="3d">3 days</option>
                          <option value="7d">7 days</option>
                        </select>
                        <Button type="submit" size="sm">
                          Post to board
                        </Button>
                      </form>
                    </div>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {/* Owner-only: running history log (paginated; full-width rows, controls at bottom) */}
        {isOwner && (
          <section id="history" className="flex flex-col gap-3 scroll-mt-20">
            <SectionHead
              label="History"
              sub={`${historyCount} past ${
                historyCount === 1 ? "transaction" : "transactions"
              }`}
            />

            {historyCount === 0 ? (
              <p className="text-sm text-muted-foreground bg-card border rounded-sm p-5">
                No past transactions yet.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2 w-full">
                  {historyNeeds.map((r) => (
                    <LightRow
                      key={r.id}
                      r={r}
                      right={
                        <span className="num text-[9px] uppercase tracking-[0.08em] text-muted-foreground border rounded-sm px-1.5 py-0.5 capitalize">
                          {r.status}
                        </span>
                      }
                    />
                  ))}
                </ul>

                {/* Controls at the bottom: page size + arrows */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground mr-1">Show</span>
                    {PAGE_SIZES.map((size) => (
                      <Link
                        key={size}
                        href={`/u/${profile.username}?hsize=${size}&hpage=1#history`}
                        className={`num px-2 py-1 rounded-sm border text-xs ${
                          size === hsize
                            ? "bg-cta text-cta-foreground border-transparent"
                            : "hover:bg-accent"
                        }`}
                      >
                        {size}
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {hpage > 1 ? (
                      <Button asChild variant="outline" size="sm" aria-label="Previous page">
                        <Link
                          href={`/u/${profile.username}?hsize=${hsize}&hpage=${hpage - 1}#history`}
                        >
                          ←
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled aria-label="Previous page">
                        ←
                      </Button>
                    )}
                    <span className="num text-xs text-muted-foreground whitespace-nowrap">
                      Page {hpage} of {totalHistoryPages}
                    </span>
                    {hpage < totalHistoryPages ? (
                      <Button asChild variant="outline" size="sm" aria-label="Next page">
                        <Link
                          href={`/u/${profile.username}?hsize=${hsize}&hpage=${hpage + 1}#history`}
                        >
                          →
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled aria-label="Next page">
                        →
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
