import { beforeEach, describe, expect, it, vi } from "vitest";

import { getInvestorPortfolio } from "@/lib/investor-portfolio-service";
import type { PropertyDetail } from "@/lib/property-service";
import type { StakeAssetItem } from "@/lib/stake-service";

const dependencies = {
  listStakeAssetsForWallet: vi.fn(),
  readPersistedMarketplaceEntries: vi.fn()
};

describe("lib/investor-portfolio-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.listStakeAssetsForWallet.mockResolvedValue([
      stakeAsset({
        assetAddress: "Asset111",
        collectionAddress: "CollectionAAA",
        propertyId: "property-a",
        propertyTitle: "Fix & Flip Alpha",
        visibleState: "ready_to_stake"
      }),
      stakeAsset({
        assetAddress: "Asset222",
        collectionAddress: "CollectionAAA",
        propertyId: "property-a",
        propertyTitle: "Fix & Flip Alpha",
        visibleState: "ready_to_unstake"
      }),
      stakeAsset({
        assetAddress: "Asset333",
        collectionAddress: "CollectionBBB",
        propertyId: "property-b",
        propertyTitle: "Fix & Flip Beta",
        visibleState: "sync_pending"
      })
    ]);
    dependencies.readPersistedMarketplaceEntries.mockResolvedValue({
      degraded: false,
      records: [
        propertyDetail({
          id: "property-a",
          title: "Fix & Flip Alpha",
          collectionAddress: "CollectionAAA",
          supplyTotal: 100,
          nftPriceUsd: 250,
          annualRoiPct: 10,
          projectedNetRoiPct: 12.5
        }),
        propertyDetail({
          id: "property-b",
          title: "Fix & Flip Beta",
          collectionAddress: "CollectionBBB",
          supplyTotal: 50,
          nftPriceUsd: 400,
          annualRoiPct: 9,
          projectedNetRoiPct: null
        })
      ]
    });
  });

  it("returns wallet_required without reading portfolio sources when wallet is absent", async () => {
    const portfolio = await getInvestorPortfolio({
      walletPublicKey: null,
      accountAuthenticated: true,
      sessionConflict: false
    }, dependencies);

    expect(portfolio.accountStatus).toBe("wallet_required");
    expect(portfolio.dataQuality.status).toBe("wallet_required");
    expect(portfolio.positions).toEqual([]);
    expect(dependencies.listStakeAssetsForWallet).not.toHaveBeenCalled();
    expect(dependencies.readPersistedMarketplaceEntries).not.toHaveBeenCalled();
  });

  it("groups current wallet NFTs by collection and enriches positions from marketplace data", async () => {
    const portfolio = await getInvestorPortfolio({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    }, dependencies);

    expect(dependencies.listStakeAssetsForWallet).toHaveBeenCalledWith("Wallet111");
    expect(portfolio.dataQuality.status).toBe("ready");
    expect(portfolio.summary.positionCount).toBe(2);
    expect(portfolio.summary.totalOwnedQuantity).toBe(3);

    const alpha = portfolio.positions.find((position) => position.collectionAddress === "CollectionAAA");
    expect(alpha).toMatchObject({
      propertyId: "property-a",
      propertyTitle: "Fix & Flip Alpha",
      ownedQuantity: 2,
      supplyTotal: 100,
      projectOwnershipPct: 2,
      purchasePriceUsd: 500,
      purchasePriceSource: "marketplace_listing_usd",
      estimatedYieldPct: 12.5,
      yieldSource: "marketplace_projected_net_roi",
      nftIds: ["Asset111", "Asset222"],
      nftIdPreview: ["Asset111", "Asset222"],
      statusCounts: {
        readyToStake: 1,
        readyToUnstake: 1,
        syncPending: 0,
        unsupported: 0
      }
    });

    const beta = portfolio.positions.find((position) => position.collectionAddress === "CollectionBBB");
    expect(beta).toMatchObject({
      ownedQuantity: 1,
      supplyTotal: 50,
      projectOwnershipPct: 2,
      purchasePriceUsd: 400,
      estimatedYieldPct: 9,
      yieldSource: "marketplace_annual_roi"
    });
  });

  it("marks portfolio partial when an owned collection has no marketplace record", async () => {
    dependencies.readPersistedMarketplaceEntries.mockResolvedValueOnce({
      degraded: false,
      records: [
        propertyDetail({
          id: "property-a",
          title: "Fix & Flip Alpha",
          collectionAddress: "CollectionAAA",
          supplyTotal: 100,
          nftPriceUsd: 250,
          annualRoiPct: 10,
          projectedNetRoiPct: 12.5
        })
      ]
    });

    const portfolio = await getInvestorPortfolio({
      walletPublicKey: "Wallet111",
      accountAuthenticated: true,
      sessionConflict: false
    }, dependencies);

    expect(portfolio.dataQuality.status).toBe("partial");
    expect(portfolio.dataQuality.degradedSources).toContain("marketplace:CollectionBBB");
    expect(portfolio.positions.find((position) => position.collectionAddress === "CollectionBBB")).toMatchObject({
      propertyTitle: "Fix & Flip Beta",
      purchasePriceUsd: null,
      purchasePriceSource: "unavailable",
      estimatedYieldPct: null,
      yieldSource: "unavailable",
      projectOwnershipPct: null
    });
  });
});

