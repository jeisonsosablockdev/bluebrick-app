import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromRequest: vi.fn(),
  listStakeProfileEventsByWallet: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromRequest: routeMocks.getAuthenticatedPublicKeyFromRequest
}));

vi.mock("@/features/staking-distribution/infrastructure/stake-profile-events-repository", () => ({
  listStakeProfileEventsByWallet: routeMocks.listStakeProfileEventsByWallet
}));

import { GET } from "@/app/api/protected/profile/stake-history/route";

describe("GET /api/protected/profile/stake-history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValue("Wallet11111111111111111111111111111111111");
    routeMocks.listStakeProfileEventsByWallet.mockResolvedValue([]);
  });

  it("returns 401 when wallet session is missing", async () => {
    routeMocks.getAuthenticatedPublicKeyFromRequest.mockReturnValueOnce(null);

    const response = await GET(new NextRequest("https://example.com/api/protected/profile/stake-history"));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the stake history for the authenticated wallet", async () => {
    routeMocks.listStakeProfileEventsByWallet.mockResolvedValueOnce([
      {
        id: "event-1",
        propertyTitle: "Torre Magnolia",
        productAction: "stake",
        txSignature: "sig-1",
        blockTime: "2026-05-27T12:00:00.000Z",
        observedAt: "2026-05-27T12:00:01.000Z",
        validationStatus: "validated"
      }
    ]);

    const response = await GET(new NextRequest("https://example.com/api/protected/profile/stake-history"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.walletPublicKey).toBe("Wallet11111111111111111111111111111111111");
    expect(payload.data.items).toHaveLength(1);
  });
});

