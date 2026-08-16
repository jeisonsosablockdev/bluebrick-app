import { describe, expect, it } from "vitest";

import {
  calculateDistributionPreparation,
  type DistributionCalculationInput
} from "@/features/staking-distribution/application/distribution-engine";

const baseInput: DistributionCalculationInput = {
  scope: {
    collectionAddress: "Collection111",
    propertyId: "property-1"
  },
  periodStartAt: "2026-05-01T05:00:00.000Z",
  periodEndAt: "2026-06-01T05:00:00.000Z",
  totalAmountMinor: 1_000n,
  policyVersion: "v1",
  stakeEvents: [],
  walletEligibility: []
};

describe("features/staking-distribution/application/distribution-engine", () => {
  it("counts only validated events matching the run collection/property scope", () => {
    const result = calculateDistributionPreparation({
      ...baseInput,
      stakeEvents: [
        event("WalletA", "AssetA", "stake", "2026-05-10T05:00:00.000Z"),
        event("WalletA", "AssetA", "unstake", "2026-05-11T05:00:00.000Z"),
        event("WalletB", "AssetB", "stake", "2026-05-10T05:00:00.000Z", {
          collectionAddress: "OtherCollection"
        }),
        event("WalletB", "AssetB", "unstake", "2026-05-11T05:00:00.000Z", {
          collectionAddress: "OtherCollection"
        })
      ],
      walletEligibility: [eligible("WalletA"), eligible("WalletB")]
    });

    expect(result.status).toBe("ready");
    expect(result.walletAllocations).toHaveLength(1);
    expect(result.walletAllocations[0]).toMatchObject({
      walletPublicKey: "WalletA",
      frozenSeconds: 86_400n,
      amountMinor: 1_000n
    });
  });

  it("uses the validated frozen state at period start and closes open intervals at period end", () => {
    const result = calculateDistributionPreparation({
      ...baseInput,
      stakeEvents: [
        event("WalletA", "AssetA", "stake", "2026-04-20T05:00:00.000Z"),
        event("WalletA", "AssetA", "unstake", "2026-05-02T05:00:00.000Z"),
        event("WalletB", "AssetB", "stake", "2026-05-31T05:00:00.000Z")
      ],
      walletEligibility: [eligible("WalletA"), eligible("WalletB")]
    });

    expect(result.status).toBe("ready");
    expect(result.assetIntervals).toEqual([
      {
        assetAddress: "AssetA",
        ownerWallet: "WalletA",
        frozenSeconds: 86_400n,
        intervalStartAt: "2026-05-01T05:00:00.000Z",
        intervalEndAt: "2026-05-02T05:00:00.000Z"
      },
      {
        assetAddress: "AssetB",
        ownerWallet: "WalletB",
        frozenSeconds: 86_400n,
        intervalStartAt: "2026-05-31T05:00:00.000Z",
        intervalEndAt: "2026-06-01T05:00:00.000Z"
      }
    ]);
  });

  it("blocks finalization when relevant pending events exist", () => {
    const result = calculateDistributionPreparation({
      ...baseInput,
      stakeEvents: [
        event("WalletA", "AssetA", "stake", "2026-05-10T05:00:00.000Z", {
          validationStatus: "reconcile_pending",
          blockTime: null
        })
      ],
      walletEligibility: [eligible("WalletA")]
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReasons).toContain("unresolved_stake_events");
    expect(result.walletAllocations).toHaveLength(0);
  });

  it("excludes wallets without fully verified compliance status", () => {
    const result = calculateDistributionPreparation({
      ...baseInput,
      stakeEvents: [
        event("WalletA", "AssetA", "stake", "2026-05-10T05:00:00.000Z"),
        event("WalletA", "AssetA", "unstake", "2026-05-11T05:00:00.000Z"),
        event("WalletB", "AssetB", "stake", "2026-05-10T05:00:00.000Z"),
        event("WalletB", "AssetB", "unstake", "2026-05-11T05:00:00.000Z")
      ],
      walletEligibility: [eligible("WalletA"), ineligible("WalletB")]
    });

    expect(result.walletAllocations).toHaveLength(1);
    expect(result.walletAllocations[0]?.walletPublicKey).toBe("WalletA");
    expect(result.exclusions).toContainEqual({
      walletPublicKey: "WalletB",
      reason: "wallet_not_fully_verified"
    });
  });

  it("allocates with integer math and deterministic remainder ranking", () => {
    const result = calculateDistributionPreparation({
      ...baseInput,
      totalAmountMinor: 11n,
      stakeEvents: [
        event("WalletA", "AssetA", "stake", "2026-05-01T05:00:00.000Z"),
        event("WalletA", "AssetA", "unstake", "2026-05-01T05:00:03.000Z"),
        event("WalletB", "AssetB", "stake", "2026-05-01T05:00:00.000Z"),
        event("WalletB", "AssetB", "unstake", "2026-05-01T05:00:02.000Z")
      ],
      walletEligibility: [eligible("WalletA"), eligible("WalletB")]
    });

    expect(result.walletAllocations).toEqual([
      {
        walletPublicKey: "WalletA",
        frozenSeconds: 3n,
        amountMinor: 6n,
        roundingRemainderRank: 0
      },
      {
        walletPublicKey: "WalletB",
        frozenSeconds: 2n,
        amountMinor: 4n,
        roundingRemainderRank: 1
      }
    ]);
    expect(result.outputChecksum).toMatch(/^sha256:/);
  });
});

function eligible(walletPublicKey: string) {
  return {
    walletPublicKey,
    complianceStatus: "fully_verified" as const
  };
}

function ineligible(walletPublicKey: string) {
  return {
    walletPublicKey,
    complianceStatus: "pending_kyc" as const
  };
}

function event(
  ownerWallet: string,
  assetAddress: string,
  productAction: "stake" | "unstake",
  blockTime: string,
  overrides: Partial<DistributionCalculationInput["stakeEvents"][number]> = {}
) {
  return {
    ownerWallet,
    assetAddress,
    collectionAddress: "Collection111",
    propertyId: "property-1",
    productAction,
    validationStatus: "validated" as const,
    blockTime,
    observedAt: blockTime,
    slot: 1,
    instructionIndex: 0,
    txSignature: `${assetAddress}-${productAction}-${blockTime}`,
    ...overrides
  };
}
