import Link from "next/link";

import {
  LEGAL_ENTITY,
  SUPPORT_EMAIL,
  SUPPORT_INBOX_LIVE,
  supportMailto,
} from "@/lib/contact";
import { LEGAL_PUBLISHED } from "@/lib/legal";

/**
 * 3b: the highest officialness-per-pixel item on the whole facelift list.
 *
 * "Official" is mostly furniture, not styling. A marketplace with no footer,
 * no policies, no support route and no legal entity reads as a side project no
 * matter how good the type is. The entity + "not a party to any sale" line at
 * the bottom does more for trust than any graphic we could commission — and
 * it's load-bearing legally too.
 *
 * RULE: every link here must resolve. A dead footer link is worse than a
 * missing one. The Legal column is therefore gated on LEGAL_PUBLISHED — the
 * four policy pages exist and render at their final URLs, but they stay
 * unlinked until Kyle has read them. We don't advertise legal text nobody has
 * read, and we don't ship a column of links to drafts.
 */

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-board bg-board">
      <div
        className={`mx-auto grid w-full max-w-5xl gap-8 px-5 py-12 sm:grid-cols-2 ${
          LEGAL_PUBLISHED ? "lg:grid-cols-5" : "lg:grid-cols-4"
        }`}
      >
        <div className="flex flex-col gap-3">
          <span className="text-lg font-bold tracking-[-0.04em] text-board-fg">
            exprifi
            <span className="wordmark-tick" aria-hidden />
          </span>
          <p className="max-w-[26ch] text-sm text-board-muted">
            The marketplace that hunts for you. Post what you want — sellers
            race to fill it.
          </p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Marketplace">
          <h2 className="microlabel mb-1 text-[10px] text-board-faint">
            Marketplace
          </h2>
          <FooterLink href="/">The board</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
          <FooterLink href="/help">Help</FooterLink>
          <FooterLink href="/post" scroll={false}>
            Post a need
          </FooterLink>
          <FooterLink href="/alerts">Demand alerts</FooterLink>
        </nav>

        <nav className="flex flex-col gap-2" aria-label="Trust and safety">
          <h2 className="microlabel mb-1 text-[10px] text-board-faint">
            Trust &amp; safety
          </h2>
          <FooterLink href="/how-it-works#safe">What keeps it safe</FooterLink>
          {LEGAL_PUBLISHED && (
            <>
              <FooterLink href="/legal/prohibited-items">
                Prohibited items
              </FooterLink>
              <FooterLink href="/legal/off-platform">
                Off-platform policy
              </FooterLink>
            </>
          )}
          <FooterLink href="/settings">Your account</FooterLink>
          {SUPPORT_INBOX_LIVE && (
            <FooterLink href={supportMailto("Reporting a problem")}>
              Report a problem
            </FooterLink>
          )}
        </nav>

        {LEGAL_PUBLISHED && (
          <nav className="flex flex-col gap-2" aria-label="Legal">
            <h2 className="microlabel mb-1 text-[10px] text-board-faint">
              Legal
            </h2>
            <FooterLink href="/legal/terms">Terms of Service</FooterLink>
            <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/legal/prohibited-items">
              Counterfeit policy
            </FooterLink>
          </nav>
        )}

        <nav className="flex flex-col gap-2" aria-label="Support">
          <h2 className="microlabel mb-1 text-[10px] text-board-faint">
            Support
          </h2>
          {/* Don't advertise an address that bounces — see lib/contact.ts. */}
          {SUPPORT_INBOX_LIVE ? (
            <>
              <FooterLink href={supportMailto()}>{SUPPORT_EMAIL}</FooterLink>
              <p className="text-sm text-board-muted">
                We answer every message, usually within a day.
              </p>
            </>
          ) : (
            <p className="text-sm text-board-muted">
              Support email is being set up. In the meantime, reach us wherever
              you found Exprifi and we&apos;ll get back to you.
            </p>
          )}
        </nav>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-5 py-6">
          <p className="text-xs text-board-muted">
            © {YEAR} Exprifi. Exprifi is a service of {LEGAL_ENTITY}.
          </p>
          <p className="max-w-[70ch] text-xs text-board-faint">
            Exprifi is a venue for collector-to-collector transactions and is
            not a party to any sale. Card names, sets and trademarks belong to
            their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  scroll,
}: {
  href: string;
  children: React.ReactNode;
  /** Forwarded to next/link. Only /post needs it — see site-header.tsx. */
  scroll?: boolean;
}) {
  const className =
    "text-sm text-board-secondary transition-colors hover:text-board-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--board))]";

  // mailto: isn't a route — next/link would try to prefetch it.
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} scroll={scroll} className={className}>
      {children}
    </Link>
  );
}
