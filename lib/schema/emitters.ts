import { buildCanonicalUrl, getSiteOrigin, SEO_SITE_NAME } from "@/lib/seo";

import { assertValidJsonLdSchema } from "./validators";
import type {
  ArticleSchema,
  BreadcrumbListSchema,
  DefinedTermSchema,
  FAQPageSchema,
  JsonLdSchema,
  OrganizationSchema,
  SchemaBreadcrumbItem,
  TechArticleSchema,
  WebPageSchema,
  WebSiteSchema
} from "./types";

function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function normalizeSchemaPayload<T extends JsonLdSchema>(payload: T): T {
  return assertValidJsonLdSchema(payload) as T;
}

export function createOrganizationSchema(input?: {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}): OrganizationSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input?.name ?? SEO_SITE_NAME,
    url: input?.url ?? getSiteOrigin(),
    logo: input?.logo,
    sameAs: input?.sameAs
  });
}

export function createWebSiteSchema(input?: {
  name?: string;
  url?: string;
  publisherName?: string;
}): WebSiteSchema {
  const siteName = input?.name ?? SEO_SITE_NAME;
  const siteUrl = input?.url ?? getSiteOrigin();

  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    publisher: {
      "@type": "Organization",
      name: input?.publisherName ?? siteName,
      url: siteUrl
    }
  });
}

export function createWebPageSchema(input: {
  name: string;
  description: string;
  path: string;
}): WebPageSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: buildCanonicalUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: SEO_SITE_NAME,
      url: getSiteOrigin()
    }
  });
}

function createArticleBase(input: {
  headline: string;
  description: string;
  path: string;
  authorName?: string;
  publisherName?: string;
}) {
  return {
    headline: input.headline,
    description: input.description,
    url: buildCanonicalUrl(input.path),
    author: {
      "@type": "Organization" as const,
      name: input.authorName ?? SEO_SITE_NAME
    },
    publisher: {
      "@type": "Organization" as const,
      name: input.publisherName ?? SEO_SITE_NAME,
      url: getSiteOrigin()
    }
  };
}

export function createArticleSchema(input: {
  headline: string;
  description: string;
  path: string;
  authorName?: string;
  publisherName?: string;
}): ArticleSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "Article",
    ...createArticleBase(input)
  });
}

export function createTechArticleSchema(input: {
  headline: string;
  description: string;
  path: string;
  authorName?: string;
  publisherName?: string;
  proficiencyLevel?: "beginner" | "intermediate" | "advanced";
}): TechArticleSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    ...createArticleBase(input),
    proficiencyLevel: input.proficiencyLevel
  });
}

export function createFAQPageSchema(input: {
  name: string;
  path: string;
  entries: Array<{ question: string; answer: string }>;
}): FAQPageSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: input.name,
    url: buildCanonicalUrl(input.path),
    mainEntity: input.entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer
      }
    }))
  });
}

export function createDefinedTermSchema(input: {
  name: string;
  description: string;
  path: string;
  inDefinedTermSetPath?: string;
}): DefinedTermSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: input.name,
    description: input.description,
    url: buildCanonicalUrl(input.path),
    inDefinedTermSet: input.inDefinedTermSetPath
      ? buildCanonicalUrl(input.inDefinedTermSetPath)
      : undefined
  });
}

export function createBreadcrumbListSchema(items: SchemaBreadcrumbItem[]): BreadcrumbListSchema {
  return normalizeSchemaPayload({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  });
}

export function createBreadcrumbListSchemaFromLinks(
  links: Array<{ label: string; href: string }>
): BreadcrumbListSchema | null {
  if (!links.length) {
    return null;
  }

  return createBreadcrumbListSchema(
    links.map((link) => ({
      name: link.label,
      item: buildCanonicalUrl(link.href)
    }))
  );
}

export function serializeJsonLd(payload: JsonLdSchema | JsonLdSchema[]): string {
  return JSON.stringify(ensureArray(payload));
}

export function validateJsonLdPayloads(payload: JsonLdSchema | JsonLdSchema[]): JsonLdSchema[] {
  return ensureArray(payload).map((item) => assertValidJsonLdSchema(item));
}
