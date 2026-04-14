import type { ContentPipelineDocument } from "../pipeline";

export interface AiSerializedDocument {
  id: string;
  slug: string;
  title: string;
  summary: string;
  layer: ContentPipelineDocument["layer"];
  type: ContentPipelineDocument["type"];
  canonicalPath: string;
  updatedAt: string;
  tags: string[];
  readingTimeMinutes: number;
}

interface AiSerializerOptions {
  maxTitleLength?: number;
  maxSummaryLength?: number;
  maxTagLength?: number;
  maxTagsPerDocument?: number;
}

const DEFAULTS: Required<AiSerializerOptions> = {
  maxTitleLength: 160,
  maxSummaryLength: 320,
  maxTagLength: 48,
  maxTagsPerDocument: 16
};

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeTags(document: ContentPipelineDocument, options: Required<AiSerializerOptions>): string[] {
  return document.tags
    .map((tag) => sanitizeText(tag, options.maxTagLength))
    .filter(Boolean)
    .slice(0, options.maxTagsPerDocument);
}

export function serializePipelineDocumentForAi(
  document: ContentPipelineDocument,
  options: AiSerializerOptions = {}
): AiSerializedDocument {
  const resolved = { ...DEFAULTS, ...options };

  return {
    id: document.id,
    slug: document.slug,
    title: sanitizeText(document.title, resolved.maxTitleLength),
    summary: sanitizeText(document.technicalSummary || document.summary, resolved.maxSummaryLength),
    layer: document.layer,
    type: document.type,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    tags: sanitizeTags(document, resolved),
    readingTimeMinutes: document.readingTimeMinutes
  };
}