function stakeAsset(input: {
  assetAddress: string;
  collectionAddress: string;
  propertyId: string;
  propertyTitle: string;
  visibleState: StakeAssetItem["visibleState"];
}): StakeAssetItem {
  return {
    assetAddress: input.assetAddress,
    propertyId: input.propertyId,
    propertyTitle: input.propertyTitle,
    collectionAddress: input.collectionAddress,
    candyMachineAddress: `Candy-${input.collectionAddress}`,
    displayName: `${input.propertyTitle} #1`,
    imageUrl: null,
    visibleState: input.visibleState,
    action: input.visibleState === "ready_to_stake"
      ? "Stake"
      : input.visibleState === "ready_to_unstake"
        ? "Unstake"
        : null,
    isFrozen: input.visibleState === "ready_to_unstake",
    syncPending: input.visibleState === "sync_pending"
  };
}

function propertyDetail(input: {
  id: string;
  title: string;
  collectionAddress: string;
  supplyTotal: number;
  nftPriceUsd: number;
  annualRoiPct: number;
  projectedNetRoiPct: number | null;
}): PropertyDetail {
  return {
    id: input.id,
    title: input.title,
    city: "Bogota",
    country: "CO",
    postalCode: null,
    locationLabel: "Bogota, CO",
    listingStatus: "active",
    image: "https://example.com/property.jpg",
    galleryImages: [],
    propertyImages: [],
    shortDescription: "Property summary",
    detailedLocation: "Bogota, CO",
    highlights: [],
    investmentNotes: "Investment notes",
    investment: {
      supplyTotal: input.supplyTotal,
      mintedOrSold: 0,
      nftPriceUsd: input.nftPriceUsd,
      annualRoiPct: input.annualRoiPct,
      availabilityLabel: "Available"
    },
    project: {
      stage: "funding",
      developerName: "BRIDS",
      exitStrategy: "sale",
      durationMonths: 12
    },
    economics: {
      purchasePriceUsd: null,
      afterRepairValueUsd: null,
      rehabBudgetUsd: null,
      closingCostsUsd: null,
      holdingCostsUsd: null,
      sellingCostsUsd: null,
      totalProjectCostUsd: null,
      minimumCapitalRequiredUsd: null,
      structuringFeeUsd: null,
      grossProfitProjectedUsd: null,
      managementFeeUsd: null,
      brokerFeeUsd: null,
      netInvestorProfitUsd: null,
      projectedNetRoiPct: input.projectedNetRoiPct
    },
    governance: {
      riskNotes: "Risk notes"
    },
    documents: [
      {
        id: "brochure",
        label: "Brochure",
        url: "https://example.com/brochure.pdf"
      }
    ],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: input.collectionAddress,
      assetMintAddress: "AssetMint111",
      explorerUrl: "https://explorer.solana.com",
      lastOnchainUpdate: null,
      syncStatus: "available"
    }
  };
}
