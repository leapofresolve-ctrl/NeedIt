import type { Metadata } from "next";
import Link from "next/link";

import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Off-Platform Solicitation Policy",
  description:
    "Deals that start on Exprifi are completed on Exprifi. What counts as a violation, what doesn't, and why the rule exists.",
  alternates: { canonical: "/legal/off-platform" },
};

export default function OffPlatformPage() {
  return (
    <>
      <h1>Off-Platform Solicitation Policy</h1>
      <p className="text-muted-foreground">
        This expands §6 of the{" "}
        <Link href="/legal/terms">Terms of Service</Link> and forms part of
        them.
      </p>

      <h2>The rule</h2>
      <p>
        <strong>
          Deals that start on Exprifi are completed on Exprifi.
        </strong>
      </p>

      <h2>What counts as a violation</h2>
      <p>
        Sharing or requesting any of the following, anywhere on the platform —
        including inside images and in usernames:
      </p>
      <ul>
        <li>email addresses</li>
        <li>phone numbers</li>
        <li>social media handles</li>
        <li>messaging app IDs</li>
        <li>payment app IDs (Venmo, PayPal, Zelle, Cash App)</li>
        <li>external URLs</li>
        <li>
          deliberately obfuscated versions of any of these — &ldquo;kyle at
          gmail dot com&rdquo;, &ldquo;my IG is in my bio&rdquo;, spelled-out
          digits
        </li>
      </ul>

      <h2>What&apos;s fine</h2>
      <p>
        Describing an item, discussing price via counters, using the structured
        questions, and everything support asks you for over email.
      </p>

      <h2>Enforcement ladder</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>What happens</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1st</td>
            <td>Content blocked, warning issued, logged</td>
          </tr>
          <tr>
            <td>2nd</td>
            <td>Content removed, 7-day suspension</td>
          </tr>
          <tr>
            <td>3rd</td>
            <td>Permanent ban</td>
          </tr>
          <tr>
            <td>Egregious</td>
            <td>
              Immediate permanent ban — e.g. systematic harvesting of members,
              or an attempted scam
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        We detect this automatically at write time and review flags daily.{" "}
        <strong>You can report it too:</strong> {SUPPORT_EMAIL}.
      </p>

      <h2>Why we&apos;re strict</h2>
      <p>
        This isn&apos;t only about our fees — we charge nothing today and this
        rule already exists. It&apos;s because every serious scam in this hobby
        begins by moving the conversation somewhere with no record. On Exprifi
        there&apos;s a record of what was offered, agreed, and paid. In a DM
        there&apos;s nothing.
      </p>
    </>
  );
}
