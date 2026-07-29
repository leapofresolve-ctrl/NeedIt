import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import {
  SUPPORT_EMAIL,
  SUPPORT_INBOX_LIVE,
  supportMailto,
} from "@/lib/contact";
import { SiteHeader } from "@/components/site-header";
import { StripeConnectButton } from "@/components/settings/stripe-connect-button";
import {
  AccountPanels,
  BuyingPanel,
  CloseAccountPanel,
  NotificationsPanel,
  PrivacyPanel,
  SellingPanel,
  type ProfileSettings,
} from "@/components/settings/settings-panels";

export const metadata: Metadata = { title: "Settings — Exprifi" };

/**
 * 3b: settings went from a single "email me about activity" checkbox to seven
 * sections. Laid out as one scrolling page with a sticky jump-nav rather than
 * tabs — the audience skews older, and everything being visible beats
 * everything being hidden behind a control you have to discover first.
 */

const NAV = [
  { href: "#profile", label: "Profile" },
  { href: "#username", label: "Username" },
  { href: "#email", label: "Email" },
  { href: "#password", label: "Password" },
  { href: "#notifications", label: "Notifications" },
  { href: "#buying", label: "Posting defaults" },
  { href: "#selling", label: "Selling" },
  { href: "#payouts", label: "Payouts" },
  { href: "#privacy", label: "Privacy" },
  { href: "#support", label: "Support" },
  { href: "#close", label: "Close account" },
];

const COLUMNS = `username, display_name, email_notifications,
  notify_offer_received, notify_counter, notify_your_move, notify_offer_decided,
  notify_match, notify_demand_match, notify_expiring, notify_digest, notify_product,
  is_seller, ships_from_state, handling_time_days,
  default_expiry_hours, default_sport, default_private,
  profile_public, allow_indexing, deletion_requested_at`;

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: row } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (!row?.username) redirect("/onboarding");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const p: ProfileSettings = {
    ...(row as unknown as Omit<ProfileSettings, "email">),
    email: user?.email ?? "",
  };

  const closing = Boolean(
    (row as { deletion_requested_at?: string | null }).deletion_requested_at,
  );

  return (
    <main className="flex min-h-screen flex-col items-center">
      <SiteHeader />

      <div className="flex w-full max-w-5xl flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-1">
          <Link
            href={`/u/${p.username}`}
            className="w-fit text-sm text-muted-foreground hover:underline"
          >
            ← Back to your profile
          </Link>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as @{p.username}
          </p>
        </div>

        {closing && (
          <div className="border border-warn bg-[#FFF8EC] p-4 text-sm">
            <strong className="font-semibold">
              This account is scheduled to close.
            </strong>{" "}
            Your profile is hidden and your needs are off the board.{" "}
            {SUPPORT_INBOX_LIVE ? (
              <>
                Email{" "}
                <a className="underline" href={supportMailto("Reopen my account")}>
                  {SUPPORT_EMAIL}
                </a>{" "}
                within 14 days to reverse it.
              </>
            ) : (
              <>
                Get in touch within 14 days and we&apos;ll reverse it — nothing
                is deleted before then.
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Jump nav — sticky on desktop, a plain wrap of links on mobile */}
          <nav
            aria-label="Settings sections"
            className="lg:sticky lg:top-24 lg:w-52 lg:shrink-0"
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground lg:min-h-0 lg:py-1.5"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <AccountPanels p={p} />
            <NotificationsPanel p={p} />
            <BuyingPanel p={p} />
            <SellingPanel p={p} />

            <section id="payouts" className="scroll-mt-24 border bg-card p-6">
              <h2 className="text-lg font-bold tracking-[-0.02em]">Payouts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect a Stripe account so buyers can pay you through Exprifi.
                On-platform payments aren&apos;t switched on yet — this just
                gets you set up early.
              </p>
              <div className="mt-4">
                <StripeConnectButton />
              </div>
            </section>

            <PrivacyPanel p={p} />

            <section id="support" className="scroll-mt-24 border bg-card p-6">
              <h2 className="text-lg font-bold tracking-[-0.02em]">Support</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Something wrong, confusing, or broken? We answer every message.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                <li>
                  <Link href="/how-it-works" className="underline">
                    How Exprifi works
                  </Link>
                </li>
                {/* Only shown once the mailbox actually receives — lib/contact.ts */}
                {SUPPORT_INBOX_LIVE && (
                  <>
                    <li>
                      <a href={supportMailto()} className="underline">
                        Email {SUPPORT_EMAIL}
                      </a>
                    </li>
                    <li>
                      <a
                        href={supportMailto("Reporting a problem")}
                        className="underline"
                      >
                        Report a member or a listing
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </section>

            {!closing && <CloseAccountPanel username={p.username} />}
          </div>
        </div>
      </div>
    </main>
  );
}
