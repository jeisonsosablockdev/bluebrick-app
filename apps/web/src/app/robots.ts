/**
 * @file apps/web/src/app/robots.ts
 * @description Layer 1: Presentation - Next.js App Router Dynamic Robots.txt Generator.
 * Controls web crawler accessibility and links to canonical sitemap.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Step 1: Resolve canonical base URL from environment or production fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bluebrick-app.vercel.app";

  // Step 2: Return crawler rules allowing public surfaces and blocking internal auth/API handlers
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/callback", "/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
