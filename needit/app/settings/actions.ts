"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SettingsState = { saved?: boolean; error?: string };

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const emailOn = formData.get("email_notifications") === "on";

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { error: "You need to be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ email_notifications: emailOn })
    .eq("id", userId);

  if (error) return { error: "Couldn't save your settings. Try again." };

  revalidatePath("/settings");
  return { saved: true };
}
