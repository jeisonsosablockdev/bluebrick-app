import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPipelineDocument,
  buildSearchIndexArtifact,
  loadPipelineDocuments,
  serializePipelineDocumentForAi,
  serializePipelineDocumentForFeed,
  serializePipelineDocumentForWeb,
  type ContentDocument
} from "@/lib/content";
import { CONTENT_PIPELINE_SCHEMA_VERSION } from "@/lib/content/pipeline";

function buildDocument(overrides: Partial<ContentDocument> = {}): ContentDocument {
  return {
    id: "doc-pipeline-1",
    slug: "content-pipeline-architecture",
    title: "Content Pipeline Architecture",
    summary: "Pipeline baseline summary.",
    status: "published",
    type: "article",
    version: "1.0.0",
    updatedAt: "2026-04-13T00:00:00.000Z",
    tags: ["Pipeline", "Serialization"],
    canonicalPath: "/knowledge/articles/content-pipeline-architecture",
    layer: "knowledge",
    sourcePath: "/tmp/content-pipeline-architecture.mdx",
    body: [
      "# Overview",
      "",
      "This architecture defines a deterministic content pipeline for BRIDS.",
      "",
      "## Pipeline stages",
      "",
      "Parse, validate, normalize, render and serialize are explicit stages.",
      "",
      "### Serialization outputs",
      "",
      "- web",
      "- feed",
      "- ai"
    ].join("\n"),
    ...overrides
  };
}

function stringifyFrontmatter(frontmatter: Record<string, string>): string {
  const entries = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${entries}\n---\n`;
}

async function createTempContentRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "content-pipeline-"));
  await Promise.all([
    mkdir(path.join(root, "software"), { recursive: true }),
    mkdir(path.join(root, "knowledge"), { recursive: true }),
    mkdir(path.join(root, "regulatory"), { recursive: true })
  ]);
  return root;
}

async function withTempContentRoot(run: (contentRoot: string) => Promise<void>): Promise<void> {
  const contentRoot = await createTempContentRoot();

  try {
    await run(contentRoot);
  } finally {
    await rm(contentRoot, { recursive: true, force: true });
  }
}

async function writeKnowledgeDocument(contentRoot: string, slug: string, body: string): Promise<void> {
  const filePath = path.join(contentRoot, "knowledge", `${slug}.mdx`);
  await mkdir(path.dirname(filePath), { recursive: true });

  const source =
    stringifyFrontmatter({
      id: `doc-${slug}`,
      slug,
      title: "Content Pipeline Test",
      summary: "Temporary test document.",
      status: "published",
      type: "article",
      version: "1.0.0",
      updatedAt: "2026-04-13",
      tags: "[pipeline, test]",
      canonicalPath: `/knowledge/articles/${slug}`
    }) +
    `${body}\n`;

  await writeFile(filePath, source, "utf8");
}

describe("content pipeline and serializers", () => {
  it("derives headings, TOC, reading time and deterministic rendering", () => {
    const pipelineDocument = buildPipelineDocument(buildDocument());

    expect(pipelineDocument.headings.map((heading) => heading.label)).toEqual([
      "Overview",
      "Pipeline stages",
      "Serialization outputs"
    ]);
    expect(pipelineDocument.toc.map((item) => item.id)).toEqual([
      "overview",
      "pipeline-stages",
      "serialization-outputs"
    ]);
    expect(pipelineDocument.wordCount).toBeGreaterThan(10);
    expect(pipelineDocument.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(pipelineDocument.technicalSummary).toContain("deterministic content pipeline");
    expect(pipelineDocument.renderedHtml).toContain('<h2 id="pipeline-stages">Pipeline stages</h2>');
    expect(pipelineDocument.renderedHtml).toContain("<ul>");
  });

  it("serializes web/feed/ai outputs from one pipeline source consistently", () => {
    const pipelineDocument = buildPipelineDocument(buildDocument());

    const webPayload = serializePipelineDocumentForWeb(pipelineDocument);
    const feedPayload = serializePipelineDocumentForFeed(pipelineDocument);
    const aiPayload = serializePipelineDocumentForAi(pipelineDocument);

    expect(webPayload.slug).toBe(feedPayload.slug);
    expect(feedPayload.slug).toBe(aiPayload.slug);
    expect(webPayload.canonicalPath).toBe(aiPayload.canonicalPath);
    expect(feedPayload.readingTimeMinutes).toBe(aiPayload.readingTimeMinutes);
    expect(aiPayload.summary.length).toBeGreaterThan(20);
  });

  it("builds a stable search index artifact for future local search", () => {
    const first = buildPipelineDocument(buildDocument({ slug: "alpha", id: "doc-alpha" }));
    const second = buildPipelineDocument(buildDocument({ slug: "beta", id: "doc-beta" }));

    const artifact = buildSearchIndexArtifact([second, first], {
      generatedAt: "2026-04-13T12:00:00.000Z"
    });

    expect(artifact.schemaVersion).toBe(CONTENT_PIPELINE_SCHEMA_VERSION);
    expect(artifact.generatedAt).toBe("2026-04-13T12:00:00.000Z");
    expect(artifact.totalDocuments).toBe(2);
    expect(artifact.entries.map((entry) => entry.slug)).toEqual(["alpha", "beta"]);
    expect(artifact.entries[0]?.tokens).toContain("pipeline");
    expect(artifact.entries[0]?.headings).toContain("Overview");
  });

  it("executes the full parse->validate->pipeline flow from content root", async () => {
    await withTempContentRoot(async (contentRoot) => {
      await writeKnowledgeDocument(
        contentRoot,
        "pipeline-runtime-doc",
        ["# Runtime", "", "Deterministic transformations for web and AI outputs."].join("\n")
      );

      const documents = await loadPipelineDocuments({ contentRoot });
      expect(documents).toHaveLength(1);
      expect(documents[0]?.slug).toBe("pipeline-runtime-doc");
      expect(documents[0]?.headings[0]?.id).toBe("runtime");
    });
  });
});
