import type {
  ArticleSemanticContext,
  DefinitionSemanticContext,
  KnowledgeGraph,
  KnowledgeGraphIndex,
  KnowledgeNode,
  KnowledgeRelation,
  SemanticContextLink
} from "./types";

const FALLBACK_PREFIX = "Related";

function toTitleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function makeLink(node: KnowledgeNode): SemanticContextLink {
  return { label: node.name, href: node.canonicalPath };
}

function fallbackArticleContext(slug: string): ArticleSemanticContext {
  const title = toTitleFromSlug(slug);
  return {
    slug,
    title,
    summary: `${FALLBACK_PREFIX} knowledge context for ${title}.`,
    canonicalPath: `/knowledge/articles/${slug}`,
    relatedLinks: []
  };
}

function fallbackDefinitionContext(slug: string): DefinitionSemanticContext {
  const term = toTitleFromSlug(slug);
  return {
    slug,
    term,
    summary: `${FALLBACK_PREFIX} semantic definition for ${term}.`,
    definition: `${term} is part of BRIDS semantic graph baseline.`,
    canonicalPath: `/knowledge/definitions/${slug}`,
    relatedLinks: []
  };
}

export function buildKnowledgeGraphIndex(graph: KnowledgeGraph): KnowledgeGraphIndex {
  const nodesBySlug = new Map<string, KnowledgeNode>();
  const aliasesToSlug = new Map<string, string>();
  const outgoingBySlug = new Map<string, KnowledgeRelation[]>();
  const incomingBySlug = new Map<string, KnowledgeRelation[]>();

  for (const node of graph.nodes) {
    if (nodesBySlug.has(node.slug)) {
      throw new Error(`Duplicate node slug detected: ${node.slug}`);
    }
    nodesBySlug.set(node.slug, node);

    for (const alias of node.aliases) {
      const existing = aliasesToSlug.get(alias);
      if (existing && existing !== node.slug) {
        throw new Error(`Duplicate alias detected: ${alias}`);
      }
      aliasesToSlug.set(alias, node.slug);
    }
  }

  for (const relation of graph.relations) {
    if (!nodesBySlug.has(relation.source)) {
      throw new Error(`Relation source not found in graph: ${relation.source}`);
    }
    if (!nodesBySlug.has(relation.target)) {
      throw new Error(`Relation target not found in graph: ${relation.target}`);
    }

    const sourceList = outgoingBySlug.get(relation.source) ?? [];
    sourceList.push(relation);
    outgoingBySlug.set(relation.source, sourceList);

    const targetList = incomingBySlug.get(relation.target) ?? [];
    targetList.push(relation);
    incomingBySlug.set(relation.target, targetList);
  }

  return {
    graph,
    nodesBySlug,
    aliasesToSlug,
    outgoingBySlug,
    incomingBySlug
  };
}

export function resolveNodeBySlugOrAlias(
  index: KnowledgeGraphIndex,
  slugOrAlias: string
): KnowledgeNode | null {
  const canonicalSlug = index.nodesBySlug.has(slugOrAlias)
    ? slugOrAlias
    : index.aliasesToSlug.get(slugOrAlias);

  if (!canonicalSlug) {
    return null;
  }

  return index.nodesBySlug.get(canonicalSlug) ?? null;
}

function collectRelatedNodes(index: KnowledgeGraphIndex, slug: string): KnowledgeNode[] {
  const related = new Map<string, KnowledgeNode>();
  const outgoing = index.outgoingBySlug.get(slug) ?? [];
  const incoming = index.incomingBySlug.get(slug) ?? [];

  for (const relation of outgoing) {
    if (relation.type !== "related" && relation.type !== "defines") {
      continue;
    }
    const target = index.nodesBySlug.get(relation.target);
    if (target) {
      related.set(target.slug, target);
    }
  }

  for (const relation of incoming) {
    if (relation.type !== "related" && relation.type !== "defines") {
      continue;
    }
    const source = index.nodesBySlug.get(relation.source);
    if (source) {
      related.set(source.slug, source);
    }
  }

  return Array.from(related.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function resolveContextualNav(
  index: KnowledgeGraphIndex,
  slug: string
): { previousLink?: SemanticContextLink; nextLink?: SemanticContextLink } {
  const outgoing = index.outgoingBySlug.get(slug) ?? [];
  const nextRelation = outgoing.find((relation) => relation.type === "next");
  const previousRelation = (index.incomingBySlug.get(slug) ?? []).find(
    (relation) => relation.type === "next"
  );

  const nextNode = nextRelation ? index.nodesBySlug.get(nextRelation.target) : undefined;
  const previousNode = previousRelation ? index.nodesBySlug.get(previousRelation.source) : undefined;

  return {
    previousLink: previousNode ? makeLink(previousNode) : undefined,
    nextLink: nextNode ? makeLink(nextNode) : undefined
  };
}

export function buildArticleSemanticContextFromIndex(
  index: KnowledgeGraphIndex,
  slugOrAlias: string
): ArticleSemanticContext {
  const node = resolveNodeBySlugOrAlias(index, slugOrAlias);
  if (!node) {
    return fallbackArticleContext(slugOrAlias);
  }

  const relatedLinks = collectRelatedNodes(index, node.slug).map(makeLink);
  const nav = resolveContextualNav(index, node.slug);

  return {
    slug: node.slug,
    title: node.name,
    summary: node.summary,
    canonicalPath: node.canonicalPath,
    relatedLinks,
    previousLink: nav.previousLink,
    nextLink: nav.nextLink
  };
}

export function buildDefinitionSemanticContextFromIndex(
  index: KnowledgeGraphIndex,
  slugOrAlias: string
): DefinitionSemanticContext {
  const node = resolveNodeBySlugOrAlias(index, slugOrAlias);
  if (!node) {
    return fallbackDefinitionContext(slugOrAlias);
  }

  const relatedLinks = collectRelatedNodes(index, node.slug).map(makeLink);

  return {
    slug: node.slug,
    term: node.name,
    summary: node.summary,
    definition: node.summary,
    canonicalPath: node.canonicalPath,
    relatedLinks
  };
}
