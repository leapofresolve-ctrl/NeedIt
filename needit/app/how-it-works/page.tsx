import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Exprifi works — post what you want, sellers come to you",
  description:
    "Exprifi is a reverse marketplace for sports cards. Post the card or lot you want, set your budget, and sellers bring it to you with structured offers.",
};

/**
 * 3b: a plain-language explainer for the cautious first-time visitor.
 *
 * The beachhead skews older and is arriving from Facebook groups and IG DMs,
 * where every deal is a judgement call about a stranger. Nobody signs up for a
 * mechanic they don't understand, so this page does three jobs: explain the
 * inversion, answer "how do I not get scammed", and be honest about what
 * isn't built yet. That last one is the trust-earning part.
 */

const STEPS = [
  {
    n: "01",
    title: "Post what you want",
    body: "A specific card, a bulk lot, or just a filter — “5,000 count of 2019–21 Hoops base.” Set the most you'll pay and how long you'll wait. Add a photo if it helps sellers understand.",
    aside:
      "You can also save a need privately first and publish it later, if you'd rather not show your hand yet.",
  },
  {
    n: "02",
    title: "Sellers come to you",
    body: "Anyone holding it sends you a structured offer: a price, the condition, a photo, and a short note. Sellers who've told us what they hold get alerted the moment your need matches.",
    aside:
      "Offers are private. Other sellers can see that your need is getting attention, but never what anyone offered.",
  },
  {
    n: "03",
    title: "Negotiate on price only",
    body: "Accept, decline, or counter. Countering is a number, not a conversation — it goes back and forth until someone accepts or you run out of rounds.",
    aside:
      "There's no open chat anywhere on Exprifi. That's deliberate — see below.",
  },
  {
    n: "04",
    title: "Match, then close the deal",
    body: "When you accept, that offer locks and the others close automatically. Only then do you and the seller see who each other are.",
    aside:
      "On-platform payments are coming. Today you settle directly with each other.",
  },
];

const TRUST = [
  {
    title: "You're a username, not a name",
    body: "Everyone on the board is pseudonymous. Your real identity isn't attached to your needs, your offers, or your budget — and it isn't revealed until a deal is agreed.",
  },
  {
    title: "No open chat, on purpose",
    body: "Free-text messaging is how people get talked out of a marketplace and into a scam. Every exchange here is a structured offer or a counter, so there's a record of exactly what was agreed.",
  },
  {
    title: "Offers are private",
    body: "Only you see the offers on your need. Sellers can't see each other's prices, so nobody can undercut their way down and nobody can collude their way up.",
  },
  {
    title: "Your budget is a ceiling, not a target",
    body: "Sellers see your maximum, and they compete under it. In practice the winning offer is usually below the number you posted.",
  },
];

const FAQ = [
  {
    q: "What does it cost?",
    a: "Nothing right now. When pricing starts: sellers keep 100% of the sale price, and buyers pay a 5% finder's fee on high-end single cards only — never on bulk lots. Founding members will be told well before anything changes.",
  },
  {
    q: "Do I have to sell to use it?",
    a: "No. Plenty of people only ever post needs. Selling is something you turn on if and when you want it.",
  },
  {
    q: "What if nobody offers on my need?",
    a: "It expires and nothing happens — no cost, no obligation. You can repost it, raise your budget, or loosen the description. Vague needs get more offers than exact ones.",
  },
  {
    q: "How do you stop fakes and bad cards?",
    a: "Sellers send photos with their offers, and the deal record is permanent and attached to their account. We're building reviews and a report system next. This is an early platform — deal accordingly, and tell us when something's wrong.",
  },
  {
    q: "What's not built yet?",
    a: "On-platform payments and escrow, buyer protection, and public reviews. We'd rather say so plainly than imply protections that don't exist yet.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <SiteHeader />

      <div className="flex w-full max-w-3xl flex-col gap-14 px-5 py-12">
        <header className="flex flex-col gap-4">
          <span className="microlabel text-[10px] text-muted-foreground">
            How it works
          </span>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
            Stop hunting.
            <br />
            Post what you want.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Every other marketplace makes you search through what people happen
            to be selling. Exprifi works the other way around: you say what you
            need, and the people holding it come to you.
          </p>
        </header>

        <section className="flex flex-col gap-px overflow-hidden border bg-border">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-2 bg-card p-6 sm:p-7">
              <span className="num text-xs font-bold text-primary-deep">
                {s.n}
              </span>
              <h2 className="text-xl font-bold tracking-[-0.02em]">
                {s.title}
              </h2>
              <p className="text-base text-foreground/80">{s.body}</p>
              <p className="mt-1 border-l-2 border-border pl-3 text-sm text-muted-foreground">
                {s.aside}
              </p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">
            What keeps it safe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST.map((t) => (
              <div key={t.title} className="flex flex-col gap-2 border bg-card p-5">
                <h3 className="text-base font-bold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">
            Straight answers
          </h2>
          <div className="flex flex-col gap-px overflow-hidden border bg-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group bg-card">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                  {f.q}
                  <span
                    aria-hidden
                    className="text-muted-foreground transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="notched flex flex-col items-start gap-4 border border-board bg-board p-7">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-board-fg">
            Post your first need.
          </h2>
          <p className="max-w-md text-sm text-board-secondary">
            It takes about a minute, it costs nothing, and if nobody can fill it
            you&apos;ve lost nothing but the minute.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/post">Post a need</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/">Browse the board</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
