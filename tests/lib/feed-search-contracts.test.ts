import { describe, expect, it, vi } from "vitest";

import type { ContentDocument, ContentPipelineDocument } from "@/lib/content";
import { CONTENT_PIPELINE_SCHEMA_VERSION } from "@/lib/content/pipeline";

const contentMocks = vi.hoisted(() => ({
  loadContentDocuments: vi.fn<() => Promise<ContentDocument[]>>(),
  buildPipelineDocument: vi.fn<(document: ContentDocument) => ContentPipelineDocument>()
}));

vi.mock("@/lib/content", async () => {
  const actual = await vi.importActual<typeof import("@/lib/content")>("@/lib/content");
  return {
    ...actual,
    loadContentDocuments: contentMocks.loadContentDocuments,
    buildPipelineDocument: contentMocks.buildPipelineDocument
  };
});

import {
  FEED_SCHEMA_VERSION,
  buildJsonFeed,
  buildKnowledgeExport,
  buildLocalSearchIndex,
  buildRecentFeed,
  buildRssFeed
} from "@/lib/search";

const BASE_DOCUMENT: ContentDocument = {
  id: "doc-1",
  slug: "solana-architecture",
  title: "Solana Architecture",
  summary: "Architecture baseline for BRIDS content.",
  status: "published",
  type: "article",
  version: "1.0.0",
  updatedAt: "2026-04-13T12:00:00.000Z",
  tags: ["Solana", "Architecture"],
  canonicalPath: "/knowledge/articles/solana-architecture",
  layer: "knowledge",
  sourcePath: "/tmp/knowledge/solana-architecture.mdx",
  body: "# Solana Architecture\n\nDeterministic content and indexing."
};

describe("feed and search contracts", () => {
  contentMocks.buildPipelineDocument.mockImplementation((document) => ({
    ...document,
    normalizedBody: document.body,
    renderedHtml: "<p>mock</p>",
    renderedMdx: document.body,
    plainText: document.body.replace(/[#*]/g, " ").replace(/\s+/g, " ").trim(),
    technicalSummary: document.summary,
    headings: [{ id: "overview", depth: 2, label: "Overview" }],
    toc: [{ id: "overview", depth: 2, label: "Overview" }],
    wordCount: 10,
    readingTimeMinutes: 1
  }));

  it("builds recent feed with strict published-only policy", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      { ...BASE_DOCUMENT, id: "doc-2", slug: "draft-doc", status: "draft" },
      { ...BASE_DOCUMENT, id: "doc-3", slug: "old-doc", status: "superseded" }
    ]);

    const payload = await buildRecentFeed();

    expect(payload.schemaVersion).toBe(FEED_SCHEMA_VERSION);
    expect(payload.totalDocuments).toBe(1);
    expect(payload.items[0]?.slug).toBe("solana-architecture");
  });

  it("builds structured knowledge export for published documents only", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      {
        ...BASE_DOCUMENT,
        id: "doc-2",
        slug: "tokenization-basics",
        status: "published",
        updatedAt: "2026-04-12T00:00:00.000Z"
      },
      { ...BASE_DOCUMENT, id: "doc-3", slug: "superseded-doc", status: "superseded" }
    ]);

    const payload = await buildKnowledgeExport();

    expect(payload.schemaVersion).toBe(FEED_SCHEMA_VERSION);
    expect(payload.totalDocuments).toBe(2);
    expect(payload.items.map((item) => item.slug)).toEqual([
      "solana-architecture",
      "tokenization-basics"
    ]);
  });

  it("builds local search index with content pipeline schema version", async () => {
    contentMocks.loadContentDocuments.mockResolvedValueOnce([
      BASE_DOCUMENT,
      {
        ...BASE_DOCUMENT,
        id: "doc-2",
        slug: "tokenization-basics",
        status: "published",
        updatedAt: "2026-04-11T00:00:00.000Z"
      },
      { ...BASE_DOCUMENT, id: "doc-3", slug: "hidden-doc", status: "draft" }
    ]);

    const payload = await buildLocalSearchIndex();

    expect(payload.schemaVersion).toBe(CONTENT_PIPELINE_SCHEMA_VERSION);
    expect(payload.totalDocuments).toBe(2);
    expect(payload.entries.every((entry) => entry.slug !== "hidden-doc")).toBe(true);
  });

  it("builds JSON Feed and RSS from published-only documents", async () => {
    contentMocks.loadContentDocuments.mockResolvedValue([
      BASE_DOCUMENT,
      { ...BASE_DOCUMENT, id: "doc-2", slug: "hidden-doc", status: "superseded" }
    ]);

    const jsonFeed = await buildJsonFeed();
    const rssFeed = await buildRssFeed();

    expect(jsonFeed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(jsonFeed.items).toHaveLength(1);
    expect(jsonFeed.items[0]?.url).toContain("/knowledge/articles/solana-architecture");

    expect(rssFeed).toContain("<rss version=\"2.0\">");
    expect(rssFeed).toContain("<title>Solana Architecture</title>");
    expect(rssFeed).not.toContain("hidden-doc");
  });
});
