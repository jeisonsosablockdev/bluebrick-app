import { beforeEach, describe, expect, it, vi } from "vitest";

type MarketplaceEntryOwnershipRow = {
  id: string;
  title: string;
  created_by: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  updated_at: string;
};

type AssetMintSnapshotOwnershipRow = {
  id: string;
  draft_id: string;
  verification_status: string;
  marketplace_handoff_status: string;
};

let marketplaceEntry: MarketplaceEntryOwnershipRow | null = null;
let assetMintSnapshot: AssetMintSnapshotOwnershipRow | null = null;

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("FROM marketplace_entries")) {
    return {
      rows: marketplaceEntry ? [marketplaceEntry] : [],
      rowCount: marketplaceEntry ? 1 : 0
    };
  }

  if (sql.includes("FROM asset_mint_snapshots")) {
    return {
      rows: assetMintSnapshot ? [assetMintSnapshot] : [],
      rowCount: assetMintSnapshot ? 1 : 0
    };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import {
  AdminCollectionOwnershipError,
  assertAdminCollectionOwnership,
  isAdminCollectionOwnershipError
} from "@/lib/admin/collection-ownership";

function buildMarketplaceEntry(input: Partial<MarketplaceEntryOwnershipRow> = {}): MarketplaceEntryOwnershipRow {
  return {
    id: "entry-1",
    title: "Central Tower",
    created_by: "Admin111",
    image_url: "https://cdn.example.com/cover.jpg",
    collection_address: "Collection111",
    asset_mint_address: "Candy111",
    updated_at: "2026-04-24T12:00:00.000Z",
    ...input
  };
}

function buildAssetMintSnapshot(input: Partial<AssetMintSnapshotOwnershipRow> = {}): AssetMintSnapshotOwnershipRow {
  return {
    id: "snapshot-1",
    draft_id: "draft-1",
    verification_status: "verified",
    marketplace_handoff_status: "ready",
    ...input
  };
}

async function expectOwnershipError(
  action: () => Promise<unknown>,
  input: { code: string; status: number }
): Promise<void> {
  try {
    await action();
    throw new Error("Expected ownership assertion to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(AdminCollectionOwnershipError);
    expect(isAdminCollectionOwnershipError(error)).toBe(true);
    expect((error as AdminCollectionOwnershipError).code).toBe(input.code);
    expect((error as AdminCollectionOwnershipError).status).toBe(input.status);
  }
}

describe("lib/admin/collection-ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    marketplaceEntry = null;
    assetMintSnapshot = null;
  });

  it("returns ownership evidence for an exact entry and snapshot match", async () => {
    marketplaceEntry = buildMarketplaceEntry();
    assetMintSnapshot = buildAssetMintSnapshot();

    const result = await assertAdminCollectionOwnership(" Admin111 ", " entry-1 ");

    expect(result).toEqual({
      entryId: "entry-1",
      adminId: "Admin111",
      title: "Central Tower",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      snapshotId: "snapshot-1",
      snapshotDraftId: "draft-1",
      snapshotVerificationStatus: "verified",
      snapshotMarketplaceHandoffStatus: "ready",
      updatedAt: "2026-04-24T12:00:00.000Z"
    });

    expect(String(queryMock.mock.calls[1]?.[0])).toContain("created_by = $1");
    expect(String(queryMock.mock.calls[1]?.[0])).toContain("collection_address = $2");
    expect(String(queryMock.mock.calls[1]?.[0])).toContain("candy_machine_address = $3");
  });

  it("fails with not found when the marketplace entry does not exist", async () => {
    await expectOwnershipError(
      () => assertAdminCollectionOwnership("Admin111", "missing-entry"),
      { code: "COLLECTION_NOT_FOUND", status: 404 }
    );
  });

  it("fails with ownership mismatch when the entry belongs to another admin", async () => {
    marketplaceEntry = buildMarketplaceEntry({ created_by: "OtherAdmin111" });

    await expectOwnershipError(
      () => assertAdminCollectionOwnership("Admin111", "entry-1"),
      { code: "COLLECTION_OWNERSHIP_MISMATCH", status: 403 }
    );

    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("fails with ownership mismatch when exact snapshot evidence is missing", async () => {
    marketplaceEntry = buildMarketplaceEntry();
    assetMintSnapshot = null;

    await expectOwnershipError(
      () => assertAdminCollectionOwnership("Admin111", "entry-1"),
      { code: "COLLECTION_OWNERSHIP_MISMATCH", status: 403 }
    );
  });

  it("rejects blank input before querying", async () => {
    await expectOwnershipError(
      () => assertAdminCollectionOwnership("   ", "entry-1"),
      { code: "INVALID_COLLECTION_OWNERSHIP_INPUT", status: 400 }
    );

    expect(queryMock).not.toHaveBeenCalled();
  });
});
