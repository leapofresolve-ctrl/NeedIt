import type { Metadata } from "next";

import { SUPPORT_EMAIL } from "@/lib/contact";
import { DELETION_GRACE_DAYS, MINIMUM_AGE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Exprifi collects, what stays private, what's public, and how long we keep it.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>

      <h2>What we collect</h2>
      <table>
        <thead>
          <tr>
            <th>What</th>
            <th>Why</th>
            <th>Where it comes from</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Email address</td>
            <td>Sign-in, notifications, account recovery</td>
            <td>You, at signup</td>
          </tr>
          <tr>
            <td>Username, display name</td>
            <td>Your public identity on the board</td>
            <td>You</td>
          </tr>
          <tr>
            <td>Needs, offers, counters, deal records</td>
            <td>Operating the marketplace</td>
            <td>You, as you use it</td>
          </tr>
          <tr>
            <td>Photos you upload</td>
            <td>Shown with your needs and offers</td>
            <td>You</td>
          </tr>
          <tr>
            <td>Notification and privacy preferences</td>
            <td>Honouring your choices</td>
            <td>You, in Settings</td>
          </tr>
          <tr>
            <td>Payment and payout details</td>
            <td>Processing payments</td>
            <td>
              <strong>Collected by Stripe, not by us</strong>
            </td>
          </tr>
          <tr>
            <td>IP address, browser, timestamps, error logs</td>
            <td>Security, abuse prevention, fixing bugs</td>
            <td>Automatically</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>
          We do not collect or store your card number or bank details.
        </strong>{" "}
        Those go directly to Stripe.
      </p>

      <h2>What&apos;s public</h2>
      <p>
        Your <strong>username, display name, open public needs, and aggregate
        deal statistics</strong> are visible to anyone — this is a public
        marketplace and demand being visible is the product. You can restrict
        your profile in Settings.
      </p>
      <p>
        Your <strong>email address is never public.</strong> Your{" "}
        <strong>offers are private</strong> to you and the buyer. Your{" "}
        <strong>private wishlist needs are visible only to you.</strong>
      </p>
      <p>
        <strong>
          Your identity is revealed to a counterparty only when a deal is
          agreed.
        </strong>
      </p>

      <h2>How we use it</h2>
      <p>
        To run the marketplace, notify you about your activity, prevent fraud
        and off-platform solicitation, provide support, meet legal obligations,
        and understand aggregate usage.{" "}
        <strong>We do not sell your personal information. We do not serve
        third-party advertising.</strong>
      </p>

      <h2>Who we share it with</h2>
      <p>
        Service providers only, each doing a specific job:{" "}
        <strong>Supabase</strong> (database and authentication),{" "}
        <strong>Vercel</strong> (hosting), <strong>Resend</strong> (email
        delivery), <strong>Stripe</strong> (payments). We also share where
        legally required, or to investigate fraud or a threat to someone&apos;s
        safety. If the business is ever sold, member data may transfer —
        you&apos;d be notified.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account data is kept while your account is open. After you close it, we
        deactivate immediately, keep the record for{" "}
        <strong>{DELETION_GRACE_DAYS} days</strong> so you can change your mind,
        then anonymise your profile.{" "}
        <strong>Completed transaction records are retained indefinitely</strong>{" "}
        — they are the ledger the people you traded with relied on, and we need
        them for tax and dispute purposes. Once anonymised they&apos;re no
        longer linked to you.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Access, correct, or download your data</li>
        <li>Close your account</li>
        <li>Turn off email notifications, individually or entirely</li>
        <li>Hide your profile from logged-out visitors</li>
        <li>Opt out of search-engine indexing</li>
      </ul>
      <p>
        Depending on where you live you may have additional rights under GDPR or
        the CCPA — email <strong>{SUPPORT_EMAIL}</strong> and we&apos;ll honour
        them.
      </p>

      <h2>Security, children, cookies</h2>
      <p>
        We use encryption in transit, row-level database access controls, and
        payment handling delegated to Stripe.{" "}
        <strong>No system is perfectly secure</strong>, and we&apos;ll tell you
        promptly if a breach affects you.
      </p>
      <p>
        Exprifi is not for anyone under <strong>{MINIMUM_AGE}</strong>. We
        don&apos;t knowingly collect data from children; contact us and
        we&apos;ll delete it.
      </p>
      <p>
        We use cookies that are <strong>strictly necessary</strong> for sign-in
        and security. We do not use advertising or cross-site tracking cookies.
      </p>
    </>
  );
}
