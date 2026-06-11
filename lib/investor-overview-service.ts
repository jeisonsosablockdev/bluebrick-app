import "server-only";

import {
  getOrCreateProfileBundle,
  type ProfileBundle
} from "@/lib/compliance/profile-repository";
import {
  listDistributionItemsByWallet,
  type DistributionItemWithRunRecord
} from "@/lib/distributions/distribution-repository";
import {
  listPurchaseAttempts,
  type PurchaseAttemptRecord
} from "@/lib/purchase-attempts-repository";
import {
  listStakeProfileEventsByWallet,
  type StakeProfileEventRecord
} from "@/lib/stake-profile-events-repository";
import {
  listStakeAssetsForWallet,
  type StakeAssetItem
} from "@/lib/stake-service";

type InvestorOverviewAccountStatus = "wallet_bound" | "wallet_required" | "session_conflict";
type InvestorOverviewDataStatus = "ready" | "partial" | "empty" | "wallet_required" | "sync_pending" | "error";

export type InvestorOverviewInput = {
  walletPublicKey: string | null;
  accountAuthenticated: boolean;
  sessionConflict: boolean;
};

export type InvestorOverviewDTO = {
  walletPublicKey: string | null;
  accountStatus: InvestorOverviewAccountStatus;
  profile: {
    kycStatus: string | null;
    complianceStatus: string | null;
    profileCompletedAt: string | null;
  };
  summary: {
    historicalInvestedMinor: string;
    historicalInvestedCurrency: "LAMPORTS";
    currentlyOwnedFractions: number;
    readyToStakeCount: number;
    readyToUnstakeCount: number;
    syncPendingCount: number;
    unsupportedCount: number;
    preparedDistributionMinor: string;
    preparedDistributionCurrency: string | null;
  };
  holdingsPreview: Array<{
    assetAddress: string;
    propertyId: string;
    propertyTitle: string;
    collectionAddress: string;
    visibleState: StakeAssetItem["visibleState"];
    imageUrl: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: StakeProfileEventRecord["productAction"];
    propertyTitle: string;
    txSignature: string;
    validationStatus: StakeProfileEventRecord["validationStatus"];
    occurredAt: string;
  }>;
  dataQuality: {
    status: InvestorOverviewDataStatus;
    degradedSources: string[];
    refreshedAt: string;
  };
};

export type InvestorOverviewDependencies = {
  getProfileBundle: (walletPublicKey: string) => Promise<Pick<ProfileBundle, "walletPublicKey" | "kycStatus" | "complianceStatus" | "updatedAt">>;
  listPurchaseAttempts: (input: {
    walletPublicKey: string;
    status: "confirmed";
    limit: number;
  }) => Promise<Array<Pick<PurchaseAttemptRecord, "status" | "quantity" | "preparedPriceLamports" | "quotedPriceLamports">>>;
  listStakeAssetsForWallet: (walletPublicKey: string) => Promise<StakeAssetItem[]>;
  listStakeProfileEventsByWallet: (walletPublicKey: string) => Promise<StakeProfileEventRecord[]>;
  listDistributionItemsByWallet: (walletPublicKey: string) => Promise<Array<DistributionItemWithRunRecord | MinimalDistributionItemWithRun>>;
};

type MinimalDistributionItemWithRun = {
  amountMinor: bigint;
  run: {
    status: string;
    tokenMint: string;
  };
};

const defaultDependencies: InvestorOverviewDependencies = {
  getProfileBundle: getOrCreateProfileBundle,
  listPurchaseAttempts,
  listStakeAssetsForWallet,
  listStakeProfileEventsByWallet,
  listDistributionItemsByWallet
};

export async function getInvestorOverview(
  input: InvestorOverviewInput,
  dependencies: InvestorOverviewDependencies = defaultDependencies
): Promise<InvestorOverviewDTO> {
  if (input.sessionConflict) {
    return createEmptyOverview({
      walletPublicKey: null,
      accountStatus: "session_conflict",
      status: "error"
    });
  }

  if (!input.walletPublicKey) {
    return createEmptyOverview({
      walletPublicKey: null,
      accountStatus: "wallet_required",
      status: "wallet_required"
    });
  }

  const walletPublicKey = input.walletPublicKey;
  const [profile, purchases, stakeAssets, stakeEvents, distributionResult] = await Promise.all([
    dependencies.getProfileBundle(walletPublicKey),
    dependencies.listPurchaseAttempts({
      walletPublicKey,
      status: "confirmed",
      limit: 1000
    }),
    dependencies.listStakeAssetsForWallet(walletPublicKey),
    dependencies.listStakeProfileEventsByWallet(walletPublicKey),
    readOptionalDistributions(walletPublicKey, dependencies)
  ]);

  const stakeStateCounts = countStakeStates(stakeAssets);
  const degradedSources = distributionResult.ok ? [] : ["distributions"];
  const syncPending = stakeStateCounts.syncPendingCount > 0;

  return {
    walletPublicKey,
    accountStatus: "wallet_bound",
    profile: {
      kycStatus: profile.kycStatus,
      complianceStatus: profile.complianceStatus,
      profileCompletedAt: profile.updatedAt
    },
    summary: {
      historicalInvestedMinor: sumConfirmedPurchases(purchases).toString(),
      historicalInvestedCurrency: "LAMPORTS",
      currentlyOwnedFractions: stakeAssets.length,
      ...stakeStateCounts,
      preparedDistributionMinor: sumFinalizedDistributions(distributionResult.items).toString(),
      preparedDistributionCurrency: resolveDistributionCurrency(distributionResult.items)
    },
    holdingsPreview: stakeAssets.slice(0, 4).map((asset) => ({
      assetAddress: asset.assetAddress,
      propertyId: asset.propertyId,
      propertyTitle: asset.propertyTitle,
      collectionAddress: asset.collectionAddress,
      visibleState: asset.visibleState,
      imageUrl: asset.imageUrl
    })),
    recentActivity: stakeEvents.slice(0, 6).map((event) => ({
      id: event.id,
      type: event.productAction,
      propertyTitle: event.propertyTitle,
      txSignature: event.txSignature,
      validationStatus: event.validationStatus,
      occurredAt: event.blockTime ?? event.observedAt
    })),
    dataQuality: {
      status: resolveDataStatus({
        degradedSources,
        hasHoldings: stakeAssets.length > 0,
        syncPending
      }),
      degradedSources,
      refreshedAt: new Date().toISOString()
    }
  };
}

