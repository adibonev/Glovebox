import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** The public pages worth finding by search. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/za-nas", 0.6, "monthly"),
    page("/login", 0.4, "yearly"),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
  ];
}
