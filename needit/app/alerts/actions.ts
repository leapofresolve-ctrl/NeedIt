"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AlertState = { error?: string };

export async function createAlert(
  _prev: AlertState,
  formData: FormData,
): Promise<AlertState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Not signed in." };

  const keyword = (formData.get("keyword") ?? "").toString().trim();
  const sport = (formData.get("sport") ?? "").toString().trim();
  const type = (formData.get("type") ?? "").toString().trim();
  const minRaw = (formData.get("min") ?? "").toString().trim();
  const maxRaw = (formData.get("max") ?? "").toString().trim();

  if (!keyword && !sport && !type && !minRaw && !maxRaw) {
    return { error: "Set at least one criterion." };
  }
  if (type && type !== "single" && type !== "bulk") {
    return { error: "Type must be single or bulk." };
  }

  // Money as integer cents — never floats.
  const toCents = (raw: string): number | null | undefined => {
    if (!raw) return null;
    const dollars = Number(raw);
    if (!Number.isFinite(dollars) || dollars < 0) return undefined;
    return Math.round(dollars * 100);
  };
  const minCents = toCents(minRaw);
  const maxCents = toCents(maxRaw);
  if (minCents === undefined || maxCents === undefined) {
    return { error: "Budget must be a positive number." };
  }
  if (minCents != null && maxCents != null && minCents > maxCents) {
    return { error: "Min budget can't exceed max." };
  }

  const { error } = await supabase.from("demand_alerts").insert({
    seller_id: userId,
    keyword: keyword || null,
    sport: sport || null,
    type: type || null,
    min_budget_cents: minCents,
    max_budget_cents: maxCents,
  });
  if (error) return { error: error.message };

  revalidatePath("/alerts");
  return {};
}

export async function toggleAlert(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("demand_alerts").update({ active }).eq("id", id);
  revalidatePath("/alerts");
}

export async function deleteAlert(id: string) {
  const supabase = await createClient();
  await supabase.from("demand_alerts").delete().eq("id", id);
  revalidatePath("/alerts");
}
