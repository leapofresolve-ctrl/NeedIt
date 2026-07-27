// Dev-only admin utility: reset a test user's password by username.
// Uses the Supabase SERVICE ROLE key from .env.local (never ship this to prod).
//
// Usage (run from the needit/ folder):
//   node scripts/reset-user-password.mjs <username> '<new-password>'
// Example:
//   node scripts/reset-user-password.mjs testrun 'MyTestPass123'
//
// It prints the account's email so you know what to log in with.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.log(
    "usage: node scripts/reset-user-password.mjs <username> '<new-password>'",
  );
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.log("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: prof } = await admin
  .from("profiles")
  .select("id")
  .ilike("username", username)
  .maybeSingle();

if (!prof) {
  console.log(`No profile found for username "${username}".`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(prof.id, { password });
if (error) {
  console.log("Error:", error.message);
  process.exit(1);
}

const { data: u } = await admin.auth.admin.getUserById(prof.id);
console.log("✅ Password updated for @" + username);
console.log("   Log in with:");
console.log("   Email:   ", u?.user?.email ?? "(unknown)");
console.log("   Password: the one you just set");
