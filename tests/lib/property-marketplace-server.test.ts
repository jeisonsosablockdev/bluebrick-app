import { beforeEach, describe, expect, it, vi } from "vitest";

let locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng", "google_maps_place_json"];
let persistedRows: unknown[] = [];
let failMarketplaceSelect = false;

const propertyServiceMocks = vi.hoisted(() => ({
  listPropertyDetailsSnapshot: vi.fn((): unknown[] => [])
}));

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("information_schema.columns")) {
    return {
      rows: locationColumnNames.map((column_name) => ({ column_name })),
      rowCount: locationColumnNames.length
    };
  }

  if (sql.includes("FROM marketplace_entries")) {
    if (failMarketplaceSelect) {
      throw new Error("persisted marketplace read failed");
    }

    return { rows: persistedRows, rowCount: persistedRows.length };
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
  listPropertyDetailsSnapshot: propertyServiceMocks.listPropertyDetailsSnapshot,
  PropertyRpcError: class PropertyRpcError extends Error {},
  filterPropertyDetails: vi.fn((records) => records),
  mapListItems: vi.fn((records) => records)
}));

import { resetMarketplaceEntryLocationColumnSupportCache } from "@/lib/admin/marketplace-entry-location-columns";
import {
  createMarketplacePropertyEntryPersistent,
  getMarketplacePropertyDetail,
  listMarketplaceMapEntries,
  listMarketplaceProperties,
  readMarketplaceRecordsResultForServer
} from "@/lib/property-marketplace-server";

describe("lib/property-marketplace-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    locationColumnNames = ["state_province", "postal_code", "geo_lat", "geo_lng", "google_maps_place_json"];
    persistedRows = [];
    failMarketplaceSelect = false;
    propertyServiceMocks.listPropertyDetailsSnapshot.mockReturnValue([]);
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
    expect(sql).not.toContain("google_maps_place_json");
    expect(sql).toContain("location_label");
    expect(sql).toContain("detailed_location");
  });

  it("selects persisted coordinates for marketplace map entries", async () => {
    persistedRows = [
      {
        id: "brandon-117",
        title: "Fix & Flip Brandon 117",
        city: "Brandon",
        country: "US",
        postal_code: "33511",
        location_label: "Brandon, Florida, 33511, US",
        geo_lat: 27.9379,
        geo_lng: -82.2859,
        listing_status: "funding",
        image_url: "https://cdn.example.com/brandon.jpg",
        short_description: "US listing",
        detailed_location: "Brandon, Florida",
        highlights_json: [],
        investment_notes: "Marketplace map listing",
        supply_total: 2000,
        minted_or_sold: 500,
        nft_price_usd: 120,
        annual_roi_pct: 21.8,
        availability_label: "Funding",
        project_json: {},
        economics_json: {},
        governance_json: {},
        documents_json: [],
        collection_address: "CoLLeCt1on111111111111111111111111111111111",
        asset_mint_address: "CanDyMach1ne1111111111111111111111111111111",
        explorer_url: "https://explorer.solana.com/address/test?cluster=devnet",
        last_onchain_update: null,
        sync_status: "available"
      }
    ];

    const entries = await listMarketplaceMapEntries({});
    const selectSql = String(queryMock.mock.calls.find((call) => String(call[0]).includes("FROM marketplace_entries"))?.[0] ?? "");

    expect(selectSql).toContain("geo_lat");
    expect(selectSql).toContain("geo_lng");
    expect(entries).toEqual([
      {
        id: "brandon-117",
        title: "Fix & Flip Brandon 117",
        locationLabel: "Brandon, Florida, 33511, US",
        country: "US",
        geoLat: 27.9379,
        geoLng: -82.2859,
        supplyTotal: 2000,
        mintedOrSold: 500
      }
    ]);
  });

  it("selects persisted Google Maps place data for marketplace detail", async () => {
    persistedRows = [
      {
        id: "brandon-117",
        title: "Fix & Flip Brandon 117",
        city: "Brandon",
        country: "US",
        postal_code: "33511",
        location_label: "Brandon, Florida, 33511, US",
        geo_lat: 27.9379,
        geo_lng: -82.2859,
        google_maps_place_json: {
          placeLabel: "117 Hickory Creek Blvd",
          formattedAddress: "117 Hickory Creek Blvd, Brandon, FL 33511, USA",
          lat: 27.9379,
          lng: -82.2859,
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=117%20Hickory%20Creek%20Blvd",
          placeId: "place-hickory",
          city: "Brandon",
          stateProvince: "FL",
          country: "US",
          postalCode: "33511"
        },
        listing_status: "funding",
        image_url: "https://cdn.example.com/brandon.jpg",
        short_description: "US listing",
        detailed_location: "117 Hickory Creek Blvd, Brandon, FL",
        highlights_json: [],
        investment_notes: "Marketplace detail listing",
        supply_total: 2000,
        minted_or_sold: 500,
        nft_price_usd: 120,
        annual_roi_pct: 21.8,
        availability_label: "Funding",
        project_json: {},
        economics_json: {},
        governance_json: {},
        documents_json: [],
        collection_address: "CoLLeCt1on111111111111111111111111111111111",
        asset_mint_address: "CanDyMach1ne1111111111111111111111111111111",
        explorer_url: "https://explorer.solana.com/address/test?cluster=devnet",
        last_onchain_update: null,
        sync_status: "available"
      }
    ];

    const detail = await getMarketplacePropertyDetail("brandon-117");
    const selectSql = String(queryMock.mock.calls.find((call) => String(call[0]).includes("FROM marketplace_entries"))?.[0] ?? "");

    expect(selectSql).toContain("google_maps_place_json");
    expect(detail?.googleMapsPlace?.placeId).toBe("place-hickory");
    expect(detail?.googleMapsPlace?.formattedAddress).toContain("Brandon");
  });

  it("represents degraded persisted reads while preserving list callers", async () => {
    failMarketplaceSelect = true;
    propertyServiceMocks.listPropertyDetailsSnapshot.mockReturnValue([
      {
        id: "snapshot-001",
        title: "Snapshot Entry",
        city: "Miami",
        country: "US",
        postalCode: null,
        locationLabel: "Miami, US",
        geoLat: null,
        geoLng: null,
        googleMapsPlace: null,
        listingStatus: "funding",
        image: "https://cdn.example.com/snapshot.jpg",
        shortDescription: "Snapshot fallback listing",
        detailedLocation: "Miami, Florida",
        highlights: [],
        investmentNotes: "Snapshot notes",
        investment: {
          supplyTotal: 100,
          mintedOrSold: 10,
          nftPriceUsd: 100,
          annualRoiPct: 10,
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
        governance: {
          riskNotes: "Snapshot notes"
        },
        documents: [],
        blockchain: {
          network: "Solana Devnet",
          collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
          assetMintAddress: "CanDyMach1ne1111111111111111111111111111111",
          explorerUrl: "https://explorer.solana.com/address/test?cluster=devnet",
          lastOnchainUpdate: null,
          syncStatus: "unavailable"
        }
      }
    ]);

    const result = await readMarketplaceRecordsResultForServer();
    const listItems = await listMarketplaceProperties({});

    expect(result).toEqual({
      status: "degraded",
      source: "snapshot",
      records: expect.arrayContaining([expect.objectContaining({ id: "snapshot-001" })]),
      errorCode: "PERSISTED_MARKETPLACE_READ_FAILED"
    });
    expect(listItems).toEqual([expect.objectContaining({ id: "snapshot-001" })]);
  });
});
