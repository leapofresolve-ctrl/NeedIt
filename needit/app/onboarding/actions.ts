"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UsernameState = { error?: string };

export async function setUsername(
  _prev: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const raw = (formData.get("username") ?? "").toString().trim();

  if (!raw) return { error: "Please enter a username." };
  if (raw.length < 3 || raw.length > 20)
    return { error: "Username must be 3–20 characters." };
  if (!/^[a-zA-Z0-9_]+$/.test(raw))
    return { error: "Use only letters, numbers, and underscores." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  // Case-insensitive uniqueness check (escape LIKE wildcards so they match literally).
  const pattern = raw.replace(/[%_]/g, "\\$&");
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", pattern)
    .neq("id", userId)
    .maybeSingle();

  if (existing) return { error: "That username is taken. Try another." };

  // Upsert (not update): if this account has no profile row yet — e.g. the
  // signup trigger didn't fire — an UPDATE would silently match 0 rows and the
  // app would bounce back to onboarding forever. Upsert creates the row if
  // missing. We .select() so we can tell whether a row was actually written.
  const { data: saved, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username: raw }, { onConflict: "id" })
    .select("id");

  if (error) {
    if (error.code === "23505")
      return { error: "That username is taken. Try another." };
    // Surface the real reason instead of looping silently.
    return { error: `Couldn't save your username: ${error.message}` };
  }

  if (!saved || saved.length === 0) {
    return {
      error:
        "Your account has no profile row and the app couldn't create one — this is usually a database permission (RLS) setting. Tell your setup assistant you saw this message.",
    };
  }

  redirect("/");
}
