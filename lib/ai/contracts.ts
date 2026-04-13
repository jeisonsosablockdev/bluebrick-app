import { z } from "zod";

export const AI_SCHEMA_VERSION = "1.0.0";

const AiLayerSchema = z.enum(["software", "knowledge", "regulatory"]);
const AiDocumentTypeSchema = z.enum([
  "institutional-page",
  "article",
  "knowledge-base",
  "faq",
  "glossary-term",
  "changelog"
]);

export const AiDocumentItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  layer: AiLayerSchema,
  type: AiDocumentTypeSchema,
  canonicalPath: z.string().min(1),
  updatedAt: z.string().min(1),
  tags: z.array(z.string().min(1))
});

export const AiKnowledgeContractSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  items: z.array(AiDocumentItemSchema)
});

export const AiDefinitionItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  term: z.string().min(1),
  summary: z.string().min(1),
  canonicalPath: z.string().min(1),
  updatedAt: z.string().min(1),
  layer: AiLayerSchema,
  tags: z.array(z.string().min(1))
});

export const AiDefinitionsContractSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  items: z.array(AiDefinitionItemSchema)
});

export const AiEntityItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  sourceType: z.enum(["tag", "glossary-term"]),
  relatedDocumentSlugs: z.array(z.string().min(1))
});

export const AiEntitiesContractSchema = z.object({
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  items: z.array(AiEntityItemSchema)
});

export type AiDocumentItem = z.infer<typeof AiDocumentItemSchema>;
export type AiKnowledgeContract = z.infer<typeof AiKnowledgeContractSchema>;
export type AiDefinitionItem = z.infer<typeof AiDefinitionItemSchema>;
export type AiDefinitionsContract = z.infer<typeof AiDefinitionsContractSchema>;
export type AiEntityItem = z.infer<typeof AiEntityItemSchema>;
export type AiEntitiesContract = z.infer<typeof AiEntitiesContractSchema>;
