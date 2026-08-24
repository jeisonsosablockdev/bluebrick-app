/**
 * @file apps/web/src/app/robots.ts
 * @description Layer 1: Presentation - Next.js App Router Dynamic Robots.txt Generator.
 * Controls web crawler accessibility and links to canonical sitemap.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bluebrick-app.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/callback"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
