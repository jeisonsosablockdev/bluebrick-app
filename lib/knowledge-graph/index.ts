import { getKnowledgeGraph } from "./loader";
import {
  buildArticleSemanticContextFromIndex,
  buildDefinitionSemanticContextFromIndex,
  buildKnowledgeGraphIndex,
  resolveNodeBySlugOrAlias
} from "./resolver";
import type { KnowledgeGraphIndex } from "./types";

let cachedIndex: KnowledgeGraphIndex | null = null;

async function getKnowledgeGraphIndex(): Promise<KnowledgeGraphIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const graph = await getKnowledgeGraph();
  cachedIndex = buildKnowledgeGraphIndex(graph);

  return cachedIndex;
}

export async function buildArticleSemanticContext(slugOrAlias: string) {
  const index = await getKnowledgeGraphIndex();
  return buildArticleSemanticContextFromIndex(index, slugOrAlias);
}

export async function buildDefinitionSemanticContext(slugOrAlias: string) {
  const index = await getKnowledgeGraphIndex();
  return buildDefinitionSemanticContextFromIndex(index, slugOrAlias);
}

export async function buildSemanticEntities() {
  const index = await getKnowledgeGraphIndex();

  return index.graph.nodes
    .map((node) => {
      const outgoing = index.outgoingBySlug.get(node.slug) ?? [];
      const incoming = index.incomingBySlug.get(node.slug) ?? [];
      const relatedDocumentSlugs = outgoing
        .filter((relation) => relation.type === "next")
        .map((relation) => relation.target);

      return {
        id: `semantic:${node.id}`,
        slug: node.slug,
        name: node.name,
        summary: node.summary,
        sourceType:
          node.type === "definedTerm"
            ? "semantic-defined-term"
            : node.type === "concept"
              ? "semantic-concept"
              : "semantic-entity",
        nodeType: node.type,
        canonicalPath: node.canonicalPath,
        aliases: node.aliases,
        relatedDocumentSlugs,
        relationTargets: [...outgoing, ...incoming].map((relation) => ({
          type: relation.type,
          targetSlug: relation.source === node.slug ? relation.target : relation.source
        }))
      };
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

export async function resolveSemanticNode(slugOrAlias: string) {
  const index = await getKnowledgeGraphIndex();
  return resolveNodeBySlugOrAlias(index, slugOrAlias);
}

export { getKnowledgeGraph } from "./loader";
export { buildKnowledgeGraphIndex } from "./resolver";
export * from "./types";
