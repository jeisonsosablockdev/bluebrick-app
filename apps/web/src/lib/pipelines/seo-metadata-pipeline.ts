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
  "@type": "FinancialService" | "RealEstateAgent" | string[];
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  areaServed?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string;
}

const DEFAULT_SITE_URL = "https://bluebrick-app.vercel.app";
const DEFAULT_SITE_NAME = "BlueBrick";
const DEFAULT_DESCRIPTION =
  "Plataforma institucional de inversión inmobiliaria fraccionada. Invierte en activos premium con retornos transparentes y dividendos mensuales.";

/**
 * Builds complete Next.js 16 App Router Metadata object.
 *
 * @param config Custom SEO parameters for the specific page.
 * @returns Fully populated Next.js Metadata object.
 */
export function buildPageMetadata(config: SeoMetadataConfig): Metadata {
  // Step 1: Resolve canonical hostname and route URLs
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const canonicalUrl = `${siteUrl}${config.pathname || ""}`;
  const fullTitle = `${config.title} | ${DEFAULT_SITE_NAME}`;
  const imageUrl = config.imageUrl || `${siteUrl}/opengraph-image`;

  // Step 2: Assemble complete OpenGraph, Twitter, and canonical metadata
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
 * Generates Schema.org JSON-LD structured data for the financial real estate investment platform.
 */
export function generatePlatformJsonLd(): SchemaOrgOrganization {
  // Step 1: Resolve base URL and metadata endpoints
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;

  // Step 2: Return structured composite FinancialService entity
  return {
    "@context": "https://schema.org",
    "@type": ["FinancialService", "RealEstateAgent"],
    name: "BlueBrick Platform",
    url: siteUrl,
    logo: `${siteUrl}/icon`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      "https://twitter.com/bluebrick_app",
      "https://linkedin.com/company/bluebrick-app",
      "https://github.com/jeisonsosablockdev/bluebrick-app",
    ],
    areaServed: "Global",
    currenciesAccepted: "USD, USDC, COP",
    paymentAccepted: "Credit Card, Bank Transfer, Crypto",
  };
}
