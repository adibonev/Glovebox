import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Crawl the public pages; leave out the signed-in app, the API, and the pages that are private by
 * nature. A passport or an invite is for whoever was sent the link, not for a search engine.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/p/",
        "/i/",
        "/s/",
        "/start",
        "/account",
        "/admin",
        "/analysis",
        "/documents",
        "/reminders",
        "/services",
        "/vehicles",
        "/add-service",
        "/billing",
        "/paywall",
        "/auth/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
