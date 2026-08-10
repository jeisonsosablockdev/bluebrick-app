import {
  createArticleSchema,
  createBreadcrumbListSchemaFromLinks,
  createDefinedTermSchema,
  createFAQPageSchema,
  createTechArticleSchema,
  createWebPageSchema,
  validateJsonLdPayloads
} from "./emitters";
import type { JsonLdSchema } from "./types";

interface TemplateBreadcrumbLink {
  label: string;
  href: string;
}

function withBreadcrumb(
  schemas: JsonLdSchema[],
  breadcrumbs?: TemplateBreadcrumbLink[]
): JsonLdSchema[] {
  const breadcrumbSchema = breadcrumbs?.length
    ? createBreadcrumbListSchemaFromLinks(breadcrumbs)
    : null;

  return validateJsonLdPayloads(breadcrumbSchema ? [...schemas, breadcrumbSchema] : schemas);
}

export function createInstitutionalTemplateSchemas(input: {
  title: string;
  summary: string;
  path: string;
  breadcrumbs?: TemplateBreadcrumbLink[];
}): JsonLdSchema[] {
  return withBreadcrumb(
    [
      createWebPageSchema({
        name: input.title,
        description: input.summary,
        path: input.path
      })
    ],
    input.breadcrumbs
  );
}

export function createKnowledgeHubTemplateSchemas(input: {
  title: string;
  summary: string;
  path: string;
  breadcrumbs?: TemplateBreadcrumbLink[];
}): JsonLdSchema[] {
  return withBreadcrumb(
    [
      createWebPageSchema({
        name: input.title,
        description: input.summary,
        path: input.path
      })
    ],
    input.breadcrumbs
  );
}

export function createArticleTemplateSchemas(input: {
  title: string;
  summary: string;
  path: string;
  breadcrumbs?: TemplateBreadcrumbLink[];
  technical?: boolean;
}): JsonLdSchema[] {
  const articleSchema = input.technical
    ? createTechArticleSchema({
        headline: input.title,
        description: input.summary,
        path: input.path,
        proficiencyLevel: "intermediate"
      })
    : createArticleSchema({
        headline: input.title,
        description: input.summary,
        path: input.path
      });

  return withBreadcrumb([articleSchema], input.breadcrumbs);
}

export function createFaqTemplateSchemas(input: {
  title: string;
  summary: string;
  path: string;
  entries: Array<{ question: string; answer: string }>;
  breadcrumbs?: TemplateBreadcrumbLink[];
}): JsonLdSchema[] {
  return withBreadcrumb(
    [
      createFAQPageSchema({
        name: input.title,
        path: input.path,
        entries: input.entries
      })
    ],
    input.breadcrumbs
  );
}

export function createDefinitionTemplateSchemas(input: {
  term: string;
  summary: string;
  definition: string;
  path: string;
  breadcrumbs?: TemplateBreadcrumbLink[];
}): JsonLdSchema[] {
  return withBreadcrumb(
    [
      createDefinedTermSchema({
        name: input.term,
        description: input.definition || input.summary,
        path: input.path,
        inDefinedTermSetPath: "/knowledge/definitions"
      })
    ],
    input.breadcrumbs
  );
}

export function createResourceTemplateSchemas(input: {
  title: string;
  summary: string;
  path: string;
  breadcrumbs?: TemplateBreadcrumbLink[];
}): JsonLdSchema[] {
  return withBreadcrumb(
    [
      createArticleSchema({
        headline: input.title,
        description: input.summary,
        path: input.path
      })
    ],
    input.breadcrumbs
  );
}
