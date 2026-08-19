import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  invalidateCdnPaths: vi.fn(),
  getGcsUploadConfig: vi.fn(),
  headGcsObject: vi.fn(),
  getSignedUploadContract: vi.fn(),
  getUploadedFileRefByUploadId: vi.fn(),
  persistFinalizedUpload: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/cdn-invalidation", () => ({
  invalidateCdnPaths: routeMocks.invalidateCdnPaths
}));

vi.mock("@/lib/asset-uploads/gcs", () => ({
  buildCdnUrl: vi.fn(),
  getGcsUploadConfig: routeMocks.getGcsUploadConfig,
  headGcsObject: routeMocks.headGcsObject
}));

vi.mock("@/lib/asset-uploads/repository", () => ({
  getSignedUploadContract: routeMocks.getSignedUploadContract,
  getUploadedFileRefByUploadId: routeMocks.getUploadedFileRefByUploadId,
  persistFinalizedUpload: routeMocks.persistFinalizedUpload
}));

import { POST } from "@/app/api/admin/assets/uploads/[uploadId]/finalize/route";

const draftId = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const uploadId = "c6ff91e1-3084-4ce3-9674-4012f86b2e5d";

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`https://example.com/api/admin/assets/uploads/${uploadId}/finalize`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("POST /api/admin/assets/uploads/[uploadId]/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.getGcsUploadConfig.mockReturnValue({
      bucketName: "uploads",
      cdnBaseUrl: "https://cdn.example.com",
      signedUrlTtlSeconds: 900,
      blobReadWriteToken: "blob-token"
    });
    routeMocks.getSignedUploadContract.mockResolvedValue({
      uploadId,
      actorPubkey: "AdminPubkey111111111111111111111111111111111111",
      draftId,
      editSessionId: null,
      category: "galleryImage",
      originalFileName: "caratula.png",
      sanitizedFileName: "caratula.png",
      objectKey: "admin-assets/galleryImage/caratula.png",
      bucket: "uploads",
      mimeType: "image/png",
      sizeBytes: 128,
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      expiresAt: "2029-06-29T15:00:00.000Z",
      createdAt: "2026-05-29T14:50:00.000Z",
      finalizedAt: null,
      finalFileRefId: null
    });
    routeMocks.headGcsObject.mockResolvedValue({
      found: true,
      mimeType: "image/png",
      sizeBytes: 128,
      etag: "\"storage-etag\"",
      md5Base64: null,
      url: "https://cdn.example.com/admin-assets/galleryImage/caratula.png"
    });
    routeMocks.persistFinalizedUpload.mockResolvedValue({
      created: true,
      fileRef: {
        fileRefId: "file-1",
        uploadId,
        actorPubkey: "AdminPubkey111111111111111111111111111111111111",
        draftId,
        bucket: "uploads",
        objectKey: "admin-assets/galleryImage/caratula.png",
        cdnUrl: "https://cdn.example.com/admin-assets/galleryImage/caratula.png",
        mimeType: "image/png",
        sizeBytes: 128,
        contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
        etag: "storage-etag",
        uploadedAt: "2026-05-29T15:00:00.000Z",
        createdAt: "2026-05-29T15:00:00.000Z"
      }
    });
  });

  it("finalizes even when the browser etag does not match the storage etag", async () => {
    const response = await POST(
      createRequest({
        draftId,
        editSessionId: null,
        etag: "browser-etag",
        sizeBytes: 128,
        mimeType: "image/png",
        contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
        previousCdnUrl: null
      }),
      {
        params: Promise.resolve({ uploadId })
      }
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.fileRefId).toBe("file-1");
    expect(routeMocks.persistFinalizedUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        etag: "storage-etag",
        cdnUrl: "https://cdn.example.com/admin-assets/galleryImage/caratula.png"
      })
    );
  });
});
