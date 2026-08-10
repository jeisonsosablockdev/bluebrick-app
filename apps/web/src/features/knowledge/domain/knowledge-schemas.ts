import { z } from "zod";

export const ArticleSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["educational", "technical", "regulatory", "platform"]),
  publishedAt: z.string(),
  author: z.string().min(1, "Author is required"),
  readTimeMinutes: z.number().positive()
});

export type ArticleType = z.infer<typeof ArticleSchema>;

export const DefinitionSchema = z.object({
  term: z.string().min(1, "Term is required"),
  definition: z.string().min(1, "Definition is required"),
  category: z.enum(["web3", "real-estate", "legal", "general"])
});

export type DefinitionType = z.infer<typeof DefinitionSchema>;

export function validateArticleMetadata(data: unknown) {
  return ArticleSchema.safeParse(data);
}

export function validateDefinition(data: unknown) {
  return DefinitionSchema.safeParse(data);
}
