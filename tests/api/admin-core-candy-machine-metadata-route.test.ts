import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  createCoreMetadataRecord: vi.fn(),
  isPinataConfigured: vi.fn(),
  resolveImageForPinata: vi.fn(),
  createCoreCandyMachinePinataMetadataUris: vi.fn(),
  isPinataFileServiceError: vi.fn()
}));

vi.mock("@/lib/core-candy-machine-metadata-store", () => ({
  createCoreMetadataRecord: routeMocks.createCoreMetadataRecord
}));

vi.mock("@/lib/pinata-file-service", () => ({
  isPinataConfigured: routeMocks.isPinataConfigured,
  resolveImageForPinata: routeMocks.resolveImageForPinata,
  createCoreCandyMachinePinataMetadataUris: routeMocks.createCoreCandyMachinePinataMetadataUris,
  isPinataFileServiceError: routeMocks.isPinataFileServiceError
}));

import { POST } from "@/app/api/admin/core-candy-machine/metadata/route";

describe("api/admin/core-candy-machine/metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.isPinataConfigured.mockReturnValue(false);
    routeMocks.createCoreMetadataRecord
      .mockReturnValueOnce({ id: "collection-id" })
      .mockReturnValueOnce({ id: "asset-id" });
    routeMocks.resolveImageForPinata.mockResolvedValue({
      imageUri: "ipfs://image-cid",
      imageGatewayUrl: "https://gateway.pinata.cloud/ipfs/image-cid",
      contentType: "image/png"
    });
    routeMocks.isPinataFileServiceError.mockReturnValue(false);
  });

  it("returns 400 when image is missing", async () => {
    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("image is required to generate metadata URI.");
  });

  it("returns local provider uris when pinata is not configured", async () => {
    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection",
        assetNamePrefix: "Asset",
        symbol: "NFT",
        description: "Description",
        image: "https://cdn.example.com/image.png"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.provider).toBe("local");
    expect(payload.collectionUri).toBe("https://example.com/api/admin/core-candy-machine/metadata/collection-id.json");
    expect(payload.assetUri).toBe("https://example.com/api/admin/core-candy-machine/metadata/asset-id.json");
    expect(routeMocks.createCoreMetadataRecord).toHaveBeenCalledTimes(2);
  });

  it("returns pinata provider uris when pinata is configured", async () => {
    routeMocks.isPinataConfigured.mockReturnValue(true);
    routeMocks.createCoreCandyMachinePinataMetadataUris.mockResolvedValue({
      collectionUri: "ipfs://collection-cid",
      assetUri: "ipfs://asset-cid",
      collectionGatewayUrl: "https://gateway.pinata.cloud/ipfs/collection-cid",
      assetGatewayUrl: "https://gateway.pinata.cloud/ipfs/asset-cid"
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection",
        assetNamePrefix: "Asset",
        internalCode: "BLD-001",
        image: "https://cdn.example.com/image.png"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.provider).toBe("pinata");
    expect(payload.collectionUri).toBe("ipfs://collection-cid");
    expect(payload.assetUri).toBe("ipfs://asset-cid");
    expect(payload.imageUri).toBe("ipfs://image-cid");
    expect(routeMocks.resolveImageForPinata).toHaveBeenCalledTimes(1);
    expect(routeMocks.resolveImageForPinata).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUri: "https://cdn.example.com/image.png",
        name: "BLD-001"
      })
    );
    expect(routeMocks.createCoreCandyMachinePinataMetadataUris).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionMetadata: expect.objectContaining({
          image: "ipfs://image-cid"
        }),
        assetMetadata: expect.objectContaining({
          image: "ipfs://image-cid"
        })
      })
    );
    expect(routeMocks.createCoreMetadataRecord).not.toHaveBeenCalled();
  });

  it("returns pinata error when pinata upload fails", async () => {
    routeMocks.isPinataConfigured.mockReturnValue(true);
    const error = new Error("Pinata unauthorized");
    (error as Error & { status?: number }).status = 401;
    routeMocks.createCoreCandyMachinePinataMetadataUris.mockRejectedValue(error);
    routeMocks.isPinataFileServiceError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection",
        assetNamePrefix: "Asset",
        image: "https://cdn.example.com/image.png"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Pinata unauthorized");
  });
});
