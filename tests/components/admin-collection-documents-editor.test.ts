// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCollectionDocumentsEditor } from "@/components/admin/admin-collection-documents-editor";
import { uploadAssetFileViaClientBlob } from "@/lib/admin/asset-upload-client";

vi.mock("@/lib/admin/asset-upload-client", () => ({
  promoteAssetUploadEditSession: vi.fn(async () => ({ promotedUploads: 1 })),
  uploadAssetFileViaClientBlob: vi.fn()
}));

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderNode(node: ReactNode): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return { container, root };
}

describe("components/admin/admin-collection-documents-editor", () => {
  beforeEach(() => {
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders editable document fields with inherited upload metadata", () => {
    const html = renderToStaticMarkup(createElement(AdminCollectionDocumentsEditor, {
      entryId: "entry-1",
      locale: "en",
      initialDocuments: [
        {
          id: "document-1",
          tag: "brochure",
          title: "Ocean brochure",
          label: "Investor brochure",
          description: "Commercial brochure",
          url: "https://cdn.example.com/brochure.pdf",
          displayOrder: 1,
          mimeType: "application/pdf",
          fileName: "brochure.pdf",
          fileRefId: "file-brochure-1",
          source: "upload"
        }
      ]
    }));

    expect(html).toContain("Documents");
    expect(html).toContain("Document workspace");
    expect(html).toContain("1 document");
    expect(html).toContain("1 upload");
    expect(html).toContain("0 manual links");
    expect(html).toContain("Investor brochure");
    expect(html).toContain("fileRefId: file-brochure-1");
    expect(html).toContain("Save documents");
    expect(html).toContain("Remove document");
  });

  it("renders a canonical Vercel Blob upload affordance for documents", () => {
    const html = renderToStaticMarkup(createElement(AdminCollectionDocumentsEditor, {
      entryId: "entry-1",
      locale: "en",
      initialDocuments: []
    }));

    expect(html).toContain("Upload documents");
    expect(html).toContain("Upload or link documents");
    expect(html).toContain("0 documents");
    expect(html).toContain("Manual link fallback");
    expect(html).toContain("Drag and drop files here");
    expect(html).toContain("Vercel Blob");
    expect(html).toContain("10 MB");
    expect(html).toContain("iLovePDF");
    expect(html).toContain("Choose files");
  });

  it("adds an uploaded Vercel Blob document as an unsaved draft row", async () => {
    vi.mocked(uploadAssetFileViaClientBlob).mockResolvedValue({
      fileRefId: "file-upload-1",
      bucket: "admin-assets",
      objectKey: "admin-assets/draft/document.pdf",
      cdnUrl: "https://blob.example.com/document.pdf",
      uploadedAt: "2026-06-01T00:00:00.000Z"
    });

    const { container, root } = renderNode(createElement(AdminCollectionDocumentsEditor, {
      entryId: "entry-1",
      locale: "en",
      initialDocuments: []
    }));

    const input = container.querySelector("input[type='file']") as HTMLInputElement | null;
    expect(input).not.toBeNull();

    const file = new File(["document"], "Operating Agreement.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [file]
    });

    await act(async () => {
      input?.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(uploadAssetFileViaClientBlob).toHaveBeenCalledWith(expect.objectContaining({
      file,
      category: "brochureFile"
    }));
    expect(container.textContent).toContain("Operating Agreement");
    expect(container.textContent).toContain("fileRefId: file-upload-1");
    expect(container.textContent).toContain("Save this section to persist");

    act(() => {
      root.unmount();
    });
  });
});
