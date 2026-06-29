import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lightweight endpoint the bell polls for the current user's unread count.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return Response.json({ count: 0 });

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return Response.json({ count: count ?? 0 });
}
