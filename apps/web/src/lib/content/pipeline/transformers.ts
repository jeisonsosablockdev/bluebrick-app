import type { ContentDocument } from "../types";
import type { ContentHeading, ContentPipelineDocument, ContentTocItem } from "./types";

const WORDS_PER_MINUTE = 220;
const MAX_SUMMARY_LENGTH = 320;
const MAX_INDEX_TOKENS = 160;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    .slice(0, 96);
}

export function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n?/g, "\n").trim();
}

function cleanHeadingLabel(value: string): string {
  return value.replace(/\s+#*\s*$/, "").trim();
}

export function extractHeadings(markdown: string): ContentHeading[] {
  const lines = markdown.split("\n");
  const slugCounters = new Map<string, number>();
  const headings: ContentHeading[] = [];

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
    if (!match) {
      continue;
    }

    const depth = match[1].length;
    const label = cleanHeadingLabel(match[2]);
    if (!label) {
      continue;
    }

    const slugBase = slugify(label) || `section-${headings.length + 1}`;
    const currentCount = slugCounters.get(slugBase) ?? 0;
    const id = currentCount === 0 ? slugBase : `${slugBase}-${currentCount + 1}`;
    slugCounters.set(slugBase, currentCount + 1);

    headings.push({ id, depth, label });
  }

  return headings;
}

export function buildToc(headings: ContentHeading[]): ContentTocItem[] {
  return headings
    .filter((heading) => heading.depth <= 3)
    .map((heading) => ({
      id: heading.id,
      label: heading.label,
      depth: heading.depth
    }));
}

export function markdownToPlainText(markdown: string): string {
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, " ");
  const withoutInlineCode = withoutFences.replace(/`([^`]+)`/g, "$1");
  const withoutImages = withoutInlineCode.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  const withoutMdTokens = withoutLinks.replace(/[*_>#~-]/g, " ");

  return withoutMdTokens.replace(/\s+/g, " ").trim();
}

function applySimpleInlineFormatting(input: string): string {
  return input
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdownToHtml(markdown: string, headings: ContentHeading[]): string {
  const headingIdQueue = [...headings];
  const lines = markdown.split("\n");

  const html: string[] = [];
  const paragraphBuffer: string[] = [];
  let isListOpen = false;

  const flushParagraph = (): void => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    const text = paragraphBuffer.join(" ").replace(/\s+/g, " ").trim();
    paragraphBuffer.length = 0;

    if (!text) {
      return;
    }

    const escaped = escapeHtml(text);
    html.push(`<p>${applySimpleInlineFormatting(escaped)}</p>`);
  };

  const closeList = (): void => {
    if (!isListOpen) {
      return;
    }

    html.push("</ul>");
    isListOpen = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      closeList();

      const depth = headingMatch[1].length;
      const label = cleanHeadingLabel(headingMatch[2]);
      const heading = headingIdQueue.shift();
      const headingId = heading?.id ?? (slugify(label) || `section-${depth}`);
      html.push(`<h${depth} id="${headingId}">${escapeHtml(label)}</h${depth}>`);
      continue;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(line);
    if (listMatch) {
      flushParagraph();

      if (!isListOpen) {
        html.push("<ul>");
        isListOpen = true;
      }

      html.push(`<li>${applySimpleInlineFormatting(escapeHtml(listMatch[1].trim()))}</li>`);
      continue;
    }

    closeList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  closeList();

  return html.join("\n");
}

export function countWords(plainText: string): number {
  if (!plainText) {
    return 0;
  }

  return plainText
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;
}

export function estimateReadingTimeMinutes(wordCount: number): number {
  if (wordCount <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

export function deriveTechnicalSummary(document: ContentDocument, plainText: string): string {
  const candidate = plainText || document.summary;
  const compact = candidate.replace(/\s+/g, " ").trim();
  if (!compact) {
    return document.summary;
  }

  return compact.slice(0, MAX_SUMMARY_LENGTH);
}

function normalizeIndexToken(token: string): string {
  return token
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function buildSearchTokens(input: string): string[] {
  const unique = new Set<string>();
  const rawTokens = input.split(/\s+/);

  for (const token of rawTokens) {
    const normalized = normalizeIndexToken(token);
    if (normalized.length < 3) {
      continue;
    }

    unique.add(normalized);
    if (unique.size >= MAX_INDEX_TOKENS) {
      break;
    }
  }

  return Array.from(unique);
}

export function buildPipelineDocument(document: ContentDocument): ContentPipelineDocument {
  const normalizedBody = normalizeMarkdown(document.body);
  const headings = extractHeadings(normalizedBody);
  const toc = buildToc(headings);
  const plainText = markdownToPlainText(normalizedBody);
  const wordCount = countWords(plainText);
  const readingTimeMinutes = estimateReadingTimeMinutes(wordCount);
  const technicalSummary = deriveTechnicalSummary(document, plainText);
  const renderedHtml = renderMarkdownToHtml(normalizedBody, headings);

  return {
    ...document,
    normalizedBody,
    renderedHtml,
    renderedMdx: normalizedBody,
    plainText,
    technicalSummary,
    headings,
    toc,
    wordCount,
    readingTimeMinutes
  };
}
