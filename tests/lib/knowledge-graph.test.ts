import { describe, expect, it } from "vitest";

import {
  buildArticleSemanticContext,
  buildDefinitionSemanticContext,
  buildKnowledgeGraphIndex,
  getKnowledgeGraph
} from "@/lib/knowledge-graph";

describe("knowledge semantic graph", () => {
  it("resolves aliases to canonical definition nodes", async () => {
    const context = await buildDefinitionSemanticContext("asset-yield");

    expect(context.slug).toBe("yield");
    expect(context.term).toBe("Yield");
    expect(context.canonicalPath).toBe("/knowledge/definitions/yield");
  });

  it("builds contextual article navigation from semantic relations", async () => {
    const context = await buildArticleSemanticContext("tokenization-fundamentals");

    expect(context.previousLink?.href).toBe("/knowledge/articles/brids-overview");
    expect(context.nextLink?.href).toBe("/knowledge/articles/liquidity-design");

    const relatedHrefs = context.relatedLinks.map((entry) => entry.href);
    expect(relatedHrefs).toContain("/knowledge/definitions/yield");
    expect(relatedHrefs).toContain("/knowledge/definitions/idempotency");
  });

  it("loads graph dataset and exposes controlled aliases", async () => {
    const graph = await getKnowledgeGraph();

    expect(graph.schemaVersion).toBe("1.0.0");
    expect(graph.nodes.some((node) => node.slug === "tokenization-fundamentals")).toBe(true);
    expect(graph.nodes.some((node) => node.aliases.includes("asset-yield"))).toBe(true);
  });

  it("rejects duplicate aliases across nodes", () => {
    expect(() =>
      buildKnowledgeGraphIndex({
        schemaVersion: "1.0.0",
        generatedAt: "2026-04-14T00:00:00.000Z",
        nodes: [
          {
            id: "node-1",
            type: "entity",
            slug: "one",
            name: "One",
            summary: "One summary",
            canonicalPath: "/knowledge/articles/one",
            aliases: ["shared-alias"]
          },
          {
            id: "node-2",
            type: "concept",
            slug: "two",
            name: "Two",
            summary: "Two summary",
            canonicalPath: "/knowledge/articles/two",
            aliases: ["shared-alias"]
          }
        ],
        relations: []
      })
    ).toThrow("Duplicate alias detected");
  });
});
