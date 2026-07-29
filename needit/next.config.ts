import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Deliberately assembled here rather than in the proxy so it's reviewable in
 * one block. Notes on the loose bits, because a CSP nobody understands gets
 * widened until it means nothing:
 *
 * - `'unsafe-inline'` on script-src: Next's App Router streams inline bootstrap
 *   scripts and inline JSON flight payloads. Removing it requires per-request
 *   nonces threaded through the proxy — worth doing, but it is a Phase 4
 *   hardening item, not a Phase 1 blocker.
 * - `'unsafe-inline'` on style-src: next/font injects an inline <style> block.
 * - `img-src` allows https: because offer/need photos live in Supabase Storage
 *   and card images will later come from a catalog CDN.
 * - `frame-ancestors 'none'` is the one that actually stops clickjacking; the
 *   X-Frame-Options header below is the legacy twin for older browsers.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  // HSTS: two years, subdomains included. `send.exprifi.com` (Resend) serves no
  // HTTP content, so including subdomains costs nothing.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Full URLs leak need ids and usernames into third-party referer logs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // cacheComponents (Next 16 experimental caching) is disabled: this app is
  // auth-gated and highly dynamic, so pages render on-demand rather than being
  // statically prerendered. Re-evaluate caching optimizations post-MVP.
  experimental: {
    // Allow photo uploads through server actions (default is 1mb).
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },

  // Note: Next 16 dropped the top-level `eslint` config key, and type errors
  // already fail the build by default. Nothing to opt into here — the
  // guarantee we wanted is the default.

  // Don't advertise the framework version to scanners.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The health endpoint is polled by uptime monitors — never cache it.
      {
        source: "/api/health",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  /**
   * Domain cutover: one canonical host.
   *
   * Everything Kyle posted during the build points at need-it.vercel.app. A
   * permanent redirect tells search engines to move their index to exprifi.com
   * and keeps old bookmarks working, instead of serving a duplicate copy of the
   * marketplace on a second domain.
   *
   * `has` scopes this to that exact host so preview deployments still work
   * normally — a blanket redirect would break every preview URL.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "need-it.vercel.app" }],
        destination: "https://exprifi.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
