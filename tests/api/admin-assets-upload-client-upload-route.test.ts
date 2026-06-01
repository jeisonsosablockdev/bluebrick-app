import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getSignedUploadContract: vi.fn(),
  handleUpload: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/repository", () => ({
  getSignedUploadContract: routeMocks.getSignedUploadContract
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: routeMocks.handleUpload
}));

import { POST } from "@/app/api/admin/assets/uploads/client-upload/route";

const uploadId = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const actorPubkey = "AdminPubkeyClientBlob111111111111111111111111";
const objectKey = `admin-assets/brochureFile/9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6/brief.pdf`;

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/assets/uploads/client-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function createGenerateTokenBody(pathname = objectKey, clientPayload: string | null = JSON.stringify({ uploadId })) {
  return {
    type: "blob.generate-client-token",
    payload: {
      pathname,
      clientPayload,
      multipart: true
    }
  };
}

function createContract(overrides: Record<string, unknown> = {}) {
  return {
    uploadId,
    actorPubkey,
    draftId: "2d99af02-7270-4df9-8024-a8e5e75a7cd2",
    editSessionId: "750f2990-3b37-4a0c-ae22-13be76a6d5c6",
    category: "brochureFile",
    originalFileName: "Englelake Oportunidad.pdf",
    sanitizedFileName: "englelake-oportunidad.pdf",
    objectKey,
    bucket: "vercel-blob",
    mimeType: "application/pdf",
    sizeBytes: 10 * 1024 * 1024,
    contentMd5Base64: "1B2M2Y8AsgTpgAmY7PhCfg==",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    createdAt: new Date().toISOString(),
    finalizedAt: null,
    finalFileRefId: null,
    ...overrides
  };
}

describe("POST /api/admin/assets/uploads/client-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: actorPubkey
    });
    routeMocks.getSignedUploadContract.mockResolvedValue(createContract());
    routeMocks.handleUpload.mockImplementation(async (input: {
      body: ReturnType<typeof createGenerateTokenBody>;
      onBeforeGenerateToken: (pathname: string, clientPayload: string | null, multipart: boolean) => Promise<unknown>;
    }) => {
      const { body, onBeforeGenerateToken } = input;
      const tokenOptions = await onBeforeGenerateToken(
        body.payload.pathname,
        body.payload.clientPayload,
        body.payload.multipart
      );

      return {
        type: "blob.generate-client-token",
        clientToken: JSON.stringify(tokenOptions)
      };
    });
  });

  it("generates a Vercel Blob client token from the existing signed upload contract", async () => {
    const response = await POST(createRequest(createGenerateTokenBody()));
    const payload = await response.json();
    const tokenOptions = JSON.parse(payload.clientToken);

    expect(response.status).toBe(200);
    expect(routeMocks.getSignedUploadContract).toHaveBeenCalledWith(uploadId);
    expect(tokenOptions).toMatchObject({
      allowedContentTypes: ["application/pdf"],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: false,
      allowOverwrite: true
    });
  });

  it("rejects client upload tokens for a pathname outside the signed contract", async () => {
    const response = await POST(createRequest(createGenerateTokenBody("admin-assets/brochureFile/other/file.pdf")));
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("UPLOAD_VALIDATION_FAILED");
  });

  it("rejects client upload tokens for a different admin actor", async () => {
    routeMocks.getSignedUploadContract.mockResolvedValue(createContract({
      actorPubkey: "DifferentAdmin111111111111111111111111111111"
    }));

    const response = await POST(createRequest(createGenerateTokenBody()));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });
});
