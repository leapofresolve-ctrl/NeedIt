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
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default async function Home() {
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

  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, buyer_id, title, type, sport, budget_cents, condition_pref, image_url, expires_at, created_at",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

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

        {rows.length === 0 ? (
          <div className="border rounded-lg p-10 flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground">
              No open needs yet. Be the first to post one.
            </p>
            <Button asChild>
              <Link href="/post">Post a Need</Link>
            </Button>
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
