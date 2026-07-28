"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SettingsState = { saved?: boolean; error?: string; notice?: string };

const OK: SettingsState = { saved: true };
const SIGNED_OUT: SettingsState = { error: "You need to be signed in." };

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub as string | undefined };
}

const bool = (fd: FormData, name: string) => fd.get(name) === "on";

const text = (fd: FormData, name: string) => {
  const v = fd.get(name);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
};

const int = (fd: FormData, name: string) => {
  const s = text(fd, name);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

const NOTIFY_KEYS = [
  "notify_offer_received",
  "notify_counter",
  "notify_your_move",
  "notify_offer_decided",
  "notify_match",
  "notify_demand_match",
  "notify_expiring",
  "notify_digest",
  "notify_product",
] as const;

export async function updateNotifications(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const patch: Record<string, boolean> = {
    email_notifications: bool(formData, "email_notifications"),
  };
  for (const k of NOTIFY_KEYS) patch[k] = bool(formData, k);

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (error) return { error: "Couldn't save your notification settings." };

  revalidatePath("/settings");
  return OK;
}

/* -------------------------------------------------------------------------- */
/* Profile / selling / buying / privacy                                        */
/* -------------------------------------------------------------------------- */

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const displayName = text(formData, "display_name");
  if (displayName && displayName.length > 40) {
    return { error: "Display name has to be 40 characters or fewer." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);
  if (error) return { error: "Couldn't save your profile." };

  revalidatePath("/settings");
  return OK;
}

export async function updateSelling(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const handling = int(formData, "handling_time_days");
  if (handling !== null && (handling < 1 || handling > 30)) {
    return { error: "Handling time has to be between 1 and 30 days." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_seller: bool(formData, "is_seller"),
      ships_from_state: text(formData, "ships_from_state"),
      handling_time_days: handling,
    })
    .eq("id", userId);
  if (error) return { error: "Couldn't save your selling settings." };

  revalidatePath("/settings");
  return OK;
}

export async function updateBuying(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const expiry = int(formData, "default_expiry_hours");
  if (expiry !== null && ![24, 72, 168].includes(expiry)) {
    return { error: "Pick one of the offered expiry options." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      default_expiry_hours: expiry,
      default_sport: text(formData, "default_sport"),
      default_private: bool(formData, "default_private"),
    })
    .eq("id", userId);
  if (error) return { error: "Couldn't save your posting defaults." };

  revalidatePath("/settings");
  return OK;
}

export async function updatePrivacy(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_public: bool(formData, "profile_public"),
      allow_indexing: bool(formData, "allow_indexing"),
    })
    .eq("id", userId);
  if (error) return { error: "Couldn't save your privacy settings." };

  revalidatePath("/settings");
  return OK;
}

/* -------------------------------------------------------------------------- */
/* Username                                                                    */
/* -------------------------------------------------------------------------- */

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const COOLDOWN_DAYS = 30;

/**
 * Usernames double as a contact-info smuggling vector ("dm_me_on_ig"), so they
 * get the same pattern screening as every other free-text field — plus a
 * cooldown. On a pseudonymous marketplace the username IS the reputation, and
 * silently swapping it is how a bad actor sheds a bad one.
 */
const BANNED_PATTERNS = [
  /insta|ig_|snap|telegram|whats|discord|venmo|paypal|zelle|cashapp/i,
  /\d{7,}/,
  /@|\.com|\.net|http/i,
];

export async function updateUsername(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const next = (text(formData, "username") ?? "").toLowerCase();
  if (!USERNAME_RE.test(next)) {
    return {
      error:
        "Usernames are 3–20 characters — letters, numbers and underscores only.",
    };
  }
  if (BANNED_PATTERNS.some((re) => re.test(next))) {
    return {
      error:
        "That username looks like contact info. Deals stay on Exprifi — pick something else.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_changed_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.username === next) return OK;

  if (profile?.username_changed_at) {
    const days =
      (Date.now() - new Date(profile.username_changed_at).getTime()) /
      86_400_000;
    if (days < COOLDOWN_DAYS) {
      return {
        error: `You can change your username again in ${Math.ceil(
          COOLDOWN_DAYS - days,
        )} days.`,
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: next, username_changed_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: "Couldn't change your username. Try again." };
  }

  revalidatePath("/settings");
  return { saved: true, notice: `You're now @${next}.` };
}

/* -------------------------------------------------------------------------- */
/* Credentials                                                                 */
/* -------------------------------------------------------------------------- */

export async function updateEmail(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const email = text(formData, "email");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That doesn't look like a valid email address." };
  }

  // Supabase confirms to BOTH the old and new address, so a stolen session
  // can't quietly move the account somewhere else.
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };

  return {
    saved: true,
    notice: "Check both inboxes — we sent a confirmation link to each.",
  };
}

export async function updatePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < 10) {
    return { error: "Use at least 10 characters." };
  }
  if (password !== confirm) {
    return { error: "Those two passwords don't match." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { saved: true, notice: "Password updated." };
}

export async function signOutEverywhere(): Promise<void> {
  const { supabase, userId } = await currentUser();
  if (!userId) return;
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login");
}

/* -------------------------------------------------------------------------- */
/* Account closure                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Closing deactivates immediately (open needs pulled off the board, profile
 * hidden) but keeps the row through a grace period rather than hard-deleting
 * on the spot. People misclick, and a member with a deal in flight has a
 * counterparty who is owed a resolution.
 *
 * Completed deals are retained either way — they're the transaction ledger.
 * The Privacy Policy has to say exactly that.
 */
export async function closeAccount(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return SIGNED_OUT;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const typed = (text(formData, "confirm_username") ?? "").toLowerCase();
  if (!profile?.username || typed !== profile.username.toLowerCase()) {
    return { error: "Type your username exactly as it appears to confirm." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      deletion_requested_at: new Date().toISOString(),
      profile_public: false,
      allow_indexing: false,
      email_notifications: false,
    })
    .eq("id", userId);
  if (error) {
    return { error: "Couldn't close your account. Email support@exprifi.com." };
  }

  // Pull their open needs off the board straight away.
  await supabase
    .from("requests")
    .update({ visibility: "private" })
    .eq("buyer_id", userId)
    .eq("status", "open");

  await supabase.auth.signOut();
  redirect("/");
}

export async function reopenAccount(): Promise<void> {
  const { supabase, userId } = await currentUser();
  if (!userId) return;
  await supabase
    .from("profiles")
    .update({ deletion_requested_at: null, profile_public: true })
    .eq("id", userId);
  revalidatePath("/settings");
}
