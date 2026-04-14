import type { ContentDocument } from "../types";

export const CONTENT_PIPELINE_SCHEMA_VERSION = "1.0.0";

export interface ContentHeading {
  id: string;
  depth: number;
  label: string;
}

export interface ContentTocItem {
  id: string;
  label: string;
  depth: number;
}

export interface ContentPipelineDocument extends ContentDocument {
  normalizedBody: string;
  renderedHtml: string;
  renderedMdx: string;
  plainText: string;
  technicalSummary: string;
  headings: ContentHeading[];
  toc: ContentTocItem[];
  wordCount: number;
  readingTimeMinutes: number;
}

export interface ContentSearchIndexEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  technicalSummary: string;
  canonicalPath: string;
  layer: ContentDocument["layer"];
  type: ContentDocument["type"];
  updatedAt: string;
  tags: string[];
  headings: string[];
  readingTimeMinutes: number;
  tokens: string[];
}

export interface ContentSearchIndexArtifact {
  schemaVersion: typeof CONTENT_PIPELINE_SCHEMA_VERSION;
  generatedAt: string;
  totalDocuments: number;
  entries: ContentSearchIndexEntry[];
}
