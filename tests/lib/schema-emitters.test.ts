import { describe, expect, it } from "vitest";

import {
  createArticleSchema,
  createBreadcrumbListSchema,
  createBreadcrumbListSchemaFromLinks,
  createDefinedTermSchema,
  createFAQPageSchema,
  createOrganizationSchema,
  createTechArticleSchema,
  createWebPageSchema,
  createWebSiteSchema,
  validateJsonLdSchema,
  validateJsonLdPayloads
} from "@/lib/schema";

describe("lib/schema emitters", () => {
  it("creates organization and website schemas", () => {
    const organization = createOrganizationSchema();
    const website = createWebSiteSchema();

    expect(organization["@type"]).toBe("Organization");
    expect(website["@type"]).toBe("WebSite");
    expect(validateJsonLdSchema(organization)).toBe(true);
    expect(validateJsonLdSchema(website)).toBe(true);
  });

  it("creates webpage and article schemas", () => {
    const webPage = createWebPageSchema({
      name: "Knowledge",
      description: "Knowledge hub",
      path: "/knowledge"
    });
    const article = createArticleSchema({
      headline: "Tokenization Fundamentals",
      description: "Article body summary",
      path: "/knowledge/articles/tokenization-fundamentals"
    });
    const techArticle = createTechArticleSchema({
      headline: "Tokenization Implementation Notes",
      description: "Technical article",
      path: "/knowledge/articles/tokenization-implementation-notes",
      proficiencyLevel: "intermediate"
    });

    expect(webPage["@type"]).toBe("WebPage");
    expect(article["@type"]).toBe("Article");
    expect(techArticle["@type"]).toBe("TechArticle");
    expect(validateJsonLdSchema(webPage)).toBe(true);
    expect(validateJsonLdSchema(article)).toBe(true);
    expect(validateJsonLdSchema(techArticle)).toBe(true);
  });

  it("creates FAQ and defined term schemas with required fields", () => {
    const faqSchema = createFAQPageSchema({
      name: "Knowledge FAQ",
      path: "/knowledge/faq",
      entries: [
        {
          question: "What is BRIDS?",
          answer: "A tokenization and discovery platform."
        }
      ]
    });

    const termSchema = createDefinedTermSchema({
      name: "Yield",
      description: "Net periodic return.",
      path: "/knowledge/definitions/yield",
      inDefinedTermSetPath: "/knowledge/definitions"
    });

    expect(faqSchema.mainEntity).toHaveLength(1);
    expect(termSchema.inDefinedTermSet).toContain("/knowledge/definitions");
    expect(validateJsonLdSchema(faqSchema)).toBe(true);
    expect(validateJsonLdSchema(termSchema)).toBe(true);
  });

  it("creates breadcrumb list schemas", () => {
    const breadcrumbList = createBreadcrumbListSchema([
      { name: "Home", item: "https://brids.com/" },
      { name: "Knowledge", item: "https://brids.com/knowledge" }
    ]);
    const fromLinks = createBreadcrumbListSchemaFromLinks([
      { label: "Home", href: "/" },
      { label: "Knowledge", href: "/knowledge" }
    ]);

    expect(breadcrumbList.itemListElement).toHaveLength(2);
    expect(fromLinks?.itemListElement).toHaveLength(2);
    expect(validateJsonLdSchema(breadcrumbList)).toBe(true);
    expect(fromLinks && validateJsonLdSchema(fromLinks)).toBe(true);
  });

  it("validates payload arrays", () => {
    const payloads = validateJsonLdPayloads([
      createOrganizationSchema(),
      createWebSiteSchema(),
      createWebPageSchema({
        name: "Home",
        description: "Home page",
        path: "/"
      })
    ]);

    expect(payloads).toHaveLength(3);
  });
});
