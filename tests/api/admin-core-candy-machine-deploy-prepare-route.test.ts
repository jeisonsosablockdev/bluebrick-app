import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  prepareCoreCandyMachineDeploy: vi.fn(),
  isCoreCandyMachineAdminInputError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/nft-minting/application/core-candy-machine-admin", () => ({
  prepareCoreCandyMachineDeploy: routeMocks.prepareCoreCandyMachineDeploy,
  isCoreCandyMachineAdminInputError: routeMocks.isCoreCandyMachineAdminInputError
}));

import { POST } from "@/app/api/admin/core-candy-machine/deploy/prepare/route";

describe("api/admin/core-candy-machine/deploy/prepare", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
    routeMocks.isCoreCandyMachineAdminInputError.mockReturnValue(false);
  });

  it("returns underlying non-input error message instead of generic 500 text", async () => {
    routeMocks.prepareCoreCandyMachineDeploy.mockRejectedValue(new Error("Failed to serialize deploy transaction."));

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/deploy/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        startDate: "2026-03-17T20:00:00.000Z"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Failed to serialize deploy transaction.");
  });

  it("keeps returning structured input errors with their original status", async () => {
    const inputError = new Error("collectionUri is required.");
    Object.assign(inputError, { status: 400 });

    routeMocks.prepareCoreCandyMachineDeploy.mockRejectedValue(inputError);
    routeMocks.isCoreCandyMachineAdminInputError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/deploy/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("collectionUri is required.");
  });

  it("forwards priceUsdcAtomic when provided", async () => {
    routeMocks.prepareCoreCandyMachineDeploy.mockResolvedValue({
      deployId: "deploy-1",
      candyMachineAddress: "11111111111111111111111111111111",
      collectionAddress: "11111111111111111111111111111111",
      quantity: 1,
      paymentMode: "USDC",
      priceUsdcAtomic: 1500000,
      priceLamports: null,
      startDate: "2026-03-17T20:00:00.000Z",
      transactions: []
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/deploy/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionName: "Collection",
        collectionUri: "ipfs://collection-cid",
        assetNamePrefix: "Asset",
        assetUri: "ipfs://asset-cid",
        quantity: 1,
        priceUsdcAtomic: 1500000,
        startDate: "2026-03-17T20:00:00.000Z"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(routeMocks.prepareCoreCandyMachineDeploy).toHaveBeenCalledWith(expect.objectContaining({
      priceUsdcAtomic: 1500000
    }));
  });
});
