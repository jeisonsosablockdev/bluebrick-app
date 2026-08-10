import "server-only";

import {
  readPersistedMarketplaceEntries,
  type PersistedMarketplaceEntriesResult
} from "@/lib/marketplace/property-read-repository";
import type { PropertyDetail } from "@/lib/property-service";
import {
  listStakeAssetsForWallet,
  type StakeAssetItem,
  type StakeVisibleState
} from "@/lib/stake-service";

type InvestorPortfolioAccountStatus = "wallet_bound" | "wallet_required" | "session_conflict";
type InvestorPortfolioDataStatus = "ready" | "partial" | "empty" | "wallet_required" | "error";
type PurchasePriceSource = "marketplace_listing_usd" | "unavailable";
type YieldSource = "marketplace_projected_net_roi" | "marketplace_annual_roi" | "unavailable";

export type InvestorPortfolioInput = {
  walletPublicKey: string | null;
  accountAuthenticated: boolean;
  sessionConflict: boolean;
};

export type InvestorPortfolioPosition = {
  collectionAddress: string;
  propertyId: string;
  propertyTitle: string;
  locationLabel: string | null;
  imageUrl: string | null;
  nftIds: string[];
  nftIdPreview: string[];
  ownedQuantity: number;
  supplyTotal: number | null;
  projectOwnershipPct: number | null;
  purchasePriceUsd: number | null;
  purchasePriceSource: PurchasePriceSource;
  estimatedYieldPct: number | null;
  yieldSource: YieldSource;
  statusCounts: {
    readyToStake: number;
    readyToUnstake: number;
    syncPending: number;
    unsupported: number;
  };
  documents: Array<{
    id: string;
    label: string;
    url: string;
  }>;
};

export type InvestorPortfolioDTO = {
  walletPublicKey: string | null;
  accountStatus: InvestorPortfolioAccountStatus;
  positions: InvestorPortfolioPosition[];
  summary: {
    positionCount: number;
    totalOwnedQuantity: number;
    knownProjectOwnershipPctSum: number;
    knownPurchasePriceUsd: number;
  };
  dataQuality: {
    status: InvestorPortfolioDataStatus;
    degradedSources: string[];
    refreshedAt: string;
  };
};

export type InvestorPortfolioDependencies = {
  listStakeAssetsForWallet: (walletPublicKey: string) => Promise<StakeAssetItem[]>;
  readPersistedMarketplaceEntries: () => Promise<PersistedMarketplaceEntriesResult>;
};

type CollectionPositionDraft = {
  collectionAddress: string;
  assets: StakeAssetItem[];
};

const NFT_PREVIEW_LIMIT = 4;

const defaultDependencies: InvestorPortfolioDependencies = {
  listStakeAssetsForWallet,
  readPersistedMarketplaceEntries
};

export async function getInvestorPortfolio(
  input: InvestorPortfolioInput,
  dependencies: InvestorPortfolioDependencies = defaultDependencies
): Promise<InvestorPortfolioDTO> {
  if (input.sessionConflict) {
    return createEmptyPortfolio({
      walletPublicKey: null,
      accountStatus: "session_conflict",
      status: "error"
    });
  }

  if (!input.walletPublicKey) {
    return createEmptyPortfolio({
      walletPublicKey: null,
      accountStatus: "wallet_required",
      status: "wallet_required"
    });
  }

  const walletPublicKey = input.walletPublicKey;
  const [stakeAssets, marketplace] = await Promise.all([
    dependencies.listStakeAssetsForWallet(walletPublicKey),
    dependencies.readPersistedMarketplaceEntries()
  ]);

  const marketplaceByCollection = indexMarketplaceByCollection(marketplace.records);
  const groupedAssets = groupAssetsByCollection(stakeAssets);
  const degradedSources = marketplace.degraded ? ["marketplace"] : [];
  const positions = groupedAssets.map((draft) => {
    const marketplaceRecord = marketplaceByCollection.get(normalizeCollectionKey(draft.collectionAddress)) ?? null;
    if (!marketplaceRecord) {
      degradedSources.push(`marketplace:${draft.collectionAddress}`);
    }

    return buildPortfolioPosition(draft, marketplaceRecord);
  });

  return {
    walletPublicKey,
    accountStatus: "wallet_bound",
    positions,
    summary: summarizePositions(positions),
    dataQuality: {
      status: resolvePortfolioStatus({
        hasPositions: positions.length > 0,
        degradedSources
      }),
      degradedSources,
      refreshedAt: new Date().toISOString()
    }
  };
}

function createEmptyPortfolio(input: {
  walletPublicKey: string | null;
  accountStatus: InvestorPortfolioAccountStatus;
  status: InvestorPortfolioDataStatus;
}): InvestorPortfolioDTO {
  return {
    walletPublicKey: input.walletPublicKey,
    accountStatus: input.accountStatus,
    positions: [],
    summary: {
      positionCount: 0,
      totalOwnedQuantity: 0,
      knownProjectOwnershipPctSum: 0,
      knownPurchasePriceUsd: 0
    },
    dataQuality: {
      status: input.status,
      degradedSources: [],
      refreshedAt: new Date().toISOString()
    }
  };
}

function indexMarketplaceByCollection(records: PropertyDetail[]): Map<string, PropertyDetail> {
  return new Map(
    records.map((record) => [
      normalizeCollectionKey(record.blockchain.collectionAddress),
      record
    ])
  );
}

function normalizeCollectionKey(collectionAddress: string): string {
  return collectionAddress.trim().toLowerCase();
}

