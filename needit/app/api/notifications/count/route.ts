import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The bell polls this for the unread count + a small preview of recent items.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return Response.json({ count: 0, items: [] });

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, type, request_id, read, created_at, requests(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const items = (
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
      title: req?.title ?? "a need",
    };
  });

  return Response.json({ count: count ?? 0, items });
}
