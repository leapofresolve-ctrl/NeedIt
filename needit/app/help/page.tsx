import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  SUPPORT_EMAIL,
  SUPPORT_INBOX_LIVE,
  supportMailto,
} from "@/lib/contact";
import { LEGAL_PUBLISHED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Answers to the questions people actually ask about Exprifi — how needs work, why offers are private, what happens when a deal is agreed, and how to reach a human.",
  alternates: { canonical: "/help" },
};

/**
 * /help — the Phase 1 "stub" that shouldn't read like a stub.
 *
 * A help page that says "coming soon" is worse than no help page: it's a
 * visible admission that nobody is home, on the exact screen someone reaches
 * when they're already unsure. So this ships as a real FAQ answering the
 * questions the concierge phase will otherwise answer by DM twelve times a day.
 *
 * Every answer here is one Kyle would give anyway. When the seeding sprint
 * turns up questions this doesn't cover, add them — the list of things people
 * actually ask is the most valuable document in the support workstream.
 */

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Exprifi, in one sentence?",
    a: (
      <>
        It&apos;s a marketplace turned around: instead of scrolling listings
        hoping someone has what you want, you <strong>post what you want</strong>{" "}
        with a budget, and sellers bring it to you.
      </>
    ),
  },
  {
    q: "Do I need an account to look around?",
    a: (
      <>
        No. The board, every open need and every public profile are visible to
        anyone. You need a free account only to <em>act</em> — post a need, make
        an offer, or counter.
      </>
    ),
  },
  {
    q: "What does it cost?",
    a: (
      <>
        Nothing today. Posting needs, making offers and closing deals are all
        free while we build liquidity. When fees do start,{" "}
        <strong>sellers keep 100%</strong> and we&apos;ll give at least 30
        days&apos; notice — founding members hear first.
      </>
    ),
  },
  {
    q: "Why can't I see other people's offers?",
    a: (
      <>
        Offers are private between the seller who made one and the buyer who
        posted the need. Public offers turn a marketplace into a race to the
        bottom and hand every seller&apos;s pricing to their competitors. You
        can see <em>how many</em> offers a need has — that&apos;s the signal
        that matters — but never what they say.
      </>
    ),
  },
  {
    q: "Why is there no chat?",
    a: (
      <>
        On purpose. Negotiation happens through structured offers and counters,
        so there&apos;s always a record of what was proposed and agreed. Free
        text is how deals get pulled into DMs, and a deal in a DM has no record,
        no dispute path and no recourse if it goes wrong.
      </>
    ),
  },
  {
    q: "When does someone learn who I am?",
    a: (
      <>
        You trade under your username. Identities stay masked until a deal is
        agreed — at which point the two of you need real details to actually
        complete it.
      </>
    ),
  },
  {
    q: "How long does a need stay up?",
    a: (
      <>
        You choose the window when you post. A countdown shows on the card, and
        it turns amber in the last stretch. You can also save a need{" "}
        <strong>privately</strong> as a wishlist and publish it later — the
        clock starts when you publish, not when you write it.
      </>
    ),
  },
  {
    q: "How do I get told when something matches?",
    a: (
      <>
        Set up a <Link href="/alerts">demand alert</Link>. Describe what you can
        supply — keyword, sport, type, price range — and you&apos;ll be notified
        the moment a buyer posts a need that fits. It&apos;s the fastest way to
        be first to a new need, and being first is most of the game.
      </>
    ),
  },
  {
    q: "Someone asked me to take the deal off-platform. What do I do?",
    a: (
      <>
        Don&apos;t, and report it. It&apos;s against the rules and it&apos;s the
        opening move of nearly every scam in this hobby. Forward the details to{" "}
        {SUPPORT_EMAIL} and we&apos;ll handle it.
      </>
    ),
  },
  {
    q: "I think I've been sent a fake.",
    a: (
      <>
        Email {SUPPORT_EMAIL} straight away with photos and the deal details.
        Suspected counterfeiting is treated as fraud and is a permanent ban on
        the first offence.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <SiteHeader />

      <div className="w-full max-w-3xl px-5 py-10">
        <span className="microlabel text-[10px] text-muted-foreground">
          Help
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">
          Questions people actually ask
        </h1>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.65] text-muted-foreground">
          If your question isn&apos;t here, ask us — a person reads every
          message and we answer within a day.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {SUPPORT_INBOX_LIVE && (
            <Button asChild size="lg">
              <a href={supportMailto("Question about Exprifi")}>
                Email support
              </a>
            </Button>
          )}
          <Button asChild size="lg" variant="outline">
            <Link href="/how-it-works">How Exprifi works</Link>
          </Button>
        </div>

        <dl className="mt-12 divide-y border-t">
          {FAQ.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-[17px] font-bold tracking-[-0.02em]">
                {item.q}
              </dt>
              <dd className="mt-2 max-w-[68ch] text-[16px] leading-[1.65] text-foreground/90 [&_a]:underline [&_a]:underline-offset-4">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-12 rounded-sm border bg-card p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em]">
            Still stuck?
          </h2>
          <p className="mt-2 max-w-[62ch] text-[16px] leading-[1.65] text-muted-foreground">
            Email <strong>{SUPPORT_EMAIL}</strong> with your username and what
            happened. Include the need or offer link if there is one — it makes
            the answer faster and more useful.
          </p>
          {LEGAL_PUBLISHED && (
            <p className="mt-3 text-sm text-muted-foreground">
              For the rules themselves, see the{" "}
              <Link href="/legal/terms" className="underline underline-offset-4">
                Terms
              </Link>
              ,{" "}
              <Link
                href="/legal/prohibited-items"
                className="underline underline-offset-4"
              >
                Prohibited Items
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/off-platform"
                className="underline underline-offset-4"
              >
                Off-Platform
              </Link>{" "}
              policies.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
