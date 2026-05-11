import { describe, expect, it } from "vitest";

import {
  createArticleTemplateSchemas,
  createDefinitionTemplateSchemas,
  createFaqTemplateSchemas,
  createInstitutionalTemplateSchemas,
  createKnowledgeHubTemplateSchemas,
  createResourceTemplateSchemas
} from "@/lib/schema";

describe("lib/schema template emitters", () => {
  it("creates institutional template schema bundle", () => {
    const schemas = createInstitutionalTemplateSchemas({
      title: "About",
      summary: "Company profile.",
      path: "/about",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" }
      ]
    });

    expect(schemas.map((schema) => schema["@type"])).toEqual(["WebPage", "BreadcrumbList"]);
    expect(schemas).toMatchSnapshot();
  });

  it("creates knowledge/article/faq/definition/resource schema bundles", () => {
    const articleSchemas = createArticleTemplateSchemas({
      title: "Tokenization Fundamentals",
      summary: "Technical foundations.",
      path: "/knowledge/articles/tokenization-fundamentals",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" },
        { label: "Tokenization Fundamentals", href: "/knowledge/articles/tokenization-fundamentals" }
      ],
      technical: true
    });
    const knowledgeHubSchemas = createKnowledgeHubTemplateSchemas({
      title: "Knowledge",
      summary: "Hub summary",
      path: "/knowledge",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" }
      ]
    });
    const faqSchemas = createFaqTemplateSchemas({
      title: "FAQ",
      summary: "FAQ summary",
      path: "/knowledge/faq",
      entries: [{ question: "Q1", answer: "A1" }],
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" },
        { label: "FAQ", href: "/knowledge/faq" }
      ]
    });
    const definitionSchemas = createDefinitionTemplateSchemas({
      term: "Yield",
      summary: "Definition summary",
      definition: "Net periodic return.",
      path: "/knowledge/definitions/yield",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Knowledge", href: "/knowledge" },
        { label: "Yield", href: "/knowledge/definitions/yield" }
      ]
    });
    const resourceSchemas = createResourceTemplateSchemas({
      title: "Release Notes",
      summary: "Release summary",
      path: "/resources/release-notes",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Resources", href: "/resources" },
        { label: "Release Notes", href: "/resources/release-notes" }
      ]
    });

    expect(articleSchemas.map((schema) => schema["@type"])).toEqual(["TechArticle", "BreadcrumbList"]);
    expect(knowledgeHubSchemas.map((schema) => schema["@type"])).toEqual(["WebPage", "BreadcrumbList"]);
    expect(faqSchemas.map((schema) => schema["@type"])).toEqual(["FAQPage", "BreadcrumbList"]);
    expect(definitionSchemas.map((schema) => schema["@type"])).toEqual(["DefinedTerm", "BreadcrumbList"]);
    expect(resourceSchemas.map((schema) => schema["@type"])).toEqual(["Article", "BreadcrumbList"]);

    expect({ articleSchemas, knowledgeHubSchemas, faqSchemas, definitionSchemas, resourceSchemas }).toMatchSnapshot();
  });
});
