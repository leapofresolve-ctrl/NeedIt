import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The gate in front of /post, shared by the full page and the intercepted
 * panel so the two surfaces can never drift apart on who is allowed to post.
 *
 * Throws (via redirect) rather than returning a result — both call sites want
 * exactly the same behaviour, and a boolean would let one of them forget to
 * check it.
 */
export async function requirePostAccess(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.username) {
    redirect("/onboarding");
  }
}
