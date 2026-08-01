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

  /*
   * REMOVED Aug 1, 2026 — the need-it.vercel.app → exprifi.com 301.
   *
   * It was written during the domain cutover to keep old links and search
   * index moving to the canonical host. It was dead code by the time it was
   * removed: `need-it.vercel.app` is no longer attached to the Vercel project
   * (Domains lists only exprifi.com and www.exprifi.com), so requests to that
   * host return DEPLOYMENT_NOT_FOUND at the edge and never reach the app —
   * a redirect defined here can't run if the request never arrives.
   *
   * Kept as a comment rather than deleted silently because the config used to
   * claim a protection that wasn't in force, and the next person to wonder
   * "where did old links go?" deserves the real answer: they 404, by decision,
   * Aug 1. If that ever needs reversing, re-attach the domain in Vercel FIRST
   * — restoring this block alone does nothing.
   */
};

export default nextConfig;
