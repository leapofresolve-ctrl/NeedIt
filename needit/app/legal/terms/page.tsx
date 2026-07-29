import type { Metadata } from "next";
import Link from "next/link";

import { LEGAL_ENTITY, SUPPORT_EMAIL } from "@/lib/contact";
import {
  ARBITRATION,
  DELETION_GRACE_DAYS,
  GOVERNING_STATE,
  HIGH_END_THRESHOLD_LABEL,
  LEGAL_ADDRESS,
  MINIMUM_AGE,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement between you and Exprifi: what Exprifi is, what it isn't, and the rules for posting needs and making offers.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>

      <h2>1. Who we are</h2>
      <p>
        Exprifi (&ldquo;Exprifi&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is
        operated by <strong>{LEGAL_ENTITY}</strong>, a {GOVERNING_STATE} limited
        liability company. By creating an account or using the site you agree to
        these Terms.
      </p>

      <h2>2. What Exprifi is — and what it isn&apos;t</h2>
      <p>
        Exprifi is a <strong>venue</strong>. Buyers post what they want; sellers
        respond with offers. <strong>We are not a party to any sale.</strong> We
        do not own, inspect, authenticate, store, insure, or ship any item
        listed or offered on Exprifi. The contract for any transaction is
        between the buyer and the seller.
      </p>
      <p>
        We are not an auctioneer, a broker, a consignment service, or an escrow
        agent. Where payment processing is offered, it is provided by Stripe
        under Stripe&apos;s own terms.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least {MINIMUM_AGE} years old and able to form a binding
        contract. One account per person unless we agree otherwise in writing.
        You are responsible for everything that happens under your account,
        including keeping your password secure.
      </p>

      <h2>4. Your account and your username</h2>
      <p>
        Accounts are <strong>pseudonymous</strong>. Your username is your
        identity on Exprifi and carries your transaction history. You may not:
      </p>
      <ul>
        <li>
          choose or change a username to impersonate another person or business;
        </li>
        <li>
          use a username, display name, or any text field to share contact
          information (see §6);
        </li>
        <li>transfer, sell, or lend your account to anyone else.</li>
      </ul>
      <p>
        Usernames may be changed once every 30 days. We may reclaim a username
        that impersonates someone, infringes a trademark, or is used to evade a
        suspension.
      </p>

      <h2>5. Posting needs and making offers</h2>
      <p>
        When you post a need you are making a{" "}
        <strong>good-faith statement of intent to buy</strong> at or below your
        stated budget. When you send an offer you are making a{" "}
        <strong>binding offer to sell</strong> the item described, at the price
        stated, in the condition stated, and you represent that you own it or
        have the right to sell it.
      </p>
      <p>
        When a buyer accepts an offer, both parties are expected to complete the
        transaction promptly and in good faith. Repeatedly posting needs you
        won&apos;t honour, or offers you can&apos;t fill, is grounds for
        suspension.
      </p>

      <h2>6. Deals stay on Exprifi</h2>
      <p>
        This is the one we enforce most seriously, and it exists to protect you
        as much as us.
      </p>
      <p>
        You agree <strong>not to</strong> solicit or facilitate a transaction
        off Exprifi that began on Exprifi. Specifically, you may not post, send,
        or embed email addresses, phone numbers, social media handles,
        messaging-app identifiers, payment-app identifiers, or URLs intended to
        move a deal off-platform — in any field, in any image, or in any
        username.
      </p>
      <p>
        Why this matters to you: off-platform deals have no record, no dispute
        path, and no recourse. Every scam in this hobby starts with &ldquo;just
        DM me&rdquo;. Members who take deals off Exprifi lose every protection
        we offer, and we can&apos;t help when it goes wrong.
      </p>
      <p>
        <strong>Enforcement:</strong> first attempt gets a warning; repeat
        attempts get a suspension; egregious or repeated cases get a permanent
        ban. We may remove content and restrict accounts at our discretion. The
        full ladder is in the{" "}
        <Link href="/legal/off-platform">
          Off-Platform Solicitation Policy
        </Link>
        , which forms part of these Terms.
      </p>

      <h2>7. Prohibited items and conduct</h2>
      <p>
        See the{" "}
        <Link href="/legal/prohibited-items">
          Prohibited Items &amp; Counterfeit Policy
        </Link>
        ; it forms part of these Terms. You also may not:
      </p>
      <ul>
        <li>
          misrepresent an item&apos;s condition, authenticity, grade, or
          contents;
        </li>
        <li>use another member&apos;s photos as your own;</li>
        <li>
          manipulate the board with fake needs, fake offers, or coordinated
          bidding;
        </li>
        <li>scrape, crawl, or bulk-extract data from Exprifi;</li>
        <li>
          attempt to access another member&apos;s account or any part of the
          system you&apos;re not authorised to reach;
        </li>
        <li>harass, threaten, or abuse other members or our staff.</li>
      </ul>

      <h2>8. Fees</h2>
      <p>
        Exprifi is currently <strong>free to use</strong>. When fees begin:
      </p>
      <ul>
        <li>
          <strong>Sellers keep 100%</strong> of the agreed sale price.
        </li>
        <li>
          <strong>Buyers pay a 5% finder&apos;s fee</strong> on high-end single
          cards <strong>only</strong> — never on bulk lots or filter requests.
          &ldquo;High-end&rdquo; means a sale price at or above{" "}
          <strong>{HIGH_END_THRESHOLD_LABEL}</strong>.
        </li>
        <li>
          <strong>Exprifi Pro</strong> is an optional monthly subscription for
          sellers that unlocks additional tools. It is never required to buy or
          sell.
        </li>
      </ul>
      <p>
        We will give at least <strong>30 days&apos; notice</strong> before any
        fee takes effect, and founding members will be told first.
      </p>

      <h2>9. Payments, shipping and disputes</h2>
      <p>
        Where on-platform payment is available, funds are handled by Stripe and
        released to the seller after delivery is confirmed or the confirmation
        window elapses. Where it isn&apos;t, you settle directly and{" "}
        <strong>at your own risk</strong> — we strongly recommend using tracked,
        insured shipping.
      </p>
      <p>
        Disputes should be raised with us first at {SUPPORT_EMAIL}. We will
        review the record and may mediate, refund, or reverse a transaction
        where we hold the funds.{" "}
        <strong>We cannot recover funds for off-platform payments.</strong>
      </p>

      <h2>10. Content you post</h2>
      <p>
        You keep ownership of your photos and text. You grant us a worldwide,
        non-exclusive, royalty-free licence to host, display, resize, and
        watermark that content for the purpose of operating and promoting
        Exprifi. You confirm you have the right to grant this.
      </p>

      <h2>11. Suspension and termination</h2>
      <p>
        You may close your account at any time in Settings. We may suspend or
        terminate an account that breaches these Terms, that we reasonably
        believe is fraudulent, or where required by law. Completed transaction
        records are retained after closure — they are the record other members
        relied on. See the <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        Exprifi is provided <strong>&ldquo;as is&rdquo;</strong>. To the fullest
        extent permitted by law we disclaim all warranties, express or implied,
        including merchantability, fitness for a particular purpose, and
        non-infringement. <strong>We do not guarantee</strong> that any need will
        receive an offer, that any member is who they claim to be, that any item
        is authentic or as described, or that the service will be uninterrupted
        or error-free.
      </p>

      <h2>13. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, our total liability to you for
        any claim arising out of or relating to Exprifi is limited to the
        greater of <strong>(a)</strong> the total fees you paid us in the 12
        months before the claim, or <strong>(b) $100</strong>. We are not liable
        for indirect, incidental, special, consequential, or punitive damages,
        or for lost profits or lost data.
      </p>
      <p>
        Some jurisdictions don&apos;t allow these limits, in which case they
        apply to the maximum extent permitted.
      </p>

      <h2>14. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless {LEGAL_ENTITY} and its members
        and staff from claims arising out of your content, your transactions, or
        your breach of these Terms.
      </p>

      <h2>15. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of{" "}
        <strong>{GOVERNING_STATE}</strong>, without regard to conflict-of-laws
        rules.
      </p>
      {ARBITRATION && (
        <>
          <h3>Individual arbitration and class-action waiver</h3>
          <p>
            <strong>Please read this carefully — it affects your rights.</strong>{" "}
            Except as set out below, any dispute arising out of or relating to
            these Terms or your use of Exprifi will be resolved by{" "}
            <strong>binding individual arbitration</strong> administered by the
            American Arbitration Association under its Consumer Arbitration
            Rules, seated in {GOVERNING_STATE}, rather than in court. Judgment on
            the award may be entered in any court with jurisdiction.
          </p>
          <p>
            <strong>Class-action waiver.</strong> Disputes will be brought only
            in your individual capacity. You and Exprifi each waive the right to
            a jury trial and the right to participate in a class, collective, or
            representative action.
          </p>
          <p>
            <strong>Small-claims carve-out.</strong> Either of us may bring an
            individual claim in small-claims court instead, if it qualifies.
            Claims for injunctive relief to protect intellectual property may
            also be brought in court.
          </p>
          <p>
            <strong>How to opt out.</strong> You may reject this arbitration
            agreement by emailing {SUPPORT_EMAIL} with the subject
            &ldquo;Arbitration opt-out&rdquo; within{" "}
            <strong>30 days</strong> of first accepting these Terms. Opting out
            affects nothing else and will not be held against you.
          </p>
        </>
      )}

      <h2>16. Changes</h2>
      <p>
        We may update these Terms. Material changes will be notified by email
        and posted here with a new &ldquo;last updated&rdquo; date at least{" "}
        <strong>14 days</strong> before taking effect. Continuing to use Exprifi
        after that means you accept them.
      </p>

      <h2>17. Contact</h2>
      <p>
        {SUPPORT_EMAIL} · {LEGAL_ENTITY}
        {LEGAL_ADDRESS ? `, ${LEGAL_ADDRESS}` : ""}
      </p>

      <p className="text-sm text-muted-foreground">
        Account data is retained for {DELETION_GRACE_DAYS} days after closure
        before anonymisation — see the{" "}
        <Link href="/legal/privacy">Privacy Policy</Link> for the full detail.
      </p>
    </>
  );
}
