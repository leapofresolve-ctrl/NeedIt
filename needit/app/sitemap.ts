import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

/**
 * sitemap.xml — the acquisition side of public browsing.
 *
 * A reverse marketplace has an unusual SEO shape. Every need is a page that
 * answers a long-tail query someone is actually typing — "who buys 1990s
 * basketball bulk", "sell CJ Stroud Prizm rookie" — and it's a page nobody else
 * can write, because it's demand, not a listing. That is worth more to Exprifi
 * than any amount of marketing copy, and it was completely invisible while the
 * app sat behind a login.
 *
 * WHAT'S IN HERE, AND WHAT ISN'T
 *  * Open public needs only. A matched need still *renders* for anyone with the
 *    link (see migration 0015), but pushing filled needs into the index would
 *    train Google that Exprifi results are stale.
 *  * Profiles only where the member left `allow_indexing` on (0012). Opting out
 *    of search while staying visible on the board is a reasonable thing to want
 *    from a pseudonymous marketplace, and honouring it here is the only place
 *    that setting can actually mean anything.
 *  * Nothing that requires a session. If it's in PROTECTED in the proxy, it
 *    doesn't belong in a sitemap.
 *
 * Fails soft: if Supabase is unreachable this returns the static pages rather
 * than throwing, because a 500 on /sitemap.xml gets the whole file dropped from
 * Search Console.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/how-it-works"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/help"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/legal/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/legal/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/legal/prohibited-items"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/legal/off-platform"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [{ data: needs }, { data: profiles }] = await Promise.all([
      supabase
        .from("requests")
        .select("id, created_at")
        .eq("visibility", "public")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profiles")
        .select("username, created_at")
        .eq("profile_public", true)
        .eq("allow_indexing", true)
        .not("username", "is", null)
        .limit(5000),
    ]);

    const needPages: MetadataRoute.Sitemap = (needs ?? []).map((n) => ({
      url: absoluteUrl(`/request/${n.id}`),
      lastModified: n.created_at ? new Date(n.created_at) : now,
      // Needs expire and fill. Daily keeps the index roughly honest without
      // asking Google to re-crawl a board that may only change a few times a day.
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    const profilePages: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
      url: absoluteUrl(`/u/${p.username}`),
      lastModified: p.created_at ? new Date(p.created_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [...staticPages, ...needPages, ...profilePages];
  } catch {
    return staticPages;
  }
}
