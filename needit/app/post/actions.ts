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
  const visibility =
    (formData.get("visibility") ?? "public").toString() === "private"
      ? "private"
      : "public";

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

  // Private wants don't tick down — expiry starts when you publish to the board.
  const expiresAt =
    visibility === "private"
      ? null
      : new Date(
          Date.now() + (EXPIRY_HOURS[expiry] ?? 168) * 3_600_000,
        ).toISOString();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  // Optional reference photo.
  let imageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/"))
      return { error: "The attachment must be an image." };
    if (file.size > 8 * 1024 * 1024)
      return { error: "Image is too large (max 8MB)." };
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("request-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError)
      return { error: "Couldn't upload the image. Please try again." };
    imageUrl = supabase.storage.from("request-photos").getPublicUrl(path)
      .data.publicUrl;
  }

  const { error } = await supabase.from("requests").insert({
    buyer_id: userId,
    title,
    description: description || null,
    type,
    sport: sport || null,
    budget_cents: budgetCents,
    condition_pref: conditionPref || null,
    image_url: imageUrl,
    status: "open",
    visibility,
    expires_at: expiresAt,
  });

  if (error) return { error: "Couldn't post your need. Please try again." };

  // Private wants land on your own board; public ones go to the main board.
  if (visibility === "private") {
    const { data: me } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    redirect(me?.username ? `/u/${me.username}` : "/");
  }

  redirect("/");
}
