import { loadContentDocuments, type ContentDocument } from "@/lib/content";
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

const MAX_TITLE_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 320;
const MAX_TAG_LENGTH = 48;
const MAX_TAGS_PER_DOCUMENT = 16;

function sanitizeText(input: string, maxLength: number): string {
  const compact = input.replace(/\s+/g, " ").trim();
  return compact.slice(0, maxLength);
}

function sanitizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => sanitizeText(tag, MAX_TAG_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_TAGS_PER_DOCUMENT);
}

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

function toPublicDocument(document: ContentDocument): AiDocumentItem {
  return {
    id: document.id,
    slug: document.slug,
    title: sanitizeText(document.title, MAX_TITLE_LENGTH),
    summary: sanitizeText(document.summary, MAX_SUMMARY_LENGTH),
    layer: document.layer,
    type: document.type,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    tags: sanitizeTags(document.tags)
  };
}

async function loadPublishedDocuments(): Promise<ContentDocument[]> {
  const documents = await loadContentDocuments();

  return documents
    .filter((document) => document.status === "published")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function buildGeneratedAtIso(): string {
  return new Date().toISOString();
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
    .map((document) => ({
      id: document.id,
      slug: document.slug,
      term: sanitizeText(document.title, MAX_TITLE_LENGTH),
      summary: sanitizeText(document.summary, MAX_SUMMARY_LENGTH),
      canonicalPath: document.canonicalPath,
      updatedAt: document.updatedAt,
      layer: document.layer,
      tags: sanitizeTags(document.tags)
    }));

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
    for (const tag of sanitizeTags(document.tags)) {
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
        name: sanitizeText(document.title, MAX_TITLE_LENGTH),
        summary: sanitizeText(document.summary, MAX_SUMMARY_LENGTH),
        sourceType: "glossary-term",
        relatedDocumentSlugs: [document.slug]
      });
    }
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
