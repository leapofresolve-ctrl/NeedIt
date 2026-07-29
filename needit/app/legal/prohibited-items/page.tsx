import type { Metadata } from "next";
import Link from "next/link";

import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Prohibited Items & Counterfeit Policy",
  description:
    "What is never allowed on Exprifi, how to report it, and what happens when someone breaks the rule.",
  alternates: { canonical: "/legal/prohibited-items" },
};

export default function ProhibitedItemsPage() {
  return (
    <>
      <h1>Prohibited Items &amp; Counterfeit Policy</h1>

      <h2>Never allowed on Exprifi</h2>
      <ol>
        <li>
          <strong>
            Counterfeit, reprinted, altered, or trimmed cards presented as
            genuine
          </strong>{" "}
          — including trimmed, recoloured, or re-holdered slabs.
        </li>
        <li>
          <strong>Counterfeit or tampered grading slabs</strong>, or cards
          represented as graded when they aren&apos;t.
        </li>
        <li>
          <strong>Stolen goods</strong>, or items you don&apos;t own or have the
          right to sell.
        </li>
        <li>
          <strong>&ldquo;Searched&rdquo; or resealed wax</strong> sold as
          unsearched, and repacks not clearly labelled as repacks.
        </li>
        <li>
          <strong>Misrepresented bulk</strong> — lot counts, years, sets, or
          condition that don&apos;t match what ships.
        </li>
        <li>Anything illegal to sell where either party is located.</li>
        <li>
          Items outside our categories (currently sports cards, TCG, and
          comics).
        </li>
      </ol>
      <p>
        <strong>
          Reprints and custom cards are allowed only if clearly and prominently
          labelled as such
        </strong>{" "}
        in the title and description. &ldquo;REPRINT&rdquo; in small print at
        the bottom does not count.
      </p>

      <h2>Reporting</h2>
      <p>
        Email <strong>{SUPPORT_EMAIL}</strong> with the need or offer and
        what&apos;s wrong. We review every report, typically within 24 hours.
        Outcomes range from removing content, to reversing a transaction we hold
        funds for, to permanently banning the account.{" "}
        <strong>
          Suspected counterfeiting is treated as fraud and results in a
          permanent ban on the first offence.
        </strong>
      </p>

      <h2>If you receive a fake</h2>
      <p>
        Contact us immediately with photos and your order details. Where we hold
        the funds, we can reverse the transaction. Where the deal happened
        off-platform, we can ban the seller but{" "}
        <strong>we cannot recover your money</strong> — which is precisely why
        the <Link href="/legal/off-platform">off-platform rule</Link> exists.
      </p>
    </>
  );
}
