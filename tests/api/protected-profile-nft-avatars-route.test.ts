import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => {
  class MockDasClientError extends Error {
    status: number;
    code: string;

    constructor(code: string, message: string, status = 500) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }

  return {
    getAuthenticatedPublicKeyFromRequest: vi.fn(),
    getAssetsByOwner: vi.fn(),
    MockDasClientError
  };
});

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/lib/das-client", () => ({
  DasClient: vi.fn().mockImplementation(() => ({
    getAssetsByOwner: routeMocks.getAssetsByOwner
  })),
  isDasClientError: (error: unknown) => error instanceof routeMocks.MockDasClientError
}));

import { GET } from "@/app/api/protected/profile/nft-avatars/route";

function createRequest(url = "https://example.com/api/protected/profile/nft-avatars"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("/api/protected/profile/nft-avatars route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.getAssetsByOwner.mockResolvedValue({
      items: [],
      page: 1,
      limit: 72
    });
  });

  it("returns 401 when session is missing", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns parsed NFT avatars with normalized ipfs image URLs", async () => {
    routeMocks.getAssetsByOwner.mockResolvedValueOnce({
      items: [
        {
          id: "Asset111111111111111111111111111111111111111",
          interface: "V1_NFT",
          content: {
            metadata: {
              name: "Genesis Avatar",
              symbol: "GEN"
            },
            links: {
              image: "ipfs://QmAvatarImageCid"
            }
          }
        },
        {
          id: "Asset222222222222222222222222222222222222222",
          interface: "V1_NFT",
          content: {
            metadata: {
              name: "Fallback NFT",
              image: "https://cdn.example.com/fallback.png"
            }
          }
        },
        {
          id: "Asset333333333333333333333333333333333333333",
          interface: "FungibleToken",
          content: {
            metadata: {
              name: "Token"
            }
          }
        }
      ],
      page: 1,
      limit: 72
    });

    const response = await GET(createRequest("https://example.com/api/protected/profile/nft-avatars?limit=2"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.walletPublicKey).toBe("Wallet11111111111111111111111111111111111");
    expect(payload.data.items).toHaveLength(2);
    expect(payload.data.items[0]).toEqual({
      assetId: "Asset111111111111111111111111111111111111111",
      name: "Genesis Avatar",
      symbol: "GEN",
      imageUrl: "https://gateway.pinata.cloud/ipfs/QmAvatarImageCid"
    });
    expect(payload.data.items[1]).toEqual({
      assetId: "Asset222222222222222222222222222222222222222",
      name: "Fallback NFT",
      symbol: null,
      imageUrl: "https://cdn.example.com/fallback.png"
    });
  });

  it("propagates DAS client errors", async () => {
    routeMocks.getAssetsByOwner.mockRejectedValueOnce(
      new routeMocks.MockDasClientError("DAS_HTTP_ERROR", "DAS unavailable", 502)
    );

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("DAS_HTTP_ERROR");
    expect(payload.error.message).toBe("DAS unavailable");
  });
});
