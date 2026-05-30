import "server-only";

import { Worker as NodeWorker } from "node:worker_threads";

import { AssetPdfBriefError, parseInvestmentBriefTextToRows } from "@/lib/admin/asset-pdf-brief";

type ParsedPdfImportResult = {
  extractedText: string;
  headers: string[];
  rows: Array<Record<string, string>>;
};

const PDF_TEXT_WORKER_TIMEOUT_MS = 30_000;

const pdfTextWorkerSource = `
import path from "node:path";
import { createRequire } from "node:module";
import { parentPort, Worker as NodeWorker } from "node:worker_threads";
import { pathToFileURL } from "node:url";

const requireFromProject = createRequire(path.join(process.cwd(), "package.json"));
const pdfjsWorkerSrc = pathToFileURL(
  requireFromProject.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
).href;
const pdfjsApiSrc = pathToFileURL(
  requireFromProject.resolve("pdfjs-dist/legacy/build/pdf.mjs")
).href;

globalThis.Worker = NodeWorker;

const pdfjs = await import(pdfjsApiSrc);
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

function collectPageText(items) {
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null && "str" in item && typeof item.str === "string") {
        return item.str;
      }

      return "";
    })
    .join(" ");
}

parentPort.on("message", async (buffer) => {
  let document = null;

  try {
    document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pageText = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pageText.push(collectPageText(content.items));
    }

    parentPort.postMessage({
      ok: true,
      extractedText: pageText.join("\\n").trim()
    });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown PDF parsing error."
    });
  } finally {
    await document?.destroy?.();
  }
});
`;

type PdfTextWorkerResult =
  | {
      ok: true;
      extractedText: string;
    }
  | {
      ok: false;
      message: string;
    };

function isPdfTextWorkerResult(message: unknown): message is PdfTextWorkerResult {
  if (typeof message !== "object" || message === null || !("ok" in message)) {
    return false;
  }

  if (message.ok === true) {
    return "extractedText" in message && typeof message.extractedText === "string";
  }

  return message.ok === false && "message" in message && typeof message.message === "string";
}

function createPdfTextWorker(): NodeWorker {
  return new NodeWorker(new URL(`data:text/javascript,${encodeURIComponent(pdfTextWorkerSource)}`));
}

async function extractPdfTextInWorker(data: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = createPdfTextWorker();
    let settled = false;

    function finish(error: Error | null, extractedText?: string): void {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      worker.removeAllListeners();
      void worker.terminate();

      if (error) {
        reject(error);
        return;
      }

      resolve(extractedText ?? "");
    }

    const timeout = setTimeout(() => {
      finish(new Error("PDF text extraction timed out."));
    }, PDF_TEXT_WORKER_TIMEOUT_MS);

    worker.once("message", (message: unknown) => {
      if (!isPdfTextWorkerResult(message)) {
        finish(new Error("PDF text worker returned an invalid response."));
        return;
      }

      if (!message.ok) {
        finish(new Error(message.message));
        return;
      }

      finish(null, message.extractedText);
    });
    worker.once("error", (error) => {
      finish(error instanceof Error ? error : new Error("PDF text worker failed."));
    });
    worker.once("exit", (code) => {
      if (code !== 0) {
        finish(new Error(`PDF text worker exited with code ${code}.`));
      }
    });

    const payload = data.slice().buffer as ArrayBuffer;
    worker.postMessage(payload, [payload]);
  });
}

export async function parseInvestmentBriefPdfBuffer(data: Uint8Array): Promise<ParsedPdfImportResult> {
  try {
    const extractedText = await extractPdfTextInWorker(data);
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
