import type { Metadata } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
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
}: Readonly<{
  children: React.ReactNode;
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
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
