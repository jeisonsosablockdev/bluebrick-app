import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseFrontmatter } from "@/lib/content/frontmatter";
import { loadContentDocuments } from "@/lib/content/loader";
import { ContentFrontmatterSchema } from "@/lib/content/schema";
import { buildContentRedirectRules } from "@/lib/content/redirects";
import type { ContentDocument } from "@/lib/content/types";

function stringifyFrontmatter(frontmatter: Record<string, string>): string {
  const entries = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${entries}\n---\n`;
}

async function writeContentDoc(
  contentRoot: string,
  layer: "software" | "knowledge" | "regulatory",
  relativeFilePath: string,
  frontmatter: Record<string, string>,
  body = "# Content"
): Promise<void> {
  const layerDir = path.join(contentRoot, layer);
  const absolutePath = path.join(layerDir, relativeFilePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${stringifyFrontmatter(frontmatter)}${body}\n`, "utf8");
}

async function createTempContentRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "content-contracts-"));

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

describe("lib/content contracts", () => {
  it("parses and validates the mandatory frontmatter contract", () => {
    const source = [
      "---",
      "id: doc-architecture-001",
      "slug: architecture-overview",
      "title: Architecture Overview",
      "summary: Canonical architecture entry point.",
      "status: published",
      "type: article",
      "version: 1.0.0",
      "updatedAt: 2026-04-13",
      "tags: [architecture, platform]",
      "canonicalPath: /knowledge/architecture-overview",
      "aliases: [/knowledge/arch-overview]",
      "---",
      "# Architecture"
    ].join("\n");

    const { frontmatter, body } = parseFrontmatter(source);
    const validated = ContentFrontmatterSchema.parse(frontmatter);

    expect(validated.slug).toBe("architecture-overview");
    expect(validated.tags).toEqual(["architecture", "platform"]);
    expect(validated.aliases).toEqual(["/knowledge/arch-overview"]);
    expect(body).toContain("# Architecture");
  });

  it("rejects superseded docs without a replacement slug", () => {
    const source = [
      "---",
      "id: doc-legacy-001",
      "slug: legacy-doc",
      "title: Legacy Doc",
      "summary: Old content.",
      "status: superseded",
      "type: article",
      "version: 1.0.0",
      "updatedAt: 2026-04-13",
      "tags: [legacy]",
      "canonicalPath: /knowledge/legacy-doc",
      "---",
      "Body"
    ].join("\n");

    const { frontmatter } = parseFrontmatter(source);

    expect(() => ContentFrontmatterSchema.parse(frontmatter)).toThrow(
      "superseded docs require supersededBySlug"
    );
  });

  it("loads documents from content root and excludes drafts by default", async () => {
    await withTempContentRoot(async (contentRoot) => {
      await writeContentDoc(contentRoot, "knowledge", "published.md", {
        id: "doc-001",
        slug: "published-doc",
        title: "Published Doc",
        summary: "Published content.",
        status: "published",
        type: "knowledge-base",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: "[docs]",
        canonicalPath: "/knowledge/published-doc"
      });

      await writeContentDoc(contentRoot, "knowledge", "draft.md", {
        id: "doc-002",
        slug: "draft-doc",
        title: "Draft Doc",
        summary: "Draft content.",
        status: "draft",
        type: "article",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: "[draft]",
        canonicalPath: "/knowledge/draft-doc"
      });

      const publishedOnly = await loadContentDocuments({ contentRoot });
      const includingDrafts = await loadContentDocuments({ contentRoot, includeDrafts: true });

      expect(publishedOnly).toHaveLength(1);
      expect(publishedOnly[0]?.slug).toBe("published-doc");
      expect(includingDrafts).toHaveLength(2);
    });
  });

  it("fails when duplicate slugs exist across the content corpus", async () => {
    await withTempContentRoot(async (contentRoot) => {
      await writeContentDoc(contentRoot, "software", "alpha.md", {
        id: "doc-alpha",
        slug: "shared-slug",
        title: "Alpha",
        summary: "Alpha content.",
        status: "published",
        type: "article",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: "[alpha]",
        canonicalPath: "/software/shared-slug"
      });

      await writeContentDoc(contentRoot, "knowledge", "beta.md", {
        id: "doc-beta",
        slug: "shared-slug",
        title: "Beta",
        summary: "Beta content.",
        status: "published",
        type: "article",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: "[beta]",
        canonicalPath: "/knowledge/shared-slug"
      });

      await expect(loadContentDocuments({ contentRoot, includeDrafts: true })).rejects.toThrow(
        "Duplicated slug detected"
      );
    });
  });

  it("builds alias and superseded redirect rules", () => {
    const docs: ContentDocument[] = [
      {
        id: "doc-new",
        slug: "new-guide",
        title: "New Guide",
        summary: "New canonical guide.",
        status: "published",
        type: "article",
        version: "2.0.0",
        updatedAt: "2026-04-13",
        tags: ["guide"],
        canonicalPath: "/knowledge/new-guide",
        aliases: ["/knowledge/old-guide-short"],
        layer: "knowledge",
        sourcePath: "/tmp/new-guide.md",
        body: "# New Guide"
      },
      {
        id: "doc-old",
        slug: "old-guide",
        title: "Old Guide",
        summary: "Legacy guide.",
        status: "superseded",
        type: "article",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: ["legacy"],
        canonicalPath: "/knowledge/old-guide",
        supersededBySlug: "new-guide",
        layer: "knowledge",
        sourcePath: "/tmp/old-guide.md",
        body: "# Old Guide"
      }
    ];

    const rules = buildContentRedirectRules(docs);

    expect(rules).toEqual(
      expect.arrayContaining([
        {
          sourcePath: "/knowledge/old-guide-short",
          destinationPath: "/knowledge/new-guide",
          permanent: true,
          reason: "alias"
        },
        {
          sourcePath: "/knowledge/old-guide",
          destinationPath: "/knowledge/new-guide",
          permanent: true,
          reason: "superseded"
        }
      ])
    );
  });

  it("fails redirect generation when superseded target slug is missing", () => {
    const docs: ContentDocument[] = [
      {
        id: "doc-missing-target",
        slug: "legacy-entry",
        title: "Legacy Entry",
        summary: "Superseded entry.",
        status: "superseded",
        type: "article",
        version: "1.0.0",
        updatedAt: "2026-04-13",
        tags: ["legacy"],
        canonicalPath: "/knowledge/legacy-entry",
        supersededBySlug: "target-not-found",
        layer: "knowledge",
        sourcePath: "/tmp/legacy-entry.md",
        body: "# Legacy Entry"
      }
    ];

    expect(() => buildContentRedirectRules(docs)).toThrow(
      "Missing superseded destination for slug: legacy-entry -> target-not-found"
    );
  });

  it("validates repository content tree with the same runtime loader used in production", async () => {
    await expect(loadContentDocuments()).resolves.toEqual(expect.any(Array));
  });
});
