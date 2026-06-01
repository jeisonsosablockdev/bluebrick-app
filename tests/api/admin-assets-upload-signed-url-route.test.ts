import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  buildUploadContractExpiresAt: vi.fn(),
  getGcsUploadConfig: vi.fn(() => ({
    bucketName: "vercel-blob",
    cdnBaseUrl: null,
    signedUrlTtlSeconds: 900,
    blobReadWriteToken: "token"
  })),
  createSignedUploadContract: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/gcs", () => ({
  buildUploadContractExpiresAt: routeMocks.buildUploadContractExpiresAt,
  getGcsUploadConfig: routeMocks.getGcsUploadConfig
}));

vi.mock("@/lib/asset-uploads/repository", () => ({
  createSignedUploadContract: routeMocks.createSignedUploadContract
}));

import { POST } from "@/app/api/admin/assets/uploads/signed-url/route";

const draftId = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const editSessionId = "c6ff91e1-3084-4ce3-9674-4012f86b2e5d";
const actorPubkey = "AdminPubkeySeo11111111111111111111111111111111";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/assets/uploads/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/assets/uploads/signed-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: actorPubkey
    });
    routeMocks.buildUploadContractExpiresAt.mockReturnValue("2026-05-30T12:00:00.000Z");
    routeMocks.createSignedUploadContract.mockResolvedValue(undefined);
  });

  it("uses SEO image context for public object names while preserving original file name", async () => {
    const response = await POST(createRequest({
      category: "galleryImage",
      fileName: "WhatsApp Image 2026-04-27 at 13.18.22.jpeg",
      mimeType: "image/jpeg",
      sizeBytes: 512_000,
      contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
      draftId,
      editSessionId,
      seoImageContext: {
        assetName: "Hickory Brandon 117",
        city: "Brandon",
        state: "FL",
        country: "USA",
        internalCode: "BR-117",
        assetTypeLabel: "FIX & FLIP",
        imageRole: "cover"
      }
    }));
    const payload = await response.json();
    const contractInput = routeMocks.createSignedUploadContract.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(payload.objectKey).toContain("hickory-brandon-117-brandon-fl-usa-fix-flip-br-117-cover");
    expect(payload.clientUploadUrl).toBe("/api/admin/assets/uploads/client-upload");
    expect(payload.uploadUrl).toBeUndefined();
    expect(contractInput).toMatchObject({
      actorPubkey,
      draftId,
      editSessionId,
      originalFileName: "WhatsApp Image 2026-04-27 at 13.18.22.jpeg",
      sanitizedFileName: "hickory-brandon-117-brandon-fl-usa-fix-flip-br-117-cover.jpeg"
    });
    expect(contractInput.objectKey).toBe(payload.objectKey);
  });
});
