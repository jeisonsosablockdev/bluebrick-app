import { describe, expect, it } from "vitest";
import {
  ArticleSchema,
  DefinitionSchema,
  validateArticleMetadata,
  validateDefinition
} from "../../apps/web/src/features/knowledge/domain/knowledge-schemas";
import * as KnowledgeExports from "../../apps/web/src/features/knowledge";

describe("knowledge feature slice & content schemas (SPEC-28)", () => {
  it("validates valid article metadata using Zod schema", () => {
    const validArticle = {
      slug: "tokenizacion-inmobiliaria-101",
      title: "Introducción a la Tokenización Inmobiliaria",
      description: "Aprende los conceptos básicos de fraccionamiento de activos reales.",
      category: "educational",
      publishedAt: "2026-08-01",
      author: "Equipo BRIDS",
      readTimeMinutes: 5
    };

    const parsed = validateArticleMetadata(validArticle);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slug).toBe("tokenizacion-inmobiliaria-101");
    }
  });

  it("rejects invalid article metadata", () => {
    const invalidArticle = {
      slug: "",
      title: "",
      category: "invalid-category"
    };

    const parsed = validateArticleMetadata(invalidArticle);
    expect(parsed.success).toBe(false);
  });

  it("validates valid definition glosary item", () => {
    const validDefinition = {
      term: "SPV",
      definition: "Vehículo de Propósito Especial (Special Purpose Vehicle) que posee el inmueble físico.",
      category: "legal"
    };

    const parsed = validateDefinition(validDefinition);
    expect(parsed.success).toBe(true);
  });

  it("exports KnowledgePageClient, ArticleCard, DefinitionCard, and domain schemas from index.ts", () => {
    expect(KnowledgeExports.ArticleSchema).toBeDefined();
    expect(KnowledgeExports.DefinitionSchema).toBeDefined();
    expect(KnowledgeExports.KnowledgePageClient).toBeDefined();
    expect(KnowledgeExports.ArticleCard).toBeDefined();
  });
});
