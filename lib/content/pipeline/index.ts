import { loadContentDocuments } from "../loader";
import type { ContentDocument, LoadContentOptions } from "../types";

import { buildPipelineDocument, buildSearchTokens } from "./transformers";
import {
  CONTENT_PIPELINE_SCHEMA_VERSION,
  type ContentPipelineDocument,
  type ContentSearchIndexArtifact,
  type ContentSearchIndexEntry
} from "./types";

function bySlugAscending(left: { slug: string }, right: { slug: string }): number {
  return left.slug.localeCompare(right.slug);
}

export function buildPipelineDocuments(documents: ContentDocument[]): ContentPipelineDocument[] {
  return documents.map((document) => buildPipelineDocument(document));
}

export async function loadPipelineDocuments(
  options: LoadContentOptions = {}
): Promise<ContentPipelineDocument[]> {
  const documents = await loadContentDocuments(options);
  return buildPipelineDocuments(documents);
}

function toSearchIndexEntry(document: ContentPipelineDocument): ContentSearchIndexEntry {
  const tokenSource = [
    document.title,
    document.summary,
    document.technicalSummary,
    document.tags.join(" "),
    document.headings.map((heading) => heading.label).join(" "),
    document.plainText
  ]
    .join(" ")
    .trim();

  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    technicalSummary: document.technicalSummary,
    canonicalPath: document.canonicalPath,
    layer: document.layer,
    type: document.type,
    updatedAt: document.updatedAt,
    tags: [...document.tags],
    headings: document.headings.map((heading) => heading.label),
    readingTimeMinutes: document.readingTimeMinutes,
    tokens: buildSearchTokens(tokenSource)
  };
}

export interface BuildSearchIndexArtifactOptions {
  generatedAt?: string;
}

export function buildSearchIndexArtifact(
  documents: ContentPipelineDocument[],
  options: BuildSearchIndexArtifactOptions = {}
): ContentSearchIndexArtifact {
  const entries = documents.map((document) => toSearchIndexEntry(document)).sort(bySlugAscending);

  return {
    schemaVersion: CONTENT_PIPELINE_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    totalDocuments: entries.length,
    entries
  };
}

export * from "./types";
export * from "./transformers";
