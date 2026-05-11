import { describe, expect, it, vi } from "vitest";

import type { ContentDocument, ContentPipelineDocument } from "@/lib/content";

const contentMocks = vi.hoisted(() => ({
  loadContentDocuments: vi.fn<() => Promise<ContentDocument[]>>(),
  buildPipelineDocument: vi.fn<(document: ContentDocument) => ContentPipelineDocument>(),
  serializePipelineDocumentForAi: vi.fn<(document: ContentPipelineDocument) => {
    id: string;
    slug: string;
    title: string;
    summary: string;
    layer: ContentDocument["layer"];
    type: ContentDocument["type"];
    canonicalPath: string;
    updatedAt: string;
    tags: string[];
    readingTimeMinutes: number;
  }>()
}));

vi.mock("@/lib/content", () => ({
  loadContentDocuments: contentMocks.loadContentDocuments,
  buildPipelineDocument: contentMocks.buildPipelineDocument,
  serializePipelineDocumentForAi: contentMocks.serializePipelineDocumentForAi
}));

import {
  AI_SCHEMA_VERSION,
  buildDefinitionsContract,
  buildEntitiesContract,
  buildKnowledgeContract
} from "@/lib/ai";

const BASE_DOCUMENT: ContentDocument = {
  id: "doc-1",
  slug: "solana-architecture",
  title: "Solana Architecture",
  summary: "Architecture baseline for BRIDS content.",
  status: "published",
  type: "article",
  version: "1.0.0",
  updatedAt: "2026-04-13T00:00:00.000Z",
  tags: ["Solana", "Architecture"],
  canonicalPath: "/knowledge/articles/solana-architecture",
  layer: "knowledge",
  sourcePath: "/tmp/knowledge/solana-architecture.mdx",
  body: "# Internal body should not leak"
};

describe("lib/ai machine-readable contracts", () => {
  contentMocks.buildPipelineDocument.mockImplementation((document) => ({
    ...document,
    normalizedBody: document.body,
    renderedHtml: "<p>mock</p>",
    renderedMdx: document.body,
    plainText: document.body.replace(/[#*]/g, " ").replace(/\s+/g, " ").trim(),
    technicalSummary: document.summary,
    headings: [],
    toc: [],
    wordCount: 10,
    readingTimeMinutes: 1
  }));

  contentMocks.serializePipelineDocumentForAi.mockImplementation((document) => ({
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.technicalSummary || document.summary,
    layer: document.layer,
    type: document.type,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    tags: [...document.tags],
    readingTimeMinutes: document.readingTimeMinutes
  }));

  it("builds a versioned knowledge contract with public fields only", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      {
        ...BASE_DOCUMENT,
        id: "doc-2",
        slug: "draft-doc",
        status: "draft",
        title: "Draft internal"
      }
    ]);

    const payload = await buildKnowledgeContract();

    expect(payload.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      id: "doc-1",
      slug: "solana-architecture",
      layer: "knowledge"
    });
    expect(payload.items[0]).not.toHaveProperty("sourcePath");
    expect(payload.items[0]).not.toHaveProperty("body");
  });

  it("returns only glossary-term documents for definitions contract", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      {
        ...BASE_DOCUMENT,
        id: "term-1",
        slug: "core-candy-machine",
        type: "glossary-term",
        title: "Core Candy Machine",
        canonicalPath: "/knowledge/definitions/core-candy-machine"
      }
    ]);

    const payload = await buildDefinitionsContract();

    expect(payload.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]?.slug).toBe("core-candy-machine");
    expect(payload.items[0]?.term).toBe("Core Candy Machine");
  });

  it("builds entity list from tags, glossary terms, and semantic graph nodes", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      {
        ...BASE_DOCUMENT,
        id: "term-1",
        slug: "idempotency",
        title: "Idempotency",
        summary: "Idempotency definition",
        type: "glossary-term",
        canonicalPath: "/knowledge/definitions/idempotency",
        tags: ["Payments", "Solana"]
      }
    ]);

    const payload = await buildEntitiesContract();

    expect(payload.schemaVersion).toBe(AI_SCHEMA_VERSION);
    expect(payload.items.length).toBeGreaterThanOrEqual(3);

    const tagEntity = payload.items.find((item) => item.slug === "solana");
    const glossaryEntity = payload.items.find((item) => item.slug === "idempotency");
    const semanticEntity = payload.items.find((item) => item.slug === "tokenization-fundamentals");

    expect(tagEntity?.sourceType).toBe("tag");
    expect(tagEntity?.relatedDocumentSlugs).toContain("solana-architecture");
    expect(glossaryEntity?.sourceType).toBe("semantic-defined-term");
    expect(glossaryEntity?.canonicalPath).toBe("/knowledge/definitions/idempotency");
    expect(glossaryEntity?.aliases).toContain("request-idempotency");
    expect(semanticEntity?.sourceType).toBe("semantic-concept");
    expect(semanticEntity?.canonicalPath).toBe("/knowledge/articles/tokenization-fundamentals");
    expect(semanticEntity?.relationTargets?.some((entry) => entry.targetSlug === "yield")).toBe(true);
  });
});
