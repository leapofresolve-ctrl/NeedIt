import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * robots.txt
 *
 * The disallow list is the interesting part. These paths were unreachable to a
 * crawler until the proxy flipped to a denylist; a signed-out crawler still
 * gets redirected from them, but saying so explicitly saves crawl budget and,
 * more importantly, keeps auth screens out of search results — a "Sign in to
 * Exprifi" page ranking for the brand name is free real estate for a phishing
 * lookalike.
 *
 * `/auth/confirm` is listed for a different reason: those URLs carry one-time
 * tokens. Nothing should ever be pointed at them by a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth/",
          "/settings",
          "/notifications",
          "/alerts",
          "/completed-deals",
          "/metrics",
          "/onboarding",
          "/deals",
          "/protected",
          "/post",
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
