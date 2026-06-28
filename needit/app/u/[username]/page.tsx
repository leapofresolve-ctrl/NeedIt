import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publishNeed } from "./actions";

type RequestRow = {
  id: string;
  title: string;
  type: "single" | "bulk";
  sport: string | null;
  budget_cents: number | null;
  condition_pref: string | null;
  image_url: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
};

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
  const hours = Math.ceil(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

function NeedCard({
  r,
  offerCount,
  isPrivate,
  footer,
}: {
  r: RequestRow;
  offerCount?: number;
  isPrivate?: boolean;
  footer?: React.ReactNode;
}) {
  const left = timeLeft(r.expires_at);
  return (
    <li className="border rounded-lg p-4 hover:bg-accent transition-colors h-full flex flex-col">
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
          <h3 className="font-semibold leading-tight">{r.title}</h3>
          <span className="font-semibold whitespace-nowrap">
            {formatBudget(r.budget_cents)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {isPrivate && <Badge variant="default">Private</Badge>}
          <Badge variant="secondary">
            {r.type === "bulk" ? "Bulk lot" : "Single"}
          </Badge>
          {r.sport && <Badge variant="outline">{r.sport}</Badge>}
          {r.condition_pref && (
            <Badge variant="outline">{r.condition_pref}</Badge>
          )}
          {offerCount !== undefined && (
            <Badge variant={offerCount > 0 ? "default" : "outline"}>
              {offerCount} {offerCount === 1 ? "offer" : "offers"}
            </Badge>
          )}
          {!isPrivate && left && r.status === "open" && (
            <Badge variant="outline" className="ml-auto">
              {left}
            </Badge>
          )}
          {r.status !== "open" && (
            <Badge variant="secondary" className="ml-auto">
              {r.status}
            </Badge>
          )}
        </div>
      </Link>
      {footer}
    </li>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;
  if (!viewerId) redirect("/auth/login");

  // Viewer must be onboarded (have a username) to browse.
  const { data: viewer } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", viewerId)
    .maybeSingle();
  if (!viewer?.username) redirect("/onboarding");

  // Resolve the profile being viewed (case-insensitive exact match).
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
      "id, title, type, sport, budget_cents, condition_pref, image_url, status, expires_at, created_at",
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
  let pastNeeds: RequestRow[] = [];
  if (isOwner) {
    const { data: privateData } = await supabase
      .from("requests")
      .select(
        "id, title, type, sport, budget_cents, condition_pref, image_url, status, expires_at, created_at",
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

    const { data: pastData } = await supabase
      .from("requests")
      .select(
        "id, title, type, sport, budget_cents, condition_pref, image_url, status, expires_at, created_at",
      )
      .eq("buyer_id", profile.id)
      .neq("status", "open")
      .order("created_at", { ascending: false });
    pastNeeds = (pastData ?? []) as RequestRow[];
  }

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-5xl flex flex-col gap-6 p-5">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to the board
        </Link>

        {/* Profile header */}
        <div className="border rounded-lg p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold leading-tight">
              {profile.display_name?.trim() || profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
              {memberSince ? ` · member since ${memberSince}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {openNeeds.length} open{" "}
              {openNeeds.length === 1 ? "need" : "needs"}
            </p>
          </div>
          {isOwner && (
            <Button asChild>
              <Link href="/post">Post a Need</Link>
            </Button>
          )}
        </div>

        {/* Owner-only: private wants (your wishlist, not on the board yet) */}
        {isOwner && privateNeeds.length > 0 && (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold">Private wants</h2>
              <p className="text-sm text-muted-foreground">
                Only you can see these. Post one to the board when you&apos;re
                ready to take offers.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {privateNeeds.map((r) => (
                <NeedCard
                  key={r.id}
                  r={r}
                  isPrivate
                  footer={
                    <form
                      action={publishNeed}
                      className="flex items-end gap-2 mt-3"
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
                        className="flex h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="24h">24h</option>
                        <option value="3d">3 days</option>
                        <option value="7d">7 days</option>
                      </select>
                      <Button type="submit" size="sm">
                        Post to board
                      </Button>
                    </form>
                  }
                />
              ))}
            </ul>
          </section>
        )}

        {/* Want board */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            {isOwner
              ? "Your want board"
              : `${profile.username}'s want board`}
          </h2>
          {openNeeds.length === 0 ? (
            <div className="border rounded-lg p-10 flex flex-col items-center gap-3 text-center">
              <p className="text-muted-foreground">
                {isOwner
                  ? "You have no open needs yet."
                  : "No open needs right now."}
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href="/post">Post your first Need</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {openNeeds.map((r) => (
                <NeedCard
                  key={r.id}
                  r={r}
                  offerCount={isOwner ? offerCountByReq[r.id] ?? 0 : undefined}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Owner-only: matched & closed history */}
        {isOwner && pastNeeds.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Matched &amp; closed</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {pastNeeds.map((r) => (
                <NeedCard key={r.id} r={r} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
