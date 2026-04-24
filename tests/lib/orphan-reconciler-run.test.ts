import { beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  rows: [] as Array<{ upload_id: string; object_key: string; reason: "temporary" | "abandoned" }>,
  deletedRows: [] as Array<{ upload_id: string }>
}));

const gcsMocks = vi.hoisted(() => ({
  deleteGcsObjectIfPresent: vi.fn(),
  getGcsUploadConfig: vi.fn(() => ({
    bucketName: "vercel-blob",
    cdnBaseUrl: null,
    signedUrlTtlSeconds: 900,
    blobReadWriteToken: "token"
  }))
}));

const queryMock = vi.fn(async (sql: string, params?: unknown[]) => {
  if (sql.includes("SELECT") && sql.includes("FROM asset_upload_contracts")) {
    return {
      rowCount: dbState.rows.length,
      rows: dbState.rows
    };
  }

  if (sql.includes("DELETE FROM asset_upload_contracts")) {
    return {
      rowCount: dbState.deletedRows.length,
      rows: dbState.deletedRows
    };
  }

  throw new Error(`Unexpected SQL in test: ${sql}`);
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

vi.mock("@/lib/asset-uploads/gcs", () => ({
  deleteGcsObjectIfPresent: gcsMocks.deleteGcsObjectIfPresent,
  getGcsUploadConfig: gcsMocks.getGcsUploadConfig
}));

import { reconcileOrphanedUploads } from "@/lib/asset-uploads/orphan-reconciler";

describe("lib/asset-uploads/orphan-reconciler execution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.rows = [];
    dbState.deletedRows = [];
  });

  it("limits cleanup to session-linked unpromoted uploads in dry-run mode", async () => {
    dbState.rows = [
      {
        upload_id: "11111111-1111-4111-8111-111111111111",
        object_key: "admin-assets/galleryImage/draft/upload-1.jpg",
        reason: "temporary"
      }
    ];

    const result = await reconcileOrphanedUploads({
      dryRun: true,
      temporaryRetentionDays: 7,
      abandonedRetentionDays: 30,
      limit: 200
    });

    expect(result).toMatchObject({
      dryRun: true,
      candidates: 1,
      deleted: 0,
      byReason: { temporary: 1, abandoned: 0 },
      storageDeleted: 0,
      storageMissing: 0,
      storageFailed: 0
    });

    expect(String(queryMock.mock.calls[0]?.[0])).toContain("edit_session_id IS NOT NULL");
    expect(String(queryMock.mock.calls[0]?.[0])).toContain("promoted_at IS NULL");
    expect(gcsMocks.deleteGcsObjectIfPresent).not.toHaveBeenCalled();
  });

  it("deletes storage objects before removing orphaned DB rows", async () => {
    dbState.rows = [
      {
        upload_id: "11111111-1111-4111-8111-111111111111",
        object_key: "admin-assets/galleryImage/draft/upload-1.jpg",
        reason: "temporary"
      },
      {
        upload_id: "22222222-2222-4222-8222-222222222222",
        object_key: "admin-assets/legalDoc/draft/upload-2.pdf",
        reason: "abandoned"
      }
    ];
    dbState.deletedRows = [{ upload_id: "11111111-1111-4111-8111-111111111111" }];

    gcsMocks.deleteGcsObjectIfPresent
      .mockResolvedValueOnce({ deleted: true, notFound: false })
      .mockRejectedValueOnce(new Error("blob delete failed"));

    const result = await reconcileOrphanedUploads({
      dryRun: false,
      temporaryRetentionDays: 7,
      abandonedRetentionDays: 30,
      limit: 200
    });

    expect(result).toMatchObject({
      dryRun: false,
      candidates: 2,
      deleted: 1,
      byReason: { temporary: 1, abandoned: 1 },
      storageDeleted: 1,
      storageMissing: 0,
      storageFailed: 1
    });

    expect(gcsMocks.deleteGcsObjectIfPresent).toHaveBeenCalledTimes(2);
    expect(String(queryMock.mock.calls[1]?.[0])).toContain("DELETE FROM asset_upload_contracts");
    expect(queryMock.mock.calls[1]?.[1]).toEqual([["11111111-1111-4111-8111-111111111111"]]);
  });
});
