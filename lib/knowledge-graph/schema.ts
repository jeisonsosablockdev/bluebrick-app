import { z } from "zod";

import { KNOWLEDGE_GRAPH_SCHEMA_VERSION } from "./types";

export const KnowledgeNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["entity", "concept", "definedTerm"]),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  canonicalPath: z.string().startsWith("/"),
  aliases: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([])
});

export const KnowledgeRelationSchema = z.object({
  type: z.enum(["related", "defines", "next"]),
  source: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  target: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export const KnowledgeGraphSchema = z.object({
  schemaVersion: z.literal(KNOWLEDGE_GRAPH_SCHEMA_VERSION),
  generatedAt: z.string().min(1),
  nodes: z.array(KnowledgeNodeSchema),
  relations: z.array(KnowledgeRelationSchema)
});

export type KnowledgeGraphInput = z.input<typeof KnowledgeGraphSchema>;
export type KnowledgeGraphValidated = z.output<typeof KnowledgeGraphSchema>;
