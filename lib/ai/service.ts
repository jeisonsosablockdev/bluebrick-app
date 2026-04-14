import {
  buildPipelineDocument,
  loadContentDocuments,
  serializePipelineDocumentForAi,
  type ContentPipelineDocument
} from "@/lib/content";
import { buildSemanticEntities } from "@/lib/knowledge-graph";
import { getSiteOrigin } from "@/lib/seo";

import {
  AI_SCHEMA_VERSION,
  AiDefinitionsContractSchema,
  AiEntitiesContractSchema,
  AiKnowledgeContractSchema,
  type AiDefinitionItem,
  type AiDocumentItem,
  type AiEntityItem,
  type AiDefinitionsContract,
  type AiEntitiesContract,
  type AiKnowledgeContract
} from "./contracts";

function slugify(input: string): string {
  const normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalized
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

function toPublicDocument(document: ContentPipelineDocument): AiDocumentItem {
  const serialized = serializePipelineDocumentForAi(document);

  return {
    id: serialized.id,
    slug: serialized.slug,
    title: serialized.title,
    summary: serialized.summary,
    layer: serialized.layer,
    type: serialized.type,
    canonicalPath: serialized.canonicalPath,
    updatedAt: serialized.updatedAt,
    tags: serialized.tags
  };
}

async function loadPublishedDocuments(): Promise<ContentPipelineDocument[]> {
  const documents = await loadContentDocuments();

  return documents
    .filter((document) => document.status === "published")
    .map((document) => buildPipelineDocument(document))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function buildGeneratedAtIso(): string {
  return new Date().toISOString();
}

function mergeEntityItems(current: AiEntityItem, incoming: AiEntityItem): AiEntityItem {
  const relatedDocumentSlugs = Array.from(
    new Set([...current.relatedDocumentSlugs, ...incoming.relatedDocumentSlugs])
  ).sort((left, right) => left.localeCompare(right));

  return {
    ...current,
    ...incoming,
    relatedDocumentSlugs,
    aliases: incoming.aliases ?? current.aliases,
    relationTargets: incoming.relationTargets ?? current.relationTargets
  };
}

export async function buildKnowledgeContract(): Promise<AiKnowledgeContract> {
  const items = (await loadPublishedDocuments()).map(toPublicDocument);

  return AiKnowledgeContractSchema.parse({
    schemaVersion: AI_SCHEMA_VERSION,
    generatedAt: buildGeneratedAtIso(),
    items
  });
}

export async function buildDefinitionsContract(): Promise<AiDefinitionsContract> {
  const items: AiDefinitionItem[] = (await loadPublishedDocuments())
    .filter((document) => document.type === "glossary-term")
    .map((document) => {
      const serialized = serializePipelineDocumentForAi(document);

      return {
        id: serialized.id,
        slug: serialized.slug,
        term: serialized.title,
        summary: serialized.summary,
        canonicalPath: serialized.canonicalPath,
        updatedAt: serialized.updatedAt,
        layer: serialized.layer,
        tags: serialized.tags
      };
    });

  return AiDefinitionsContractSchema.parse({
    schemaVersion: AI_SCHEMA_VERSION,
    generatedAt: buildGeneratedAtIso(),
    items
  });
}

export async function buildEntitiesContract(): Promise<AiEntitiesContract> {
  const publishedDocuments = await loadPublishedDocuments();
  const entityMap = new Map<string, AiEntityItem>();

  for (const document of publishedDocuments) {
    const serialized = serializePipelineDocumentForAi(document);

    for (const tag of serialized.tags) {
      const slug = slugify(tag);
      if (!slug) {
        continue;
      }

      const current = entityMap.get(slug);
      if (current) {
        if (!current.relatedDocumentSlugs.includes(document.slug)) {
          current.relatedDocumentSlugs.push(document.slug);
        }
        continue;
      }

      entityMap.set(slug, {
        id: `tag:${slug}`,
        slug,
        name: tag,
        summary: `Tag entity sourced from published content: ${tag}.`,
        sourceType: "tag",
        relatedDocumentSlugs: [document.slug]
      });
    }

    if (document.type === "glossary-term") {
      const slug = slugify(document.slug || document.title);
      if (!slug) {
        continue;
      }

      entityMap.set(slug, {
        id: `glossary:${document.id}`,
        slug,
        name: serialized.title,
        summary: serialized.summary,
        sourceType: "glossary-term",
        relatedDocumentSlugs: [document.slug]
      });
    }
  }

  const semanticEntities = await buildSemanticEntities();
  for (const semanticEntity of semanticEntities) {
    const incoming: AiEntityItem = {
      id: semanticEntity.id,
      slug: semanticEntity.slug,
      name: semanticEntity.name,
      summary: semanticEntity.summary,
      sourceType: semanticEntity.sourceType as AiEntityItem["sourceType"],
      relatedDocumentSlugs: semanticEntity.relatedDocumentSlugs,
      nodeType: semanticEntity.nodeType,
      canonicalPath: semanticEntity.canonicalPath,
      aliases: semanticEntity.aliases,
      relationTargets: semanticEntity.relationTargets
    };

    const current = entityMap.get(semanticEntity.slug);
    if (current) {
      entityMap.set(semanticEntity.slug, mergeEntityItems(current, incoming));
      continue;
    }

    entityMap.set(semanticEntity.slug, incoming);
  }

  const items = Array.from(entityMap.values()).sort((left, right) => left.slug.localeCompare(right.slug));

  return AiEntitiesContractSchema.parse({
    schemaVersion: AI_SCHEMA_VERSION,
    generatedAt: buildGeneratedAtIso(),
    items
  });
}

export function isAiTxtEnabled(): boolean {
  const raw = process.env.ENABLE_AI_TXT?.trim().toLowerCase();
  if (!raw) {
    return false;
  }

  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function buildLlmsTxt(): string {
  const origin = getSiteOrigin();

  return [
    "# BRIDS",
    "",
    "AI-readable public endpoints for agents and LLM systems.",
    "",
    `Site: ${origin}`,
    `LLMs: ${origin}/llms.txt`,
    `Knowledge JSON: ${origin}/knowledge.json`,
    `Knowledge API: ${origin}/api/knowledge`,
    `Entities API: ${origin}/api/entities`,
    `Definitions API: ${origin}/api/definitions`
  ].join("\n");
}

export function buildAiTxt(): string | null {
  if (!isAiTxtEnabled()) {
    return null;
  }

  const origin = getSiteOrigin();

  return [
    "BRIDS AI Interface",
    "version: 1",
    `site: ${origin}`,
    "published-only: true",
    "contract: versioned",
    `knowledge: ${origin}/api/knowledge`,
    `entities: ${origin}/api/entities`,
    `definitions: ${origin}/api/definitions`
  ].join("\n");
}