function groupAssetsByCollection(assets: StakeAssetItem[]): CollectionPositionDraft[] {
  const draftsByCollection = new Map<string, CollectionPositionDraft>();

  for (const asset of assets) {
    const key = normalizeCollectionKey(asset.collectionAddress);
    const found = draftsByCollection.get(key);
    if (found) {
      found.assets.push(asset);
      continue;
    }

    draftsByCollection.set(key, {
      collectionAddress: asset.collectionAddress,
      assets: [asset]
    });
  }

  return Array.from(draftsByCollection.values()).sort((left, right) => {
    const leftTitle = firstAsset(left).propertyTitle;
    const rightTitle = firstAsset(right).propertyTitle;
    return leftTitle.localeCompare(rightTitle);
  });
}

function buildPortfolioPosition(
  draft: CollectionPositionDraft,
  marketplaceRecord: PropertyDetail | null
): InvestorPortfolioPosition {
  const first = firstAsset(draft);
  const ownedQuantity = draft.assets.length;
  const supplyTotal = resolveSupplyTotal(marketplaceRecord);
  const purchasePrice = resolvePurchasePriceUsd(marketplaceRecord, ownedQuantity);
  const estimatedYield = resolveEstimatedYield(marketplaceRecord);

  return {
    collectionAddress: draft.collectionAddress,
    propertyId: marketplaceRecord?.id ?? first.propertyId,
    propertyTitle: marketplaceRecord?.title ?? first.propertyTitle,
    locationLabel: marketplaceRecord?.locationLabel ?? null,
    imageUrl: marketplaceRecord?.image ?? first.imageUrl,
    nftIds: draft.assets.map((asset) => asset.assetAddress),
    nftIdPreview: draft.assets.slice(0, NFT_PREVIEW_LIMIT).map((asset) => asset.assetAddress),
    ownedQuantity,
    supplyTotal,
    projectOwnershipPct: calculateProjectOwnershipPct(ownedQuantity, supplyTotal),
    purchasePriceUsd: purchasePrice.value,
    purchasePriceSource: purchasePrice.source,
    estimatedYieldPct: estimatedYield.value,
    yieldSource: estimatedYield.source,
    statusCounts: countStakeStates(draft.assets),
    documents: marketplaceRecord?.documents.map((document) => ({ ...document })) ?? []
  };
}

function firstAsset(draft: CollectionPositionDraft): StakeAssetItem {
  const first = draft.assets[0];
  if (!first) {
    throw new Error("Portfolio collection group cannot be empty.");
  }

  return first;
}

function resolveSupplyTotal(marketplaceRecord: PropertyDetail | null): number | null {
  const supplyTotal = marketplaceRecord?.investment.supplyTotal;
  return Number.isFinite(supplyTotal) && Number(supplyTotal) > 0 ? Number(supplyTotal) : null;
}

function calculateProjectOwnershipPct(ownedQuantity: number, supplyTotal: number | null): number | null {
  if (!supplyTotal) {
    return null;
  }

  return roundToSixDecimals((ownedQuantity / supplyTotal) * 100);
}

function resolvePurchasePriceUsd(
  marketplaceRecord: PropertyDetail | null,
  ownedQuantity: number
): { value: number | null; source: PurchasePriceSource } {
  const unitPrice = marketplaceRecord?.investment.nftPriceUsd;
  if (!Number.isFinite(unitPrice) || Number(unitPrice) <= 0) {
    return {
      value: null,
      source: "unavailable"
    };
  }

  return {
    value: roundToTwoDecimals(Number(unitPrice) * ownedQuantity),
    source: "marketplace_listing_usd"
  };
}

function resolveEstimatedYield(
  marketplaceRecord: PropertyDetail | null
): { value: number | null; source: YieldSource } {
  const projectedNetRoi = marketplaceRecord?.economics.projectedNetRoiPct;
  if (Number.isFinite(projectedNetRoi)) {
    return {
      value: Number(projectedNetRoi),
      source: "marketplace_projected_net_roi"
    };
  }

  const annualRoi = marketplaceRecord?.investment.annualRoiPct;
  if (Number.isFinite(annualRoi)) {
    return {
      value: Number(annualRoi),
      source: "marketplace_annual_roi"
    };
  }

  return {
    value: null,
    source: "unavailable"
  };
}

function countStakeStates(assets: StakeAssetItem[]): InvestorPortfolioPosition["statusCounts"] {
  return assets.reduce(
    (counts, asset) => ({
      readyToStake: counts.readyToStake + (asset.visibleState === "ready_to_stake" ? 1 : 0),
      readyToUnstake: counts.readyToUnstake + (asset.visibleState === "ready_to_unstake" ? 1 : 0),
      syncPending: counts.syncPending + (asset.visibleState === "sync_pending" ? 1 : 0),
      unsupported: counts.unsupported + (asset.visibleState === "disabled_unsupported" ? 1 : 0)
    }),
    {
      readyToStake: 0,
      readyToUnstake: 0,
      syncPending: 0,
      unsupported: 0
    }
  );
}

function summarizePositions(positions: InvestorPortfolioPosition[]): InvestorPortfolioDTO["summary"] {
  return {
    positionCount: positions.length,
    totalOwnedQuantity: sumNumbers(positions.map((position) => position.ownedQuantity)),
    knownProjectOwnershipPctSum: roundToSixDecimals(sumNumbers(positions.map((position) => position.projectOwnershipPct ?? 0))),
    knownPurchasePriceUsd: roundToTwoDecimals(sumNumbers(positions.map((position) => position.purchasePriceUsd ?? 0)))
  };
}

function resolvePortfolioStatus(input: {
  hasPositions: boolean;
  degradedSources: string[];
}): InvestorPortfolioDataStatus {
  if (!input.hasPositions) {
    return "empty";
  }

  return input.degradedSources.length > 0 ? "partial" : "ready";
}

function sumNumbers(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToSixDecimals(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
