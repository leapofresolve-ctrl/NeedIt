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

  const { error } = await supabase
    .from("profiles")
    .update({ username: raw })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505")
      return { error: "That username is taken. Try another." };
    return { error: "Couldn't save your username. Please try again." };
  }

  redirect("/");
}
