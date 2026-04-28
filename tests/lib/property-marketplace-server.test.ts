import { beforeEach, describe, expect, it, vi } from "vitest";

let locationColumnNames = ["state_province", "geo_lat", "geo_lng"];

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
    locationColumnNames = ["state_province", "geo_lat", "geo_lng"];
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
    expect(sql).not.toContain("geo_lat");
    expect(sql).not.toContain("geo_lng");
    expect(sql).toContain("location_label");
    expect(sql).toContain("detailed_location");
  });
});
