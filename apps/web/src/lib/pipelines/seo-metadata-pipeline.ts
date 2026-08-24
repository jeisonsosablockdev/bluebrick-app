/**
 * @file apps/web/src/lib/pipelines/seo-metadata-pipeline.ts
 * @description Layer 3: Domain & Pipelines - SEO Metadata & Schema.org JSON-LD Generation Pipeline.
 * Generates OpenGraph, Twitter cards, canonical tags, and structured JSON-LD entities.
 */

import type { Metadata } from "next";

export interface SeoMetadataConfig {
  title: string;
  description: string;
  pathname?: string;
  ogType?: "website" | "article";
  imageUrl?: string;
}

export interface SchemaOrgOrganization {
  "@context": "https://schema.org";
  "@type": "FinancialService" | "InvestmentOrDeposit";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

const DEFAULT_SITE_URL = "https://bluebrick-app.vercel.app";
const DEFAULT_SITE_NAME = "BlueBrick";
const DEFAULT_DESCRIPTION =
  "Plataforma institucional de inversión inmobiliaria fraccionada. Invierte en activos premium con retornos transparentes.";

/**
 * Builds complete Next.js 16 App Router Metadata object.
 *
 * @param config Custom SEO parameters for the specific page.
 * @returns Fully populated Next.js Metadata object.
 */
export function buildPageMetadata(config: SeoMetadataConfig): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const canonicalUrl = `${siteUrl}${config.pathname || ""}`;
  const fullTitle = `${config.title} | ${DEFAULT_SITE_NAME}`;
  const imageUrl = config.imageUrl || `${siteUrl}/og-image.png`;

  return {
    title: fullTitle,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: config.description,
      url: canonicalUrl,
      siteName: DEFAULT_SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: "es_ES",
      type: config.ogType || "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: config.description,
      images: [imageUrl],
      creator: "@bluebrick_app",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Generates Schema.org JSON-LD structured data for the financial investment platform.
 */
export function generatePlatformJsonLd(): SchemaOrgOrganization {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: "BlueBrick Platform",
    url: siteUrl,
    logo: `${siteUrl}/brand-emblem.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      "https://twitter.com/bluebrick_app",
      "https://linkedin.com/company/bluebrick-app",
    ],
  };
}
