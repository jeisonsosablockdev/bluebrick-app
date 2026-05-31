import { describe, expect, it } from "vitest";

import {
  filterMarketplacePropertyDetails,
  listMarketplacePropertyCitiesFromRecords,
  mapMarketplaceMapEntries,
  mapMarketplacePropertyListItems
} from "@/lib/marketplace/property-selectors";
import type { PropertyDetail } from "@/lib/property-service";

function createProperty(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: "property-1",
    title: "Boston Harbor House",
    city: "Boston",
    country: "US",
    postalCode: "02110",
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
      stage: "rehab",
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
      minimumCapitalRequiredUsd: 90000,
      structuringFeeUsd: null,
      grossProfitProjectedUsd: null,
      managementFeeUsd: null,
      brokerFeeUsd: null,
      netInvestorProfitUsd: null,
      projectedNetRoiPct: null
    },
    governance: {
      riskNotes: "Risk notes"
    },
    documents: [],
    blockchain: {
      network: "Solana Devnet",
      collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
      assetMintAddress: "CanDyMach1ne1111111111111111111111111111111",
      explorerUrl: "https://explorer.solana.com/address/test?cluster=devnet",
      lastOnchainUpdate: null,
      syncStatus: "available"
    },
    ...overrides
  };
}

describe("marketplace property selectors", () => {
  it("filters records by search, city, status, and minimum ROI", () => {
    const records = [
      createProperty(),
      createProperty({
        id: "property-2",
        title: "Austin Warehouse",
        city: "Austin",
        locationLabel: "Austin, TX, US",
        listingStatus: "active",
        investment: {
          ...createProperty().investment,
          annualRoiPct: 9.5
        }
      })
    ];

    const filtered = filterMarketplacePropertyDetails(records, {
      search: "harbor",
      city: "Boston",
      status: "funding",
      minRoi: 20
    });

    expect(filtered.map((property) => property.id)).toEqual(["property-1"]);
  });

  it("projects list items, map entries, and sorted cities without database dependencies", () => {
    const records = [
      createProperty({ city: "Boston" }),
      createProperty({
        id: "property-2",
        title: "Bogota Tower",
        city: "Bogota",
        country: "CO",
        locationLabel: "Bogota, CO",
        geoLat: 4.711,
        geoLng: -74.0721
      }),
      createProperty({
        id: "property-3",
        title: "Miami Missing Coordinates",
        city: "Miami",
        locationLabel: "Miami, FL, US",
        geoLat: null,
        geoLng: -80.1918
      })
    ];

    expect(mapMarketplacePropertyListItems(records)[0]).toEqual(
      expect.objectContaining({
        id: "property-1",
        minimumCapitalRequiredUsd: 90000,
        projectDurationMonths: 12
      })
    );
    expect(mapMarketplaceMapEntries(records)).toEqual([
      {
        id: "property-1",
        title: "Boston Harbor House",
        locationLabel: "Boston, MA, US",
        country: "US",
        geoLat: 42.3601,
        geoLng: -71.0589,
        supplyTotal: 2000,
        mintedOrSold: 500
      }
    ]);
    expect(listMarketplacePropertyCitiesFromRecords(records)).toEqual(["Bogota", "Boston", "Miami"]);
  });
});
