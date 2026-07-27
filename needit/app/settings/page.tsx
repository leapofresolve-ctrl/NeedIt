import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { StripeConnectButton } from "@/components/settings/stripe-connect-button";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, email_notifications")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.username) redirect("/onboarding");

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-xl flex flex-col gap-6 p-5">
        <Link
          href={`/u/${profile.username}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to your profile
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as @{profile.username}
          </p>
        </div>

        <section className="border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <SettingsForm emailDefault={profile.email_notifications ?? true} />
        </section>

        <section className="border rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Payments</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Connect a Stripe account so buyers can pay you on Exprifi.
          </p>
          <StripeConnectButton />
        </section>
      </div>
    </main>
  );
}
