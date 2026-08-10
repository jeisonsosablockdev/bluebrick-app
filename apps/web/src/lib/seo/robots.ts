import type { MetadataRoute } from "next";

import { buildCanonicalUrl, getSiteOrigin } from "./site";

const PRIVATE_PATH_PREFIXES = ["/admin", "/protected", "/api", "/checkout"];

export interface RobotsPolicyInput {
  isProduction: boolean;
  sitemapPath?: string;
}

export function buildRobotsPolicy({
  isProduction,
  sitemapPath = "/sitemap.xml"
}: RobotsPolicyInput): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      },
      sitemap: buildCanonicalUrl(sitemapPath),
      host: getSiteOrigin()
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATH_PREFIXES
      }
    ],
    sitemap: buildCanonicalUrl(sitemapPath),
    host: getSiteOrigin()
  };
}
