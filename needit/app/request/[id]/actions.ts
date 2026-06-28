"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type OfferState = { error?: string; success?: boolean };

export type EditNeedState = { error?: string };

// Edit a PRIVATE want before it goes public. Public/live needs aren't editable here.
export async function updateNeed(
  requestId: string,
  _prev: EditNeedState,
  formData: FormData,
): Promise<EditNeedState> {
  const title = (formData.get("title") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const type = (formData.get("type") ?? "single").toString();
  const sport = (formData.get("sport") ?? "").toString().trim();
  const conditionPref = (formData.get("condition_pref") ?? "").toString().trim();
  const budgetRaw = (formData.get("budget") ?? "").toString().trim();

  if (!title) return { error: "Please give your want a title." };
  if (type !== "single" && type !== "bulk")
    return { error: "Pick single or bulk." };

  let budgetCents: number | null = null;
  if (budgetRaw) {
    const dollars = Number(budgetRaw);
    if (!Number.isFinite(dollars) || dollars < 0)
      return { error: "Budget must be a positive number." };
    budgetCents = Math.round(dollars * 100);
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  // Confirm ownership + that it's still a private want.
  const { data: request } = await supabase
    .from("requests")
    .select("id, buyer_id, visibility, image_url")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "This want no longer exists." };
  if (request.buyer_id !== userId)
    return { error: "You can only edit your own wants." };
  if (request.visibility !== "private")
    return { error: "This want is already on the board and can't be edited." };

  // Optional: replace the reference photo (keep the existing one if none given).
  let imageUrl: string | null = request.image_url ?? null;
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

  const { error } = await supabase
    .from("requests")
    .update({
      title,
      description: description || null,
      type,
      sport: sport || null,
      budget_cents: budgetCents,
      condition_pref: conditionPref || null,
      image_url: imageUrl,
    })
    .eq("id", requestId)
    .eq("buyer_id", userId)
    .eq("visibility", "private");

  if (error) return { error: "Couldn't save your changes. Please try again." };

  const { data: me } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  redirect(me?.username ? `/u/${me.username}` : "/");
}

export async function createOffer(
  requestId: string,
  _prev: OfferState,
  formData: FormData,
): Promise<OfferState> {
  const priceRaw = (formData.get("price") ?? "").toString().trim();
  const condition = (formData.get("condition") ?? "").toString().trim();
  const note = (formData.get("note") ?? "").toString().trim();

  const dollars = Number(priceRaw);
  if (!priceRaw || !Number.isFinite(dollars) || dollars <= 0)
    return { error: "Enter a price greater than $0." };
  const priceCents = Math.round(dollars * 100);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  // Make sure the request exists and the seller isn't the buyer.
  const { data: request } = await supabase
    .from("requests")
    .select("id, buyer_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "This need no longer exists." };
  if (request.buyer_id === userId)
    return { error: "You can't make an offer on your own need." };
  if (request.status !== "open")
    return { error: "This need is no longer open for offers." };

  // Optional photo of the card being offered.
  let photoUrl: string | null = null;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/"))
      return { error: "The attachment must be an image." };
    if (file.size > 8 * 1024 * 1024)
      return { error: "Image is too large (max 8MB)." };
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("offer-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError)
      return { error: "Couldn't upload the photo. Please try again." };
    photoUrl = supabase.storage.from("offer-photos").getPublicUrl(path)
      .data.publicUrl;
  }

  const { error } = await supabase.from("offers").insert({
    request_id: requestId,
    seller_id: userId,
    price_cents: priceCents,
    condition: condition || null,
    photo_url: photoUrl,
    note: note || null,
    status: "pending",
  });

  if (error) return { error: "Couldn't send your offer. Please try again." };

  revalidatePath(`/request/${requestId}`);
  return { success: true };
}

export async function acceptOffer(formData: FormData): Promise<void> {
  const offerId = (formData.get("offer_id") ?? "").toString();
  const requestId = (formData.get("request_id") ?? "").toString();
  if (!offerId) return;
  const supabase = await createClient();
  await supabase.rpc("accept_offer", { p_offer_id: offerId });
  revalidatePath(`/request/${requestId}`);
}

export async function declineOffer(formData: FormData): Promise<void> {
  const offerId = (formData.get("offer_id") ?? "").toString();
  const requestId = (formData.get("request_id") ?? "").toString();
  if (!offerId) return;
  const supabase = await createClient();
  await supabase.rpc("decline_offer", { p_offer_id: offerId });
  revalidatePath(`/request/${requestId}`);
}
