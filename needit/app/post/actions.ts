"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type PostNeedState = { error?: string };

const EXPIRY_HOURS: Record<string, number> = {
  "24h": 24,
  "3d": 72,
  "7d": 168,
};

export async function createNeed(
  _prev: PostNeedState,
  formData: FormData,
): Promise<PostNeedState> {
  const title = (formData.get("title") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const type = (formData.get("type") ?? "single").toString();
  const sport = (formData.get("sport") ?? "").toString().trim();
  const conditionPref = (formData.get("condition_pref") ?? "").toString().trim();
  const budgetRaw = (formData.get("budget") ?? "").toString().trim();
  const expiry = (formData.get("expiry") ?? "7d").toString();

  if (!title) return { error: "Please give your need a title." };
  if (type !== "single" && type !== "bulk")
    return { error: "Pick single or bulk." };

  // Money as integer cents — never store floats.
  let budgetCents: number | null = null;
  if (budgetRaw) {
    const dollars = Number(budgetRaw);
    if (!Number.isFinite(dollars) || dollars < 0)
      return { error: "Budget must be a positive number." };
    budgetCents = Math.round(dollars * 100);
  }

  const hours = EXPIRY_HOURS[expiry] ?? 168;
  const expiresAt = new Date(Date.now() + hours * 3_600_000).toISOString();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { error } = await supabase.from("requests").insert({
    buyer_id: userId,
    title,
    description: description || null,
    type,
    sport: sport || null,
    budget_cents: budgetCents,
    condition_pref: conditionPref || null,
    status: "open",
    expires_at: expiresAt,
  });

  if (error) return { error: "Couldn't post your need. Please try again." };

  redirect("/");
}