async function readOptionalDistributions(
  walletPublicKey: string,
  dependencies: Pick<InvestorOverviewDependencies, "listDistributionItemsByWallet">
): Promise<{ ok: true; items: Array<DistributionItemWithRunRecord | MinimalDistributionItemWithRun> } | { ok: false; items: [] }> {
  try {
    return {
      ok: true,
      items: await dependencies.listDistributionItemsByWallet(walletPublicKey)
    };
  } catch {
    return {
      ok: false,
      items: []
    };
  }
}

function createEmptyOverview(input: {
  walletPublicKey: string | null;
  accountStatus: InvestorOverviewAccountStatus;
  status: InvestorOverviewDataStatus;
}): InvestorOverviewDTO {
  return {
    walletPublicKey: input.walletPublicKey,
    accountStatus: input.accountStatus,
    profile: {
      kycStatus: null,
      complianceStatus: null,
      profileCompletedAt: null
    },
    summary: {
      historicalInvestedMinor: "0",
      historicalInvestedCurrency: "LAMPORTS",
      currentlyOwnedFractions: 0,
      readyToStakeCount: 0,
      readyToUnstakeCount: 0,
      syncPendingCount: 0,
      unsupportedCount: 0,
      preparedDistributionMinor: "0",
      preparedDistributionCurrency: null
    },
    holdingsPreview: [],
    recentActivity: [],
    dataQuality: {
      status: input.status,
      degradedSources: [],
      refreshedAt: new Date().toISOString()
    }
  };
}

function countStakeStates(stakeAssets: StakeAssetItem[]): Pick<
  InvestorOverviewDTO["summary"],
  "readyToStakeCount" | "readyToUnstakeCount" | "syncPendingCount" | "unsupportedCount"
> {
  return stakeAssets.reduce(
    (counts, asset) => ({
      readyToStakeCount: counts.readyToStakeCount + (asset.visibleState === "ready_to_stake" ? 1 : 0),
      readyToUnstakeCount: counts.readyToUnstakeCount + (asset.visibleState === "ready_to_unstake" ? 1 : 0),
      syncPendingCount: counts.syncPendingCount + (asset.visibleState === "sync_pending" ? 1 : 0),
      unsupportedCount: counts.unsupportedCount + (asset.visibleState === "disabled_unsupported" ? 1 : 0)
    }),
    {
      readyToStakeCount: 0,
      readyToUnstakeCount: 0,
      syncPendingCount: 0,
      unsupportedCount: 0
    }
  );
}

function sumConfirmedPurchases(
  purchases: Array<Pick<PurchaseAttemptRecord, "status" | "quantity" | "preparedPriceLamports" | "quotedPriceLamports">>
): bigint {
  return purchases
    .filter((purchase) => purchase.status === "confirmed")
    .reduce((total, purchase) => {
      const unitPrice = normalizeMinorUnit(purchase.preparedPriceLamports ?? purchase.quotedPriceLamports ?? 0);
      const quantity = Number.isInteger(purchase.quantity) && purchase.quantity > 0 ? BigInt(purchase.quantity) : 1n;
      return total + (unitPrice * quantity);
    }, 0n);
}

function sumFinalizedDistributions(items: Array<DistributionItemWithRunRecord | MinimalDistributionItemWithRun>): bigint {
  return items
    .filter((item) => item.run.status === "finalized")
    .reduce((total, item) => total + item.amountMinor, 0n);
}

function resolveDistributionCurrency(items: Array<DistributionItemWithRunRecord | MinimalDistributionItemWithRun>): string | null {
  return items.find((item) => item.run.status === "finalized")?.run.tokenMint ?? null;
}

function normalizeMinorUnit(value: number): bigint {
  if (!Number.isFinite(value) || value <= 0) {
    return 0n;
  }

  return BigInt(Math.floor(value));
}

function resolveDataStatus(input: {
  degradedSources: string[];
  hasHoldings: boolean;
  syncPending: boolean;
}): InvestorOverviewDataStatus {
  if (input.degradedSources.length > 0) {
    return "partial";
  }

  if (input.syncPending) {
    return "sync_pending";
  }

  return input.hasHoldings ? "ready" : "empty";
}
