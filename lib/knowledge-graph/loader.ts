import fs from "node:fs/promises";
import path from "node:path";

import { KnowledgeGraphSchema } from "./schema";
import type { KnowledgeGraph } from "./types";

const DEFAULT_GRAPH_PATH = path.join(process.cwd(), "content", "entities", "semantic-graph.v1.json");

let cachedGraph: KnowledgeGraph | null = null;

export async function loadKnowledgeGraph(graphPath: string = DEFAULT_GRAPH_PATH): Promise<KnowledgeGraph> {
  if (cachedGraph) {
    return cachedGraph;
  }

  const raw = await fs.readFile(graphPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const graph = KnowledgeGraphSchema.parse(parsed);
  cachedGraph = graph;

  return graph;
}

export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
  return loadKnowledgeGraph();
}

export function resetKnowledgeGraphCache(): void {
  cachedGraph = null;
}
