import { beforeEach, describe, expect, it, vi } from "vitest";

type EditSessionUploadRow = {
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
  edit_session_id: string;
  finalized_at: string | null;
  promoted_at: string | null;
  promoted_by: string | null;
  canceled_at: string | null;
  canceled_by: string | null;
};

const queryMock = vi.fn();

vi.mock("@/features/shared/infrastructure/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import {
  cancelEditSessionUploads,
  listEditSessionUploads,
  promoteEditSessionUploads
} from "@/lib/asset-uploads/repository";

const DRAFT_ID = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const EDIT_SESSION_ID = "0f9748d3-a4c8-4058-930d-b6949f43d18c";

function buildRow(overrides: Partial<EditSessionUploadRow> = {}): EditSessionUploadRow {
  return {
    file_ref_id: "file-gallery-1",
    upload_id: "upload-gallery-1",
    actor_pubkey: "Admin111",
    draft_id: DRAFT_ID,
    bucket: "uploads",
    object_key: "admin-assets/galleryImage/draft/file-1.jpg",
    cdn_url: "https://cdn.example.com/file-1.jpg",
    mime_type: "image/jpeg",
    size_bytes: "1024",
    content_md5_base64: "AAAAAAAAAAAAAAAAAAAAAA==",
    etag: "\"etag\"",
    uploaded_at: "2026-04-24T10:00:00.000Z",
    created_at: "2026-04-24T10:00:00.000Z",
    category: "galleryImage",
    edit_session_id: EDIT_SESSION_ID,
    finalized_at: "2026-04-24T10:00:01.000Z",
    promoted_at: null,
    promoted_by: null,
    canceled_at: null,
    canceled_by: null,
    ...overrides
  };
}

describe("lib/asset-uploads/repository edit-session lifecycle helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty without querying when draftId or editSessionId is blank", async () => {
    const result = await listEditSessionUploads({
      draftId: "   ",
      editSessionId: EDIT_SESSION_ID
    });

    expect(result).toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("lists edit-session uploads with lifecycle state derived from promotion/cancelation fields", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [buildRow({ promoted_at: "2026-04-24T11:00:00.000Z", promoted_by: "Admin111" })]
    });

    const result = await listEditSessionUploads({
      draftId: DRAFT_ID,
      editSessionId: EDIT_SESSION_ID
    });

    expect(result).toEqual([
      expect.objectContaining({
        editSessionId: EDIT_SESSION_ID,
        lifecycleState: "promoted",
        promotedBy: "Admin111"
      })
    ]);
  });

  it("promotes finalized edit-session uploads and clears cancelation flags", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [] });
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        buildRow({
          promoted_at: "2026-04-24T11:00:00.000Z",
          promoted_by: "Admin111",
          canceled_at: null,
          canceled_by: null
        })
      ]
    });

    const result = await promoteEditSessionUploads({
      draftId: DRAFT_ID,
      editSessionId: EDIT_SESSION_ID,
      actorPubkey: "Admin111"
    });

    expect(result).toEqual([
      expect.objectContaining({
        lifecycleState: "promoted",
        promotedBy: "Admin111"
      })
    ]);

    expect(String(queryMock.mock.calls[0]?.[0])).toContain("promoted_at = COALESCE(promoted_at, NOW())");
    expect(queryMock.mock.calls[0]?.[1]).toEqual([DRAFT_ID, EDIT_SESSION_ID, "Admin111"]);
  });

  it("marks unpromoted edit-session uploads as canceled", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 2,
      rows: [{ upload_id: "upload-1" }, { upload_id: "upload-2" }]
    });

    const result = await cancelEditSessionUploads({
      draftId: DRAFT_ID,
      editSessionId: EDIT_SESSION_ID,
      actorPubkey: "Admin111"
    });

    expect(result).toBe(2);
    expect(String(queryMock.mock.calls[0]?.[0])).toContain("canceled_at = COALESCE(canceled_at, NOW())");
    expect(queryMock.mock.calls[0]?.[1]).toEqual([DRAFT_ID, EDIT_SESSION_ID, "Admin111"]);
  });
});
