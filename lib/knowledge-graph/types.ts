export const KNOWLEDGE_GRAPH_SCHEMA_VERSION = "1.0.0";

export type KnowledgeNodeType = "entity" | "concept" | "definedTerm";
export type KnowledgeRelationType = "related" | "defines" | "next";

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  slug: string;
  name: string;
  summary: string;
  canonicalPath: string;
  aliases: string[];
}

export interface KnowledgeRelation {
  type: KnowledgeRelationType;
  source: string;
  target: string;
}

export interface KnowledgeGraph {
  schemaVersion: string;
  generatedAt: string;
  nodes: KnowledgeNode[];
  relations: KnowledgeRelation[];
}

export interface KnowledgeGraphIndex {
  graph: KnowledgeGraph;
  nodesBySlug: Map<string, KnowledgeNode>;
  aliasesToSlug: Map<string, string>;
  outgoingBySlug: Map<string, KnowledgeRelation[]>;
  incomingBySlug: Map<string, KnowledgeRelation[]>;
}

export interface SemanticContextLink {
  label: string;
  href: string;
}

export interface ArticleSemanticContext {
  slug: string;
  title: string;
  summary: string;
  canonicalPath: string;
  relatedLinks: SemanticContextLink[];
  previousLink?: SemanticContextLink;
  nextLink?: SemanticContextLink;
}

export interface DefinitionSemanticContext {
  slug: string;
  term: string;
  summary: string;
  definition: string;
  canonicalPath: string;
  relatedLinks: SemanticContextLink[];
}
