import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  query: vi.fn(),
  withDbClient: vi.fn(async (work: (client: { query: typeof dbMocks.query }) => Promise<unknown>) => work({ query: dbMocks.query }))
}));

vi.mock("@/lib/db/pool", () => ({
  withDbClient: dbMocks.withDbClient
}));

import {
  createRpcErrorMarketplacePropertySyncStatus,
  createUnavailableMarketplacePropertySyncStatus,
  persistMarketplacePropertySyncStatus,
  toMarketplaceSyncIsoOrNull
} from "@/lib/marketplace/property-sync-status";
import type { PropertyDetail } from "@/lib/property-service";

function createProperty(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: "property-1",
    title: "Boston Harbor House",
    city: "Boston",
    country: "US",
    postalCode: null,
    locationLabel: "Boston, MA, US",
    geoLat: 42.3601,
    geoLng: -71.0589,
    googleMapsPlace: null,
    listingStatus: "funding",
    image: "https://cdn.example.com/boston.jpg",
    shortDescription: "Harbor listing",
    detailedLocation: "Boston Harbor",
    highlights: [],
    investmentNotes: "Notes",
    investment: {
      supplyTotal: 2000,
      mintedOrSold: 500,
      nftPriceUsd: 120,
      annualRoiPct: 21.8,
      availabilityLabel: "Funding"
    },
    project: {
      stage: "",
      developerName: "",
      exitStrategy: "",
      durationMonths: null
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
      projectedNetRoiPct: null
    },
    governance: { riskNotes: "Risk notes" },
    documents: [],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
      assetMintAddress: "CanDyMach1ne1111111111111111111111111111111",
      explorerUrl: "https://explorer.solana.com/address/test?cluster=devnet",
      lastOnchainUpdate: "2026-05-01T00:00:00.000Z",
      syncStatus: "unavailable"
    },
    ...overrides
  };
}

describe("marketplace property sync status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DATABASE_URL;
    dbMocks.query.mockResolvedValue({ rows: [], rowCount: 1 });
  });

  it("normalizes valid timestamps and rejects invalid sync timestamps", () => {
    expect(toMarketplaceSyncIsoOrNull("2026-05-01")).toBe("2026-05-01T00:00:00.000Z");
    expect(toMarketplaceSyncIsoOrNull("not-a-date")).toBeNull();
    expect(toMarketplaceSyncIsoOrNull(null)).toBeNull();
  });

  it("creates unavailable status with normalized previous timestamp", () => {
    expect(createUnavailableMarketplacePropertySyncStatus(createProperty())).toEqual({
      syncStatus: "unavailable",
      lastOnchainUpdate: "2026-05-01T00:00:00.000Z"
    });
  });

  it("creates rpc_error status with normalized previous timestamp", () => {
    expect(createRpcErrorMarketplacePropertySyncStatus(createProperty())).toEqual({
      syncStatus: "rpc_error",
      lastOnchainUpdate: "2026-05-01T00:00:00.000Z"
    });
  });

  it("persists sync status only when database is configured and never throws on persistence failure", async () => {
    await persistMarketplacePropertySyncStatus({
      id: "property-1",
      syncStatus: "available",
      lastOnchainUpdate: "2026-05-30T00:00:00.000Z"
    });

    expect(dbMocks.withDbClient).not.toHaveBeenCalled();

    process.env.DATABASE_URL = "postgres://example";
    dbMocks.query.mockRejectedValueOnce(new Error("update failed"));

    await expect(
      persistMarketplacePropertySyncStatus({
        id: "property-1",
        syncStatus: "rpc_error",
        lastOnchainUpdate: null
      })
    ).resolves.toBeUndefined();
    expect(dbMocks.withDbClient).toHaveBeenCalledTimes(1);
  });
});
