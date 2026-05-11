import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminCollectionDocumentsEditor } from "@/components/admin/admin-collection-documents-editor";

describe("components/admin/admin-collection-documents-editor", () => {
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
    expect(html).toContain("Document list");
    expect(html).toContain("Investor brochure");
    expect(html).toContain("fileRefId: file-brochure-1");
    expect(html).toContain("Save documents");
    expect(html).toContain("Remove document");
  });
});
