import { beforeEach, describe, expect, it, vi } from "vitest";

type UploadedFileRow = {
  file_ref_id: string;
  upload_id: string;
  actor_pubkey: string;
  draft_id: string;
  bucket: string;
  object_key: string;
  cdn_url: string;
  mime_type: string;
  size_bytes: string;
  content_md5_base64: string;
  etag: string | null;
  uploaded_at: string;
  created_at: string;
  category: "galleryImage" | "propertyImage" | "brochureFile" | "legalDoc" | "financialDoc";
};

let uploadedFiles: UploadedFileRow[] = [];

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("FROM asset_uploaded_files AS files")) {
    return {
      rows: uploadedFiles,
      rowCount: uploadedFiles.length
    };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import { listUploadedFileRefsByDraftId } from "@/lib/asset-uploads/repository";

describe("lib/asset-uploads/repository listUploadedFileRefsByDraftId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadedFiles = [];
  });

  it("returns empty without querying when draftId is blank", async () => {
    const result = await listUploadedFileRefsByDraftId("   ");

    expect(result).toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("returns finalized uploads with categories for a draft in deterministic order", async () => {
    uploadedFiles = [
      {
        file_ref_id: "file-gallery-1",
        upload_id: "upload-gallery-1",
        actor_pubkey: "Admin111",
        draft_id: "draft-1",
        bucket: "uploads",
        object_key: "draft-1/gallery-1.jpg",
        cdn_url: "https://cdn.example.com/gallery-1.jpg",
        mime_type: "image/jpeg",
        size_bytes: "1024",
        content_md5_base64: "AAAAAAAAAAAAAAAAAAAAAA==",
        etag: "\"etag\"",
        uploaded_at: "2026-04-23T10:00:00.000Z",
        created_at: "2026-04-23T10:00:00.000Z",
        category: "galleryImage"
      }
    ];

    const result = await listUploadedFileRefsByDraftId("draft-1");

    expect(result).toEqual([
      {
        fileRefId: "file-gallery-1",
        uploadId: "upload-gallery-1",
        actorPubkey: "Admin111",
        draftId: "draft-1",
        bucket: "uploads",
        objectKey: "draft-1/gallery-1.jpg",
        cdnUrl: "https://cdn.example.com/gallery-1.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        contentMd5Base64: "AAAAAAAAAAAAAAAAAAAAAA==",
        etag: "\"etag\"",
        uploadedAt: "2026-04-23T10:00:00.000Z",
        createdAt: "2026-04-23T10:00:00.000Z",
        category: "galleryImage"
      }
    ]);

    const sqlStatements = queryMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlStatements.some((sql) => sql.includes("INNER JOIN asset_upload_contracts AS contracts"))).toBe(true);
  });
});
