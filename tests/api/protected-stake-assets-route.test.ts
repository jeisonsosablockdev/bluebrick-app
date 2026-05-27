import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  listStakeAssetsForWallet: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/stake-service", () => ({
  StakeFlowError: class StakeFlowError extends Error {
    code: string;
    status: number;

    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
  listStakeAssetsForWallet: routeMocks.listStakeAssetsForWallet
}));

import { GET } from "@/app/api/protected/stake/assets/route";

describe("GET /api/protected/stake/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111"
    });
    routeMocks.listStakeAssetsForWallet.mockResolvedValue([]);
  });

  it("returns 401 when wallet session is missing", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await GET(new NextRequest("https://example.com/api/protected/stake/assets"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the wallet inventory when authenticated", async () => {
    routeMocks.listStakeAssetsForWallet.mockResolvedValueOnce([
      {
        assetAddress: "Asset111",
        propertyId: "property-1",
        propertyTitle: "Torre Magnolia",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        displayName: "Fraction #1",
        imageUrl: null,
        visibleState: "ready_to_stake",
        action: "Stake",
        isFrozen: false,
        syncPending: false
      }
    ]);

    const response = await GET(new NextRequest("https://example.com/api/protected/stake/assets"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.walletPublicKey).toBe("Wallet11111111111111111111111111111111111");
    expect(payload.data.items).toHaveLength(1);
  });
});

