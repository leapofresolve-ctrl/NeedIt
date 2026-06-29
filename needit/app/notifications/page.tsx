import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { MarkReadOnView } from "@/components/notifications/mark-read-on-view";

type NotificationRow = {
  id: string;
  type: string;
  request_id: string | null;
  read: boolean;
  created_at: string;
  requestTitle: string;
};

function describe(type: string) {
  switch (type) {
    case "new_offer":
      return "New offer";
    case "counter":
      return "Your move — counter waiting";
    case "accepted":
      return "Offer accepted 🎉";
    case "declined":
      return "Offer declined";
    default:
      return "Update";
  }
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function NotificationsPage() {
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

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, request_id, read, created_at, requests(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications: NotificationRow[] = (
    (rows ?? []) as Array<{
      id: string;
      type: string;
      request_id: string | null;
      read: boolean;
      created_at: string;
      requests: { title: string } | { title: string }[] | null;
    }>
  ).map((n) => {
    const req = Array.isArray(n.requests) ? n.requests[0] : n.requests;
    return {
      id: n.id,
      type: n.type,
      request_id: n.request_id,
      read: n.read,
      created_at: n.created_at,
      requestTitle: req?.title ?? "a need",
    };
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <MarkReadOnView hasUnread={hasUnread} />
      <div className="w-full max-w-2xl flex flex-col gap-6 p-5">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to the board
        </Link>

        <h1 className="text-2xl font-bold">Notifications</h1>

        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-lg p-5">
            Nothing yet. Offers, counters, and matches will show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((n) => {
              const body = (
                <div
                  className={`flex items-center justify-between gap-3 border rounded-lg p-4 ${
                    n.read ? "" : "bg-accent"
                  } ${n.request_id ? "hover:bg-accent transition-colors" : ""}`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium">{describe(n.type)}</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {n.requestTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read && <Badge variant="default">New</Badge>}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.request_id ? (
                    <Link href={`/request/${n.request_id}`}>{body}</Link>
                  ) : (
                    body
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
