/**
 * @file apps/web/src/app/robots.ts
 * @description Layer 1: Presentation - Robots metadata route handler.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Step 1: Return open crawling rules
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
