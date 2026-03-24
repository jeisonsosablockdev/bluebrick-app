import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PinataFileServiceError,
  createCoreCandyMachinePinataMetadataUris,
  isPinataConfigured,
  pinFileFromUrlToPinata,
  resolveImageForPinata,
  pinJsonToPinata
} from "@/lib/pinata-file-service";

const ORIGINAL_PINATA_JWT = process.env.PINATA_JWT;
const ORIGINAL_GATEWAY = process.env.PINATA_GATEWAY_BASE_URL;

describe("lib/pinata-file-service", () => {
  beforeEach(() => {
    process.env.PINATA_JWT = "test-pinata-token";
    process.env.PINATA_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (ORIGINAL_PINATA_JWT === undefined) {
      delete process.env.PINATA_JWT;
    } else {
      process.env.PINATA_JWT = ORIGINAL_PINATA_JWT;
    }

    if (ORIGINAL_GATEWAY === undefined) {
      delete process.env.PINATA_GATEWAY_BASE_URL;
    } else {
      process.env.PINATA_GATEWAY_BASE_URL = ORIGINAL_GATEWAY;
    }
  });

  it("detects when pinata configuration is available", () => {
    expect(isPinataConfigured()).toBe(true);
    delete process.env.PINATA_JWT;
    expect(isPinataConfigured()).toBe(false);
  });

  it("pins json and returns ipfs uri + gateway url", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ IpfsHash: "bafy-test-cid" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const pinned = await pinJsonToPinata({
      name: "collection-json",
      json: { hello: "world" }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(pinned).toEqual({
      cid: "bafy-test-cid",
      ipfsUri: "ipfs://bafy-test-cid",
      gatewayUrl: "https://gateway.pinata.cloud/ipfs/bafy-test-cid"
    });
  });

  it("throws when pinata returns an error response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      pinJsonToPinata({
        name: "asset-json",
        json: { name: "Asset" }
      })
    ).rejects.toMatchObject({
      name: "PinataFileServiceError",
      status: 401
    } satisfies Partial<PinataFileServiceError>);
  });

  it("creates collection/asset uris using pinata pins", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ IpfsHash: "bafy-collection" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ IpfsHash: "bafy-asset" })
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCoreCandyMachinePinataMetadataUris({
      collectionName: "Tower",
      assetNamePrefix: "Tower Fraction",
      collectionMetadata: { name: "Tower" },
      assetMetadata: { name: "Tower Fraction #$ID+1$" }
    });

    expect(result.collectionUri).toBe("ipfs://bafy-collection");
    expect(result.assetUri).toBe("ipfs://bafy-asset");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("pins a source image url to pinata and returns ipfs image uri", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "image/png" }),
        blob: async () => new Blob(["image-bytes"], { type: "image/png" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ IpfsHash: "bafy-image-cid" })
      });
    vi.stubGlobal("fetch", fetchMock);

    const pinned = await pinFileFromUrlToPinata({
      sourceUrl: "https://cdn.example.com/cover.png",
      name: "cover-image"
    });

    expect(pinned.ipfsUri).toBe("ipfs://bafy-image-cid");
    expect(pinned.gatewayUrl).toBe("https://gateway.pinata.cloud/ipfs/bafy-image-cid");
    expect(pinned.contentType).toBe("image/png");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reuses image uri directly when image is already ipfs", async () => {
    const resolved = await resolveImageForPinata({
      imageUri: "ipfs://bafy-existing/path/cover.webp",
      name: "cover-image"
    });

    expect(resolved).toEqual({
      imageUri: "ipfs://bafy-existing/path/cover.webp",
      imageGatewayUrl: "https://gateway.pinata.cloud/ipfs/bafy-existing/path/cover.webp",
      contentType: "image/webp"
    });
  });
});
