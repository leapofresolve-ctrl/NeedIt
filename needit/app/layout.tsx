import type { Metadata } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // Was derived from VERCEL_URL, which on Vercel is the *deployment* hostname,
  // not the domain. Every OG and Twitter image on exprifi.com was therefore
  // pointing at a preview URL — broken share cards everywhere, and two hosts
  // serving identical content to crawlers. See lib/site.ts.
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: {
    default: "Exprifi — the marketplace that hunts for you",
    // Sub-pages set their own title; this keeps the brand on every tab.
    template: "%s · Exprifi",
  },
  description:
    "A reverse marketplace for sports cards. Post the card or lot you want, set your budget, and sellers bring it to you.",
  applicationName: "Exprifi",
  openGraph: {
    type: "website",
    siteName: "Exprifi",
    title: "Exprifi — the marketplace that hunts for you",
    description:
      "Post what you want. Sellers race to fill it. A reverse marketplace for sports cards.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Exprifi — the marketplace that hunts for you",
    description:
      "Post what you want. Sellers race to fill it. A reverse marketplace for sports cards.",
  },
  robots: { index: true, follow: true },
};

// Brand type system (3a): Instrument Sans display+body, Spline Sans Mono numerals.
const instrument = Instrument_Sans({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-num",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
  panel,
}: Readonly<{
  children: React.ReactNode;
  /** Parallel route slot for overlays that need to be real URLs. Resolves to
   *  null on every route (app/@panel/default.tsx) except a soft navigation to
   *  /post, which app/@panel/(.)post intercepts into a right-gutter panel. */
  panel: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrument.className} ${splineMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
          {panel}
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
