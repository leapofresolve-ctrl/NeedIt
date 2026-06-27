"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type OfferState = { error?: string; success?: boolean };

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
