/**
 * @file apps/web/src/app/sitemap.ts
 * @description Layer 1: Presentation - Next.js App Router Dynamic Sitemap Generator.
 * Generates search engine indexing entries for BlueBrick public routes.
 */

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Step 1: Resolve base URL from environment or production fallback
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bluebrick-app.vercel.app";
  const now = new Date();

  // Step 2: Return dynamic sitemap entries for public landing and demo investment dashboard
  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
