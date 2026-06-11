import { beforeEach, describe, expect, it, vi } from "vitest";

import { getInvestorOverview } from "@/lib/investor-overview-service";

const deps = {
  getProfileBundle: vi.fn(),
  listPurchaseAttempts: vi.fn(),
  listStakeAssetsForWallet: vi.fn(),
  listStakeProfileEventsByWallet: vi.fn(),
  listDistributionItemsByWallet: vi.fn()
};

describe("lib/investor-overview-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.getProfileBundle.mockResolvedValue({
      walletPublicKey: "Wallet111",
      kycStatus: "verified",
      complianceStatus: "fully_verified",
      updatedAt: "2026-06-05T00:00:00.000Z"
    });
    deps.listPurchaseAttempts.mockResolvedValue([
      {
        id: "purchase-1",
        status: "confirmed",
        walletPublicKey: "Wallet111",
        quantity: 2,
        preparedPriceLamports: 500,
        quotedPriceLamports: 400,
        createdAt: "2026-06-01T00:00:00.000Z"
      },
      {
        id: "purchase-2",
        status: "failed",
        walletPublicKey: "Wallet111",
        quantity: 1,
        preparedPriceLamports: 999,
        quotedPriceLamports: 999,
        createdAt: "2026-06-02T00:00:00.000Z"
      }
    ]);
    deps.listStakeAssetsForWallet.mockResolvedValue([
      stakeAsset("Asset111", "ready_to_stake"),
      stakeAsset("Asset222", "ready_to_unstake"),
      stakeAsset("Asset333", "sync_pending"),
      stakeAsset("Asset444", "disabled_unsupported")
    ]);
    deps.listStakeProfileEventsByWallet.mockResolvedValue([
      {
        id: "event-1",
        propertyTitle: "Torre Magnolia",
        productAction: "stake",
        txSignature: "sig-1",
        blockTime: "2026-06-03T00:00:00.000Z",
        observedAt: "2026-06-03T00:00:01.000Z",
        validationStatus: "validated"
      },
      {
        id: "event-2",
        propertyTitle: "Vista Mar",
        productAction: "unstake",
        txSignature: "sig-2",
        blockTime: null,
        observedAt: "2026-06-02T00:00:01.000Z",
        validationStatus: "reconcile_pending"
      }
    ]);
    deps.listDistributionItemsByWallet.mockResolvedValue([
      {
        id: "distribution-item-1",
        amountMinor: 250n,
        walletPublicKey: "Wallet111",
        run: {
          id: "run-1",
          status: "finalized",
          tokenMint: "USDC111",
          periodKey: "2026-05",
          collectionAddress: "Collection111",
          propertyId: "property-1",
          finalizedAt: "2026-06-04T00:00:00.000Z"
        }
      }
    ]);
  });

  it("returns wallet_required without calling investor data sources when no wallet is available", async () => {
    const overview = await getInvestorOverview({
      walletPublicKey: null,
      accountAuthenticated: true,
      sessionConflict: false
    }, deps);

    expect(overview.accountStatus).toBe("wallet_required");
    expect(overview.dataQuality.status).toBe("wallet_required");
    expect(deps.listPurchaseAttempts).not.toHaveBeenCalled();
    expect(deps.listStakeAssetsForWallet).not.toHaveBeenCalled();
  });

  it("aggregates confirmed purchases, current holdings, stake states, activity and finalized distributions", async () => {
    const overview = await getInvestorOverview({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    }, deps);

    expect(deps.listPurchaseAttempts).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      status: "confirmed",
      limit: 1000
    });
    expect(overview.accountStatus).toBe("wallet_bound");
    expect(overview.summary.historicalInvestedMinor).toBe("1000");
    expect(overview.summary.currentlyOwnedFractions).toBe(4);
    expect(overview.summary.readyToStakeCount).toBe(1);
    expect(overview.summary.readyToUnstakeCount).toBe(1);
    expect(overview.summary.syncPendingCount).toBe(1);
    expect(overview.summary.unsupportedCount).toBe(1);
    expect(overview.summary.preparedDistributionMinor).toBe("250");
    expect(overview.dataQuality.status).toBe("sync_pending");
    expect(overview.recentActivity).toHaveLength(2);
    expect(overview.recentActivity[1]?.validationStatus).toBe("reconcile_pending");
  });

  it("marks the overview as partial when optional distribution reads fail", async () => {
    deps.listDistributionItemsByWallet.mockRejectedValueOnce(new Error("relation distribution_items does not exist"));

    const overview = await getInvestorOverview({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    }, deps);

    expect(overview.dataQuality.status).toBe("partial");
    expect(overview.dataQuality.degradedSources).toContain("distributions");
    expect(overview.summary.preparedDistributionMinor).toBe("0");
  });
});

function stakeAsset(assetAddress: string, visibleState: "ready_to_stake" | "ready_to_unstake" | "sync_pending" | "disabled_unsupported") {
  return {
    assetAddress,
    propertyId: "property-1",
    propertyTitle: "Torre Magnolia",
    collectionAddress: "Collection111",
    candyMachineAddress: "Candy111",
    displayName: `${assetAddress} #1`,
    imageUrl: null,
    visibleState,
    action: visibleState === "ready_to_stake" ? "Stake" : visibleState === "ready_to_unstake" ? "Unstake" : null,
    isFrozen: visibleState === "ready_to_unstake",
    syncPending: visibleState === "sync_pending"
  };
}
