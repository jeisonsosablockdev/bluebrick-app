import { beforeEach, describe, expect, it, vi } from "vitest";

let locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng"];

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("information_schema.columns")) {
    return {
      rows: locationColumnNames.map((column_name) => ({ column_name })),
      rowCount: locationColumnNames.length
    };
  }

  return { rows: [], rowCount: 1 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

vi.mock("@/lib/property-service", () => ({
  createEmptyPropertyEconomics: vi.fn(() => ({
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
  })),
  listPropertyDetailsSnapshot: vi.fn(() => []),
  PropertyRpcError: class PropertyRpcError extends Error {},
  filterPropertyDetails: vi.fn((records) => records),
  mapListItems: vi.fn((records) => records)
}));

import { resetMarketplaceEntryLocationColumnSupportCache } from "@/lib/admin/marketplace-entry-location-columns";
import { createMarketplacePropertyEntryPersistent } from "@/lib/property-marketplace-server";

describe("lib/property-marketplace-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng"];
    resetMarketplaceEntryLocationColumnSupportCache();
  });

  it("omits canonical location columns from INSERT when the database schema is behind", async () => {
    locationColumnNames = [];

    await createMarketplacePropertyEntryPersistent({
      id: "asset-001",
      title: "Central Tower",
      city: "Bogota",
      country: "CO",
      stateProvince: "Bogotá D.C.",
      postalCode: "110221",
      listingStatus: "funding",
      image: "https://cdn.example.com/cover.jpg",
      shortDescription: "Tokenized building",
      detailedLocation: "Calle 10 #12-34",
      geoLat: 4.711,
      geoLng: -74.072,
      highlights: ["Project stage: construction"],
      investmentNotes: "Ready for marketplace listing",
      supplyTotal: 1200,
      mintedOrSold: 0,
      nftPriceUsd: 150,
      annualRoiPct: 12.5,
      availabilityLabel: "Funding",
      project: {
        stage: "rehab",
        developerName: "Blue Brick Capital LLC",
        exitStrategy: "sale",
        durationMonths: 10
      },
      economics: {
        purchasePriceUsd: 120000,
        afterRepairValueUsd: 210000,
        rehabBudgetUsd: 45000,
        closingCostsUsd: 5000,
        holdingCostsUsd: 3500,
        sellingCostsUsd: 8000,
        totalProjectCostUsd: 181500,
        minimumCapitalRequiredUsd: 90000,
        structuringFeeUsd: 3500,
        grossProfitProjectedUsd: 28500,
        managementFeeUsd: 2500,
        brokerFeeUsd: 4000,
        netInvestorProfitUsd: 22000,
        projectedNetRoiPct: 12.5
      },
      governance: {
        riskNotes: "Escrow account with milestone-based draws."
      },
      documents: [{ label: "Brochure", url: "https://cdn.example.com/brochure.pdf" }],
      collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
      assetMintAddress: "CanDyMach1ne1111111111111111111111111111111",
      explorerUrl: "https://explorer.solana.com/address/test?cluster=devnet",
      lastOnchainUpdate: null,
      syncStatus: "available",
      createdBy: "AdminPubkey111111111111111111111111111111111111"
    });

    const sql = String(queryMock.mock.calls[1]?.[0] ?? "");
    expect(sql).not.toContain("state_province");
    expect(sql).not.toContain("postal_code");
    expect(sql).not.toContain("geo_lat");
    expect(sql).not.toContain("geo_lng");
    expect(sql).toContain("location_label");
    expect(sql).toContain("detailed_location");
  });
});
