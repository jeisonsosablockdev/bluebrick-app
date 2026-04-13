import type { MetadataRoute } from "next";

import { buildRobotsPolicy } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsPolicy({
    isProduction: process.env.NODE_ENV === "production"
  });
}
