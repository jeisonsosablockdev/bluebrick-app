import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DistributionServiceError,
  createDistributionRunDraft,
  finalizePreparedDistributionRun
} from "@/lib/distributions/distribution-service";

const deps = {
  createDistributionDraft: vi.fn(),
  listStakeEventsForDistribution: vi.fn(),
  listWalletComplianceForDistribution: vi.fn(),
  calculateDistributionPreparation: vi.fn(),
  replaceDistributionItems: vi.fn(),
  blockDistributionRun: vi.fn(),
  finalizeDistributionRun: vi.fn(),
  appendDistributionAuditEvent: vi.fn()
};

describe("lib/distributions/distribution-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.createDistributionDraft.mockResolvedValue(baseRun());
    deps.listStakeEventsForDistribution.mockResolvedValue([]);
    deps.listWalletComplianceForDistribution.mockResolvedValue([]);
    deps.replaceDistributionItems.mockResolvedValue([]);
    deps.blockDistributionRun.mockResolvedValue({ ...baseRun(), status: "blocked", blockedReason: "unresolved_stake_events" });
    deps.finalizeDistributionRun.mockResolvedValue({ ...baseRun(), status: "finalized", outputChecksum: "sha256:ready" });
    deps.appendDistributionAuditEvent.mockResolvedValue({});
  });

  it("creates a draft and stores calculated wallet items", async () => {
    deps.listStakeEventsForDistribution.mockResolvedValue([
      { ownerWallet: "WalletA" },
      { ownerWallet: "WalletB" },
      { ownerWallet: "WalletA" }
    ]);
    deps.listWalletComplianceForDistribution.mockResolvedValue([
      { walletPublicKey: "WalletA", complianceStatus: "fully_verified" },
      { walletPublicKey: "WalletB", complianceStatus: "fully_verified" }
    ]);
    deps.calculateDistributionPreparation.mockReturnValue({
      status: "ready",
      blockedReasons: [],
      assetIntervals: [],
      walletAllocations: [
        {
          walletPublicKey: "WalletA",
          frozenSeconds: 100n,
          amountMinor: 700n,
          roundingRemainderRank: 0
        }
      ],
      exclusions: [],
      outputChecksum: "sha256:ready"
    });

    const result = await createDistributionRunDraft(validInput(), deps);

    expect(result.status).toBe("ready");
    expect(deps.createDistributionDraft).toHaveBeenCalledWith(expect.objectContaining({
      collectionAddress: "Collection111",
      totalAmountMinor: 1_000n
    }));
    expect(deps.listWalletComplianceForDistribution).toHaveBeenCalledWith(["WalletA", "WalletB"]);
    expect(deps.replaceDistributionItems).toHaveBeenCalledWith({
      runId: "run-1",
      outputChecksum: "sha256:ready",
      items: [
        {
          walletPublicKey: "WalletA",
          assetAddress: null,
          frozenSeconds: 100n,
          amountMinor: 700n,
          roundingRemainderRank: 0,
          itemPayload: {
            policyVersion: "v1"
          }
        }
      ]
    });
  });

  it("blocks the run when the engine reports unresolved events", async () => {
    deps.calculateDistributionPreparation.mockReturnValue({
      status: "blocked",
      blockedReasons: ["unresolved_stake_events"],
      assetIntervals: [],
      walletAllocations: [],
      exclusions: [],
      outputChecksum: "sha256:blocked"
    });

    const result = await createDistributionRunDraft(validInput(), deps);

    expect(result.status).toBe("blocked");
    expect(deps.blockDistributionRun).toHaveBeenCalledWith({
      runId: "run-1",
      blockedReason: "unresolved_stake_events"
    });
    expect(deps.replaceDistributionItems).not.toHaveBeenCalled();
  });

  it("rejects invalid amount input before creating a draft", async () => {
    const rejected = createDistributionRunDraft({
      ...validInput(),
      totalAmountMinor: "-1"
    }, deps);

    await expect(rejected).rejects.toBeInstanceOf(DistributionServiceError);
    await expect(rejected).rejects.toMatchObject({
      code: "INVALID_DISTRIBUTION_INPUT",
      status: 400
    });

    expect(deps.createDistributionDraft).not.toHaveBeenCalled();
  });

  it("finalizes a prepared run through the repository and records audit evidence", async () => {
    const result = await finalizePreparedDistributionRun({
      runId: "run-1",
      outputChecksum: "sha256:ready",
      actorId: "admin-1"
    }, deps);

    expect(result.status).toBe("finalized");
    expect(deps.finalizeDistributionRun).toHaveBeenCalledWith({
      runId: "run-1",
      outputChecksum: "sha256:ready",
      finalizedByActorId: "admin-1"
    });
    expect(deps.appendDistributionAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: "distribution_finalized"
    }));
  });
});

function validInput() {
  return {
    periodKey: "2026-05",
    collectionAddress: "Collection111",
    propertyId: "property-1",
    periodStartAt: "2026-05-01T05:00:00.000Z",
    periodEndAt: "2026-06-01T05:00:00.000Z",
    policyVersion: "v1",
    tokenMint: "USDC111",
    totalAmountMinor: "1000",
    actorId: "admin-1"
  };
}

function baseRun() {
  return {
    id: "run-1",
    periodKey: "2026-05",
    collectionAddress: "Collection111",
    propertyId: "property-1",
    periodStartAt: "2026-05-01T05:00:00.000Z",
    periodEndAt: "2026-06-01T05:00:00.000Z",
    periodTimezone: "America/Bogota",
    policyVersion: "v1",
    tokenMint: "USDC111",
    totalAmountMinor: 1_000n,
    status: "draft",
    blockedReason: null,
    outputChecksum: null,
    itemCount: 0,
    totalWallets: 0,
    createdByActorId: "admin-1",
    finalizedByActorId: null,
    finalizedAt: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z"
  };
}
