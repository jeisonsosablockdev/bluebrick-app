/**
 * @file apps/web/src/app/sitemap.ts
 * @description Layer 1: Presentation - Dynamic Sitemap route handler.
 */

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Step 1: Return starter URL entry
  return [
    {
      url: "https://localhost:3000",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
