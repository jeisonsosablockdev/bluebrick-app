import type { Metadata } from "next";

import type { DocumentStatus } from "@/lib/content/types";

import {
  buildRobotsDirectives,
  isIndexablePage,
  resolveSeoSectionFromPath,
  type SeoSection
} from "./policy";
import {
  buildCanonicalUrl,
  getSiteOrigin,
  normalizeRoutePath,
  resolveOpenGraphImageUrl,
  SEO_DEFAULT_DESCRIPTION,
  SEO_SITE_NAME
} from "./site";

export interface SeoPageMetadataInput {
  title: string;
  description: string;
  path: string;
  section?: SeoSection;
  status?: DocumentStatus;
  keywords?: string[];
  imagePath?: string;
  explicitIndex?: boolean;
  explicitNoIndex?: boolean;
}

function buildOpenGraphMetadata(input: SeoPageMetadataInput, canonicalUrl: string): NonNullable<Metadata["openGraph"]> {
  const imageUrl = resolveOpenGraphImageUrl(input.imagePath);

  return {
    type: "website",
    url: canonicalUrl,
    title: input.title,
    description: input.description,
    siteName: SEO_SITE_NAME,
    images: imageUrl ? [{ url: imageUrl, alt: input.title }] : undefined
  };
}

function buildTwitterMetadata(input: SeoPageMetadataInput): NonNullable<Metadata["twitter"]> {
  const imageUrl = resolveOpenGraphImageUrl(input.imagePath);

  return {
    card: imageUrl ? "summary_large_image" : "summary",
    title: input.title,
    description: input.description,
    images: imageUrl ? [imageUrl] : undefined
  };
}

export function createPageMetadata(input: SeoPageMetadataInput): Metadata {
  const canonicalPath = normalizeRoutePath(input.path);
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const section = input.section ?? resolveSeoSectionFromPath(canonicalPath);
  const indexable = isIndexablePage({
    path: canonicalPath,
    section,
    status: input.status,
    explicitIndex: input.explicitIndex,
    explicitNoIndex: input.explicitNoIndex
  });

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: buildOpenGraphMetadata(input, canonicalUrl),
    twitter: buildTwitterMetadata(input),
    robots: buildRobotsDirectives(indexable),
    other: {
      "x-seo-section": section
    }
  };
}

export interface RootMetadataOverrides {
  title?: string;
  description?: string;
}

export function createRootMetadata(overrides?: RootMetadataOverrides): Metadata {
  const title = overrides?.title ?? SEO_SITE_NAME;
  const description = overrides?.description ?? SEO_DEFAULT_DESCRIPTION;
  const faviconPath = "/favicon.svg";

  return {
    metadataBase: new URL(getSiteOrigin()),
    title: {
      default: title,
      template: `%s | ${SEO_SITE_NAME}`
    },
    description,
    openGraph: {
      type: "website",
      siteName: SEO_SITE_NAME,
      title,
      description,
      url: getSiteOrigin()
    },
    twitter: {
      card: "summary",
      title,
      description
    },
    icons: {
      icon: [{ url: faviconPath, type: "image/svg+xml" }],
      shortcut: [faviconPath]
    }
  };
}
