import { beforeEach, describe, expect, it, vi } from "vitest";

let marketplaceRecords: Array<{
  id: string;
  title: string;
  city: string;
  country: string;
  locationLabel: string;
  listingStatus: "active" | "funding" | "sold-out";
  geoLat?: number | null;
  geoLng?: number | null;
  investment: { supplyTotal: number; mintedOrSold: number };
}> = [];

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
  listPropertyDetailsSnapshot: vi.fn(() => marketplaceRecords),
  PropertyRpcError: class PropertyRpcError extends Error {}
}));

import { listMarketplaceMapEntries } from "@/lib/property-marketplace-server";

describe("lib/property-marketplace-server map entries", () => {
  beforeEach(() => {
    marketplaceRecords = [];
  });

  it("projects only US properties with coordinates into map entries", async () => {
    marketplaceRecords = [
      {
        id: "us-1",
        title: "Boston Harbor House",
        city: "Boston",
        country: "US",
        locationLabel: "Boston, MA, US",
        listingStatus: "active",
        geoLat: 42.3601,
        geoLng: -71.0589,
        investment: { supplyTotal: 2000, mintedOrSold: 500 }
      },
      {
        id: "mx-1",
        title: "CDMX Tower",
        city: "CDMX",
        country: "MX",
        locationLabel: "CDMX, MX",
        listingStatus: "funding",
        geoLat: 19.4326,
        geoLng: -99.1332,
        investment: { supplyTotal: 1000, mintedOrSold: 250 }
      }
    ] as never;

    const entries = await listMarketplaceMapEntries({});

    expect(entries).toEqual([
      {
        id: "us-1",
        title: "Boston Harbor House",
        locationLabel: "Boston, MA, US",
        country: "US",
        geoLat: 42.3601,
        geoLng: -71.0589,
        supplyTotal: 2000,
        mintedOrSold: 500
      }
    ]);
  });
});
