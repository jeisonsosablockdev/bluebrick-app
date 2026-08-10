import { z } from "zod";

import type { JsonLdSchema } from "./types";

const contextSchema = z.literal("https://schema.org");
const nonEmptyText = z.string().trim().min(1);
const nonEmptyUrl = z.string().url();

const organizationSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("Organization"),
  name: nonEmptyText,
  url: nonEmptyUrl,
  logo: nonEmptyUrl.optional(),
  sameAs: z.array(nonEmptyUrl).optional()
});

const webSiteSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("WebSite"),
  name: nonEmptyText,
  url: nonEmptyUrl,
  publisher: z
    .object({
      "@type": z.literal("Organization"),
      name: nonEmptyText,
      url: nonEmptyUrl
    })
    .optional()
});

const webPageSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("WebPage"),
  name: nonEmptyText,
  description: nonEmptyText,
  url: nonEmptyUrl,
  isPartOf: z
    .object({
      "@type": z.literal("WebSite"),
      name: nonEmptyText,
      url: nonEmptyUrl
    })
    .optional()
});

const articleBase = z.object({
  headline: nonEmptyText,
  description: nonEmptyText,
  url: nonEmptyUrl,
  author: z.object({
    "@type": z.literal("Organization"),
    name: nonEmptyText
  }),
  publisher: z.object({
    "@type": z.literal("Organization"),
    name: nonEmptyText,
    url: nonEmptyUrl
  })
});

const articleSchema = articleBase.extend({
  "@context": contextSchema,
  "@type": z.literal("Article")
});

const techArticleSchema = articleBase.extend({
  "@context": contextSchema,
  "@type": z.literal("TechArticle"),
  proficiencyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional()
});

const faqPageSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("FAQPage"),
  name: nonEmptyText,
  url: nonEmptyUrl,
  mainEntity: z
    .array(
      z.object({
        "@type": z.literal("Question"),
        name: nonEmptyText,
        acceptedAnswer: z.object({
          "@type": z.literal("Answer"),
          text: nonEmptyText
        })
      })
    )
    .min(1)
});

const definedTermSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("DefinedTerm"),
  name: nonEmptyText,
  description: nonEmptyText,
  url: nonEmptyUrl,
  inDefinedTermSet: nonEmptyUrl.optional()
});

const breadcrumbListSchema = z.object({
  "@context": contextSchema,
  "@type": z.literal("BreadcrumbList"),
  itemListElement: z
    .array(
      z.object({
        "@type": z.literal("ListItem"),
        position: z.number().int().positive(),
        name: nonEmptyText,
        item: nonEmptyUrl
      })
    )
    .min(1)
});

const schemaUnion = z.discriminatedUnion("@type", [
  organizationSchema,
  webSiteSchema,
  webPageSchema,
  articleSchema,
  techArticleSchema,
  faqPageSchema,
  definedTermSchema,
  breadcrumbListSchema
]);

export function validateJsonLdSchema(payload: unknown): payload is JsonLdSchema {
  return schemaUnion.safeParse(payload).success;
}

export function assertValidJsonLdSchema(payload: unknown): JsonLdSchema {
  return schemaUnion.parse(payload);
}
