import { z } from "zod";

import { CONTENT_PIPELINE_SCHEMA_VERSION } from "@/lib/content/pipeline";

export const FEED_SCHEMA_VERSION = "1.0.0";

export const RecentFeedItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  technicalSummary: z.string().min(1),
  canonicalPath: z.string().min(1),
  updatedAt: z.string().min(1),
  tags: z.array(z.string().min(1)),
  readingTimeMinutes: z.number().int().positive(),
  excerpt: z.string().min(1)
});

export const RecentFeedContractSchema = z.object({
  schemaVersion: z.literal(FEED_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  totalDocuments: z.number().int().min(0),
  items: z.array(RecentFeedItemSchema)
});

export const KnowledgeExportItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  technicalSummary: z.string().min(1),
  canonicalPath: z.string().min(1),
  updatedAt: z.string().min(1),
  layer: z.enum(["software", "knowledge", "regulatory"]),
  type: z.enum([
    "institutional-page",
    "article",
    "knowledge-base",
    "faq",
    "glossary-term",
    "changelog"
  ]),
  tags: z.array(z.string().min(1)),
  headings: z.array(z.string().min(1)),
  readingTimeMinutes: z.number().int().positive()
});

export const KnowledgeExportContractSchema = z.object({
  schemaVersion: z.literal(FEED_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  totalDocuments: z.number().int().min(0),
  items: z.array(KnowledgeExportItemSchema)
});

export const LocalSearchIndexContractSchema = z.object({
  schemaVersion: z.literal(CONTENT_PIPELINE_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  totalDocuments: z.number().int().min(0),
  entries: z.array(
    z.object({
      id: z.string().min(1),
      slug: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().min(1),
      technicalSummary: z.string().min(1),
      canonicalPath: z.string().min(1),
      layer: z.enum(["software", "knowledge", "regulatory"]),
      type: z.enum([
        "institutional-page",
        "article",
        "knowledge-base",
        "faq",
        "glossary-term",
        "changelog"
      ]),
      updatedAt: z.string().min(1),
      tags: z.array(z.string().min(1)),
      headings: z.array(z.string().min(1)),
      readingTimeMinutes: z.number().int().positive(),
      tokens: z.array(z.string().min(1))
    })
  )
});

export const JsonFeedItemSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  content_text: z.string().min(1),
  date_modified: z.string().min(1),
  tags: z.array(z.string().min(1))
});

export const JsonFeedContractSchema = z.object({
  version: z.literal("https://jsonfeed.org/version/1.1"),
  title: z.string().min(1),
  home_page_url: z.string().min(1),
  feed_url: z.string().min(1),
  description: z.string().min(1),
  items: z.array(JsonFeedItemSchema)
});

export type RecentFeedContract = z.infer<typeof RecentFeedContractSchema>;
export type KnowledgeExportContract = z.infer<typeof KnowledgeExportContractSchema>;
export type LocalSearchIndexContract = z.infer<typeof LocalSearchIndexContractSchema>;
export type JsonFeedContract = z.infer<typeof JsonFeedContractSchema>;
