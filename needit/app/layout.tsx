import type { Metadata } from "next";
import { Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Exprifi — the marketplace that hunts for you",
  description:
    "The demand exchange — post what you want, sellers come to you.",
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
        className={`${instrument.className} ${splineMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
