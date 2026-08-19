import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  finalizeCoreCandyMachineSnapshot: vi.fn(),
  isCoreCandyMachineSnapshotError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/nft-minting/application/core-candy-machine-snapshot-service", () => ({
  finalizeCoreCandyMachineSnapshot: routeMocks.finalizeCoreCandyMachineSnapshot,
  isCoreCandyMachineSnapshotError: routeMocks.isCoreCandyMachineSnapshotError
}));

import { POST } from "@/app/api/admin/core-candy-machine/snapshot/finalize/route";

describe("api/admin/core-candy-machine/snapshot/finalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd"
    });
    routeMocks.isCoreCandyMachineSnapshotError.mockReturnValue(false);
  });

  it("returns 403 when requester is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "user",
      pubkey: "11111111111111111111111111111111"
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/snapshot/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
    expect(routeMocks.finalizeCoreCandyMachineSnapshot).not.toHaveBeenCalled();
  });

  it("returns input validation errors with status", async () => {
    const inputError = new Error("draftId is required.");
    Object.assign(inputError, { status: 400, code: "INVALID_SNAPSHOT_PAYLOAD" });

    routeMocks.finalizeCoreCandyMachineSnapshot.mockRejectedValue(inputError);
    routeMocks.isCoreCandyMachineSnapshotError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/snapshot/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("draftId is required.");
    expect(payload.code).toBe("INVALID_SNAPSHOT_PAYLOAD");
  });

  it("returns finalized snapshot payload", async () => {
    routeMocks.finalizeCoreCandyMachineSnapshot.mockResolvedValue({
      snapshotId: "snapshot-1",
      mintJobId: "mint-job-1",
      verificationStatus: "verified",
      verificationMethod: "das_get_assets_by_group",
      marketplaceHandoffStatus: "ready",
      expectedQuantity: 400,
      foundAssets: 400,
      canCreateAsset: true,
      verificationError: null
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/snapshot/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draftId: "draft-1",
        formSnapshot: { internalCode: "INT-001" },
        mint: {
          quantity: 400,
          candyMachineAddress: "96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3",
          collectionAddress: "G695Q59UUEoWKGdJvBY2msh1CqDzB91ri1G18VJQGGy5",
          signatures: []
        }
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.snapshotId).toBe("snapshot-1");
    expect(payload.canCreateAsset).toBe(true);
  });
});
