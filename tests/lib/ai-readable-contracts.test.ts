import { describe, expect, it, vi } from "vitest";

import type { ContentDocument } from "@/lib/content";

const contentMocks = vi.hoisted(() => ({
  loadContentDocuments: vi.fn<() => Promise<ContentDocument[]>>()
}));

vi.mock("@/lib/content", () => ({
  loadContentDocuments: contentMocks.loadContentDocuments
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

  it("builds entity list from tags and glossary terms", async () => {
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

    expect(tagEntity?.sourceType).toBe("tag");
    expect(tagEntity?.relatedDocumentSlugs).toContain("solana-architecture");
    expect(glossaryEntity?.sourceType).toBe("glossary-term");
    expect(glossaryEntity?.summary).toBe("Idempotency definition");
  });
});
