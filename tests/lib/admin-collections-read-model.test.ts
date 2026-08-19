import { beforeEach, describe, expect, it, vi } from "vitest";

type MarketplaceEntryRow = {
  id: string;
  title: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  updated_at: string;
};

type AssetMintSnapshotRow = {
  id: string;
  collection_address: string;
  candy_machine_address: string;
};

let marketplaceEntries: MarketplaceEntryRow[] = [];
let assetMintSnapshots: AssetMintSnapshotRow[] = [];

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("FROM marketplace_entries")) {
    return { rows: marketplaceEntries, rowCount: marketplaceEntries.length };
  }

  if (sql.includes("FROM asset_mint_snapshots")) {
    return { rows: assetMintSnapshots, rowCount: assetMintSnapshots.length };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock("@/features/shared/infrastructure/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import { listAdminCollectionReadModels } from "@/lib/admin/collections-read-model";

function buildMarketplaceEntryRow(input: Partial<MarketplaceEntryRow> = {}): MarketplaceEntryRow {
  return {
    id: "entry-1",
    title: "Central Tower",
    image_url: "https://cdn.example.com/cover.jpg",
    collection_address: "Collection111111111111111111111111111111111",
    asset_mint_address: "Candy1111111111111111111111111111111111111",
    updated_at: "2026-04-23T06:00:00.000Z",
    ...input
  };
}

function buildAssetMintSnapshotRow(input: Partial<AssetMintSnapshotRow> = {}): AssetMintSnapshotRow {
  return {
    id: "snapshot-1",
    collection_address: "Collection111111111111111111111111111111111",
    candy_machine_address: "Candy1111111111111111111111111111111111111",
    ...input
  };
}

describe("lib/admin/collections-read-model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    marketplaceEntries = [];
    assetMintSnapshots = [];
  });

  it("returns an empty list when actor pubkey is missing", async () => {
    const result = await listAdminCollectionReadModels("   ");

    expect(result).toEqual([]);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("classifies an exact collection and candy machine match as linked", async () => {
    marketplaceEntries = [buildMarketplaceEntryRow()];
    assetMintSnapshots = [buildAssetMintSnapshotRow()];

    const result = await listAdminCollectionReadModels("AdminPubkey111");

    expect(result).toEqual([
      {
        entryId: "entry-1",
        title: "Central Tower",
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        collectionAddress: "Collection111111111111111111111111111111111",
        candyMachineAddress: "Candy1111111111111111111111111111111111111",
        updatedAt: "2026-04-23T06:00:00.000Z",
        validationState: "linked",
        editableSections: ["summary", "propertyInformation", "gallery", "documents"]
      }
    ]);
  });

  it("classifies entries with no owned snapshot match as missing_snapshot", async () => {
    marketplaceEntries = [buildMarketplaceEntryRow()];
    assetMintSnapshots = [];

    const result = await listAdminCollectionReadModels("AdminPubkey111");

    expect(result[0]?.validationState).toBe("missing_snapshot");
    expect(result[0]?.editableSections).toEqual([]);
  });

  it("classifies entries with collection-only match as inconsistent", async () => {
    marketplaceEntries = [buildMarketplaceEntryRow()];
    assetMintSnapshots = [
      buildAssetMintSnapshotRow({
        candy_machine_address: "DifferentCandy1111111111111111111111111111111"
      })
    ];

    const result = await listAdminCollectionReadModels("AdminPubkey111");

    expect(result[0]?.validationState).toBe("inconsistent");
    expect(result[0]?.editableSections).toEqual([]);
  });

  it("classifies entries with candy-machine-only match as inconsistent", async () => {
    marketplaceEntries = [buildMarketplaceEntryRow()];
    assetMintSnapshots = [
      buildAssetMintSnapshotRow({
        collection_address: "DifferentCollection11111111111111111111111111"
      })
    ];

    const result = await listAdminCollectionReadModels("AdminPubkey111");

    expect(result[0]?.validationState).toBe("inconsistent");
  });

  it("prefers linked when an exact match exists alongside partial matches", async () => {
    marketplaceEntries = [buildMarketplaceEntryRow()];
    assetMintSnapshots = [
      buildAssetMintSnapshotRow({
        id: "snapshot-partial",
        candy_machine_address: "DifferentCandy1111111111111111111111111111111"
      }),
      buildAssetMintSnapshotRow({
        id: "snapshot-exact"
      })
    ];

    const result = await listAdminCollectionReadModels("AdminPubkey111");

    expect(result[0]?.validationState).toBe("linked");
  });
});
