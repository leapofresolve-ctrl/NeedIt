import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { LEGAL_EFFECTIVE, LEGAL_PUBLISHED, LEGAL_UPDATED } from "@/lib/legal";

/**
 * Shared chrome for /legal/*.
 *
 * Design intent (3b §1.7): policy pages are where "official" is either earned
 * or lost. The register is plain, the measure is narrow enough to read, and the
 * four documents cross-link to each other — because the Terms incorporate the
 * Prohibited Items policy by reference, and a reference you can't click is a
 * reference nobody follows.
 */

const DOCS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/prohibited-items", label: "Prohibited Items" },
  { href: "/legal/off-platform", label: "Off-Platform Solicitation" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <SiteHeader />

      <div className="w-full max-w-3xl px-5 py-10">
        {!LEGAL_PUBLISHED && (
          <div
            role="note"
            className="mb-8 rounded-sm border border-warn bg-[rgba(245,166,35,0.08)] px-4 py-3"
          >
            <p className="text-sm font-semibold">Draft — awaiting review</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This page is live at its final address but is not yet linked from
              anywhere on the site. It takes effect once reviewed and{" "}
              <code className="num text-xs">LEGAL_PUBLISHED</code> is set to
              true.
            </p>
          </div>
        )}

        <nav
          aria-label="Policies"
          className="mb-8 flex flex-wrap gap-2 border-b pb-6"
        >
          {DOCS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="inline-flex min-h-11 items-center rounded-sm border bg-card px-3 text-sm font-medium transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {d.label}
            </Link>
          ))}
        </nav>

        <article
          className={[
            "max-w-[68ch] text-[16px] leading-[1.65]",
            "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-[-0.03em] [&_h1]:mb-2",
            "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em]",
            "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold",
            "[&_p]:mb-4 [&_p]:text-foreground/90",
            "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5",
            "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5",
            "[&_li]:text-foreground/90",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_a]:underline [&_a]:underline-offset-4",
            "[&_table]:mb-5 [&_table]:w-full [&_table]:text-sm",
            "[&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top",
          ].join(" ")}
        >
          {children}

          <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
            Effective {LEGAL_EFFECTIVE}. Last updated {LEGAL_UPDATED}.
          </p>
        </article>
      </div>
    </main>
  );
}
