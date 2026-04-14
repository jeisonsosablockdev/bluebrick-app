import type { ContentPipelineDocument } from "../pipeline";

export interface WebSerializedDocument {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technicalSummary: string;
  status: ContentPipelineDocument["status"];
  layer: ContentPipelineDocument["layer"];
  type: ContentPipelineDocument["type"];
  version: string;
  canonicalPath: string;
  updatedAt: string;
  tags: string[];
  renderedHtml: string;
  renderedMdx: string;
  headings: ContentPipelineDocument["headings"];
  toc: ContentPipelineDocument["toc"];
  wordCount: number;
  readingTimeMinutes: number;
}

export function serializePipelineDocumentForWeb(document: ContentPipelineDocument): WebSerializedDocument {
  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    technicalSummary: document.technicalSummary,
    status: document.status,
    layer: document.layer,
    type: document.type,
    version: document.version,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    tags: [...document.tags],
    renderedHtml: document.renderedHtml,
    renderedMdx: document.renderedMdx,
    headings: [...document.headings],
    toc: [...document.toc],
    wordCount: document.wordCount,
    readingTimeMinutes: document.readingTimeMinutes
  };
}
