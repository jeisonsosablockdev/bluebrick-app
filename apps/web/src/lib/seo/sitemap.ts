import type { MetadataRoute } from "next";

import type { DocumentStatus } from "@/lib/content/types";

import { isIndexablePage, type SeoSection } from "./policy";
import { buildCanonicalUrl } from "./site";

interface PublicSitemapEntry {
  path: string;
  status?: DocumentStatus;
  section?: SeoSection;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
}

const DEFAULT_CHANGE_FREQUENCY: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly";

const DEFAULT_PUBLIC_SITEMAP_ENTRIES: PublicSitemapEntry[] = [
  { path: "/", section: "home", changeFrequency: "daily", priority: 1 },
  { path: "/about", section: "other", changeFrequency: "monthly", priority: 0.7 },
  { path: "/platform", section: "other", changeFrequency: "monthly", priority: 0.8 },
  { path: "/software", section: "software", changeFrequency: "weekly", priority: 0.8 },
  { path: "/regulatory", section: "regulatory", changeFrequency: "weekly", priority: 0.8 },
  { path: "/knowledge", section: "knowledge", changeFrequency: "weekly", priority: 0.9 },
  { path: "/knowledge/faq", section: "knowledge", changeFrequency: "weekly", priority: 0.7 },
  {
    path: "/knowledge/articles/tokenization-fundamentals",
    section: "knowledge",
    status: "published",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/knowledge/definitions/yield",
    section: "knowledge",
    status: "published",
    changeFrequency: "monthly",
    priority: 0.6
  },
  {
    path: "/resources/platform-release-notes",
    section: "other",
    status: "published",
    changeFrequency: "monthly",
    priority: 0.6
  },
  { path: "/marketplace", section: "marketplace", changeFrequency: "daily", priority: 0.9 },
  { path: "/transparencia", section: "transparency", changeFrequency: "weekly", priority: 0.8 }
];

export function getDefaultPublicSitemapEntries(): ReadonlyArray<PublicSitemapEntry> {
  return DEFAULT_PUBLIC_SITEMAP_ENTRIES;
}

export function buildPublicSitemap(entries = DEFAULT_PUBLIC_SITEMAP_ENTRIES): MetadataRoute.Sitemap {
  const now = new Date();

  return entries
    .filter((entry) =>
      isIndexablePage({
        path: entry.path,
        section: entry.section,
        status: entry.status
      })
    )
    .map((entry) => ({
      url: buildCanonicalUrl(entry.path),
      lastModified: now,
      changeFrequency: entry.changeFrequency ?? DEFAULT_CHANGE_FREQUENCY,
      priority: entry.priority ?? 0.5
    }));
}
