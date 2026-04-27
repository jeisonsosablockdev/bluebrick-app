import { beforeEach, describe, expect, it, vi } from "vitest";

type AssetMintSnapshotBlockchainRow = {
  blockchain_snapshot: unknown;
};

type AuthorityRegistryRow = {
  role: "transfer_delegate" | "appdata_authority";
  authority_pubkey: string;
};

let snapshotRow: AssetMintSnapshotBlockchainRow | null = null;
let authorityRows: AuthorityRegistryRow[] = [];

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("FROM asset_mint_snapshots")) {
    return {
      rows: snapshotRow ? [snapshotRow] : [],
      rowCount: snapshotRow ? 1 : 0
    };
  }

  if (sql.includes("FROM authority_registry")) {
    return {
      rows: authorityRows,
      rowCount: authorityRows.length
    };
  }

  return { rows: [], rowCount: 0 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

vi.mock("@/lib/purchase-third-party-signer", () => ({
  getPurchaseThirdPartySignerAddress: () => "ThirdPartyFallback111"
}));

vi.mock("@/lib/candy-guard-payment-config", () => ({
  resolveUsdcMintAddress: () => "UsdcMintFallback111",
  resolveUsdcPaymentRecipient: () => "UsdcRecipientFallback111",
  deriveAssociatedTokenAddress: () => "UsdcDestinationFallback111"
}));

import { getAdminCollectionBlockchainPanel } from "@/lib/admin/collection-blockchain-panel";

function buildOwnershipRecord() {
  return {
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
  };
}

describe("lib/admin/collection-blockchain-panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    process.env.SQUADS_FREEZE_AUTHORITY = "FreezeEnv111";
    snapshotRow = null;
    authorityRows = [];
  });

  it("aggregates base addresses plus visible authorities from snapshot, env, and registry", async () => {
    snapshotRow = {
      blockchain_snapshot: {
        assetMintAddress: "AssetMint111",
        third_party_signer: "ThirdParty111",
        appDataEconomic: {
          revenue_share_bps: 2500,
          yield_bps: 1300,
          yield_mode: "linear",
          locked_at: 1775031177,
          eligible_from: 1775031177,
          earning_start_ts: 1775031177,
          distribution_enabled: false,
          economic_version: "v1",
          last_updated_at: 1775031297,
          updated_by: "story-006-03-admin-update"
        }
      }
    };
    authorityRows = [
      { role: "transfer_delegate", authority_pubkey: "TransferDelegate111" },
      { role: "appdata_authority", authority_pubkey: "AppdataAuthority111" }
    ];

    const result = await getAdminCollectionBlockchainPanel(buildOwnershipRecord());

    expect(result).toEqual({
      baseAddresses: {
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        assetMintAddress: "AssetMint111"
      },
      authorities: {
        thirdPartySigner: "ThirdParty111",
        freezeDelegate: "FreezeEnv111",
        transferDelegate: "TransferDelegate111",
        appdataAuthority: "AppdataAuthority111"
      },
      guards: {
        startDateIso: null,
        tokenPaymentMint: "UsdcMintFallback111",
        tokenPaymentDestination: "UsdcDestinationFallback111"
      },
      appdata: {
        revenueShareBps: 2500,
        yieldBps: 1300,
        yieldMode: "linear",
        lockedAt: 1775031177,
        eligibleFrom: 1775031177,
        earningStartTs: 1775031177,
        distributionEnabled: false,
        economicVersion: "v1",
        lastUpdatedAt: 1775031297,
        updatedBy: "story-006-03-admin-update"
      }
    });
    expect(String(queryMock.mock.calls[0]?.[0])).toContain("FROM asset_mint_snapshots");
    expect(String(queryMock.mock.calls[1]?.[0])).toContain("FROM authority_registry");
  });

  it("degrades safely when optional authority data is missing", async () => {
    snapshotRow = {
      blockchain_snapshot: {
        collectionAddressOnchain: "Collection111",
        guardStartDateIso: "2026-04-27T00:00:00.000Z"
      }
    };

    const result = await getAdminCollectionBlockchainPanel(buildOwnershipRecord());

    expect(result).toEqual({
      baseAddresses: {
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        assetMintAddress: null
      },
      authorities: {
        thirdPartySigner: "ThirdPartyFallback111",
        freezeDelegate: "FreezeEnv111",
        transferDelegate: null,
        appdataAuthority: null
      },
      guards: {
        startDateIso: "2026-04-27T00:00:00.000Z",
        tokenPaymentMint: "UsdcMintFallback111",
        tokenPaymentDestination: "UsdcDestinationFallback111"
      },
      appdata: {
        revenueShareBps: null,
        yieldBps: null,
        yieldMode: null,
        lockedAt: null,
        eligibleFrom: null,
        earningStartTs: null,
        distributionEnabled: null,
        economicVersion: null,
        lastUpdatedAt: null,
        updatedBy: null
      }
    });
  });

  it("ignores invalid appdata payloads and returns null appdata fields", async () => {
    snapshotRow = {
      blockchain_snapshot: {
        appDataEconomic: {
          revenue_share_bps: 2500,
          yield_bps: 1300,
          yield_mode: "invalid-mode",
          distribution_enabled: false,
          economic_version: "v1",
          last_updated_at: 1775031297,
          updated_by: "story-006-03-admin-update"
        }
      }
    };

    const result = await getAdminCollectionBlockchainPanel(buildOwnershipRecord());

    expect(result.appdata).toEqual({
      revenueShareBps: null,
      yieldBps: null,
      yieldMode: null,
      lockedAt: null,
      eligibleFrom: null,
      earningStartTs: null,
      distributionEnabled: null,
      economicVersion: null,
      lastUpdatedAt: null,
      updatedBy: null
    });
  });
});
