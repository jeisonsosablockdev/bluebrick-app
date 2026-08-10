import {
  buildPipelineDocument,
  buildSearchIndexArtifact,
  loadContentDocuments,
  serializePipelineDocumentForFeed,
  type ContentPipelineDocument
} from "@/lib/content";
import { getSiteOrigin } from "@/lib/seo";

import {
  FEED_SCHEMA_VERSION,
  JsonFeedContractSchema,
  KnowledgeExportContractSchema,
  LocalSearchIndexContractSchema,
  RecentFeedContractSchema,
  type JsonFeedContract,
  type KnowledgeExportContract,
  type LocalSearchIndexContract,
  type RecentFeedContract
} from "./contracts";

const DEFAULT_RECENT_LIMIT = 20;

function byUpdatedAtDescThenSlugAsc(
  left: { updatedAt: string; slug: string },
  right: { updatedAt: string; slug: string }
): number {
  return (
    right.updatedAt.localeCompare(left.updatedAt) ||
    left.slug.localeCompare(right.slug)
  );
}

function rssEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(iso: string): string {
  return new Date(iso).toUTCString();
}

function buildGeneratedAtIso(): string {
  return new Date().toISOString();
}

async function loadPublishedPipelineDocuments(): Promise<ContentPipelineDocument[]> {
  const documents = await loadContentDocuments();

  return documents
    .filter((document) => document.status === "published")
    .map((document) => buildPipelineDocument(document))
    .sort(byUpdatedAtDescThenSlugAsc);
}

export async function buildRecentFeed(limit: number = DEFAULT_RECENT_LIMIT): Promise<RecentFeedContract> {
  const documents = await loadPublishedPipelineDocuments();
  const normalizedLimit = Math.max(1, Math.trunc(limit));
  const items = documents.slice(0, normalizedLimit).map((document) => serializePipelineDocumentForFeed(document));

  return RecentFeedContractSchema.parse({
    schemaVersion: FEED_SCHEMA_VERSION,
    generatedAt: buildGeneratedAtIso(),
    totalDocuments: items.length,
    items
  });
}

export async function buildKnowledgeExport(): Promise<KnowledgeExportContract> {
  const documents = await loadPublishedPipelineDocuments();
  const items = documents.map((document) => ({
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    technicalSummary: document.technicalSummary,
    canonicalPath: document.canonicalPath,
    updatedAt: document.updatedAt,
    layer: document.layer,
    type: document.type,
    tags: [...document.tags],
    headings: document.headings.map((heading) => heading.label),
    readingTimeMinutes: document.readingTimeMinutes
  }));

  return KnowledgeExportContractSchema.parse({
    schemaVersion: FEED_SCHEMA_VERSION,
    generatedAt: buildGeneratedAtIso(),
    totalDocuments: items.length,
    items
  });
}

export async function buildLocalSearchIndex(): Promise<LocalSearchIndexContract> {
  const documents = await loadPublishedPipelineDocuments();
  return LocalSearchIndexContractSchema.parse(
    buildSearchIndexArtifact(documents, { generatedAt: buildGeneratedAtIso() })
  );
}

export async function buildJsonFeed(): Promise<JsonFeedContract> {
  const origin = getSiteOrigin();
  const documents = await loadPublishedPipelineDocuments();
  const items = documents.map((document) => {
    const serialized = serializePipelineDocumentForFeed(document);
    const canonicalUrl = `${origin}${serialized.canonicalPath}`;

    return {
      id: canonicalUrl,
      url: canonicalUrl,
      title: serialized.title,
      summary: serialized.summary,
      content_text: serialized.excerpt,
      date_modified: serialized.updatedAt,
      tags: serialized.tags
    };
  });

  return JsonFeedContractSchema.parse({
    version: "https://jsonfeed.org/version/1.1",
    title: "BRIDS Knowledge Feed",
    home_page_url: origin,
    feed_url: `${origin}/feeds/json`,
    description: "Published BRIDS knowledge documents prepared for distribution and indexing.",
    items
  });
}

export async function buildRssFeed(): Promise<string> {
  const origin = getSiteOrigin();
  const documents = await loadPublishedPipelineDocuments();
  const itemsXml = documents
    .map((document) => {
      const serialized = serializePipelineDocumentForFeed(document);
      const canonicalUrl = `${origin}${serialized.canonicalPath}`;

      return [
        "    <item>",
        `      <title>${rssEscape(serialized.title)}</title>`,
        `      <link>${rssEscape(canonicalUrl)}</link>`,
        `      <guid isPermaLink="true">${rssEscape(canonicalUrl)}</guid>`,
        `      <description>${rssEscape(serialized.excerpt)}</description>`,
        `      <pubDate>${rssEscape(toRssDate(serialized.updatedAt))}</pubDate>`,
        ...serialized.tags.map((tag) => `      <category>${rssEscape(tag)}</category>`),
        "    </item>"
      ].join("\n");
    })
    .join("\n");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<rss version=\"2.0\">",
    "  <channel>",
    "    <title>BRIDS Knowledge Feed</title>",
    `    <link>${rssEscape(origin)}</link>`,
    "    <description>Published BRIDS knowledge documents prepared for distribution and indexing.</description>",
    `    <lastBuildDate>${rssEscape(toRssDate(buildGeneratedAtIso()))}</lastBuildDate>`,
    itemsXml,
    "  </channel>",
    "</rss>"
  ].join("\n");
}
