import type { ContentPipelineDocument } from "../pipeline";

export interface FeedSerializedDocument {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technicalSummary: string;
  canonicalPath: string;
  updatedAt: string;
  tags: string[];
  readingTimeMinutes: number;
  excerpt: string;
}

const MAX_EXCERPT_LENGTH = 280;

function compact(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function serializePipelineDocumentForFeed(document: ContentPipelineDocument): FeedSerializedDocument {
  const excerptSource = document.plainText || document.technicalSummary || document.summary;

  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    technicalSummary: document.technicalSummary,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    tags: [...document.tags],
    readingTimeMinutes: document.readingTimeMinutes,
    excerpt: compact(excerptSource).slice(0, MAX_EXCERPT_LENGTH)
  };
}
