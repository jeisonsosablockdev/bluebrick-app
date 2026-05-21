import "server-only";

import { AssetPdfBriefError, parseInvestmentBriefTextToRows } from "@/lib/admin/asset-pdf-brief";

type ParsedPdfImportResult = {
  extractedText: string;
  headers: string[];
  rows: Array<Record<string, string>>;
};

function collectPageText(items: Array<unknown>): string {
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null && "str" in item && typeof item.str === "string") {
        return item.str;
      }

      return "";
    })
    .join(" ");
}

export async function parseInvestmentBriefPdfBuffer(data: Uint8Array): Promise<ParsedPdfImportResult> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const document = await pdfjs.getDocument({ data }).promise;
    const pageText: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pageText.push(collectPageText(content.items));
    }

    const extractedText = pageText.join("\n").trim();
    const parsed = parseInvestmentBriefTextToRows(extractedText);

    return {
      extractedText,
      headers: parsed.headers,
      rows: parsed.rows
    };
  } catch (error) {
    if (error instanceof AssetPdfBriefError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown PDF parsing error.";
    throw new AssetPdfBriefError(
      `We could not read this PDF brief automatically. ${message}`,
      "PDF_PARSE_FAILED"
    );
  }
}
