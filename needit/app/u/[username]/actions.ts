"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const EXPIRY_HOURS: Record<string, number> = {
  "24h": 24,
  "3d": 72,
  "7d": 168,
};

// Publish a private want to the board ("put the call out").
// Expiry starts now, since this is when sellers first see it.
export async function publishNeed(formData: FormData) {
  const requestId = (formData.get("request_id") ?? "").toString();
  const username = (formData.get("username") ?? "").toString();
  const expiry = (formData.get("expiry") ?? "7d").toString();
  if (!requestId) return;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return;

  const expiresAt = new Date(
    Date.now() + (EXPIRY_HOURS[expiry] ?? 168) * 3_600_000,
  ).toISOString();

  // Owner + private guard (RLS also enforces buyer-only updates).
  await supabase
    .from("requests")
    .update({ visibility: "public", expires_at: expiresAt })
    .eq("id", requestId)
    .eq("buyer_id", userId)
    .eq("visibility", "private");

  revalidatePath(`/u/${username}`);
  revalidatePath("/");
}
