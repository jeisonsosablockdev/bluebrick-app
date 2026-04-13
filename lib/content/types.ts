export const DOCUMENT_STATUSES = ["draft", "published", "superseded"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "institutional-page",
  "article",
  "knowledge-base",
  "faq",
  "glossary-term",
  "changelog"
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export type ContentLayer = "software" | "knowledge" | "regulatory";

export interface ContentFrontmatter {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: DocumentStatus;
  type: DocumentType;
  version: string;
  updatedAt: string;
  tags: string[];
  canonicalPath: string;
  aliases?: string[];
  supersededBySlug?: string;
}

export interface ContentDocument extends ContentFrontmatter {
  layer: ContentLayer;
  sourcePath: string;
  body: string;
}

export interface LoadContentOptions {
  contentRoot?: string;
  includeDrafts?: boolean;
  layer?: ContentLayer;
}

export interface ContentRedirectRule {
  sourcePath: string;
  destinationPath: string;
  permanent: true;
  reason: "alias" | "superseded";
}
