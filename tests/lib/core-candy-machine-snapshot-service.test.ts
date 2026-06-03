import { beforeEach, describe, expect, it, vi } from "vitest";

const VALID_ACTOR = "11111111111111111111111111111111";
const VALID_CANDY_MACHINE = "22222222222222222222222222222222";
const VALID_COLLECTION = "33333333333333333333333333333333";

const mocks = vi.hoisted(() => ({
  fetchCandyMachine: vi.fn(),
  findCandyGuardPda: vi.fn(),
  safeFetchCandyGuard: vi.fn(),
  getAssetsByCollection: vi.fn(),
  createKitRpcConnection: vi.fn(),
  getSignatureStatusWithKitRpc: vi.fn(),
  upsertMintJobFromSnapshot: vi.fn(),
  upsertAssetMintSnapshot: vi.fn()
}));

vi.mock("@metaplex-foundation/umi-bundle-defaults", () => ({
  createUmi: () => ({
    use() {
      return this;
    }
  })
}));

vi.mock("@metaplex-foundation/mpl-core", () => ({
  mplCore: () => ({})
}));

vi.mock("@metaplex-foundation/mpl-core-candy-machine", () => ({
  fetchCandyMachine: mocks.fetchCandyMachine,
  findCandyGuardPda: mocks.findCandyGuardPda,
  mplCandyMachine: () => ({}),
  safeFetchCandyGuard: mocks.safeFetchCandyGuard
}));

vi.mock("@metaplex-foundation/umi", () => ({
  publicKey: (value: string) => value
}));

vi.mock("@/lib/das-client", () => ({
  DasClient: vi.fn(function DasClient() {
    return {
      getAssetsByCollection: mocks.getAssetsByCollection
    };
  }),
  isDasClientError: () => false
}));

vi.mock("@/lib/solana", () => ({
  getSolanaRpcUrl: () => "https://api.devnet.solana.com"
}));

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  createKitRpcConnection: mocks.createKitRpcConnection,
  getSignatureStatusWithKitRpc: mocks.getSignatureStatusWithKitRpc,
  normalizeLegacyPublicKey: (value: string) => value
}));

vi.mock("@/lib/core-candy-machine-snapshot-repository", () => ({
  upsertMintJobFromSnapshot: mocks.upsertMintJobFromSnapshot,
  upsertAssetMintSnapshot: mocks.upsertAssetMintSnapshot
}));

import { finalizeCoreCandyMachineSnapshot } from "@/lib/core-candy-machine-snapshot-service";

function buildFinalizePayload(overrides?: {
  quantity?: number;
  signatures?: Array<{
    kind: "create-collection" | "create-candy-machine" | "add-config-lines" | "mint";
    label: string;
    signature: string;
    expectedAddress: string | null;
  }>;
}) {
  return {
    draftId: "draft-1",
    formSnapshot: {
      title: "Test property"
    },
    mint: {
      quantity: overrides?.quantity ?? 3,
      status: "Deploy complete.",
      collectionName: "Test Collection",
      collectionUri: "https://example.com/collection.json",
      assetNamePrefix: "BRIDS Test",
      assetUri: "https://example.com/asset.json",
      startDate: "2026-06-03T00:00:00.000Z",
      candyMachineAddress: VALID_CANDY_MACHINE,
      collectionAddress: VALID_COLLECTION,
      signatures: overrides?.signatures ?? [
        {
          kind: "create-collection",
          label: "Create collection",
          signature: "sig-create-collection",
          expectedAddress: VALID_COLLECTION
        },
        {
          kind: "create-candy-machine",
          label: "Create candy machine",
          signature: "sig-create-cm",
          expectedAddress: VALID_CANDY_MACHINE
        },
        {
          kind: "add-config-lines",
          label: "Load config lines",
          signature: "sig-config-lines",
          expectedAddress: VALID_CANDY_MACHINE
        }
      ]
    }
  };
}

function mockCandyMachineState(itemsLoaded: number, itemsAvailable = 3) {
  mocks.fetchCandyMachine.mockResolvedValue({
    collectionMint: VALID_COLLECTION,
    authority: VALID_ACTOR,
    mintAuthority: VALID_ACTOR,
    itemsLoaded,
    itemsRedeemed: 0,
    data: {
      itemsAvailable,
      configLineSettings: {
        __option: "Some",
        value: {
          type: "configLines"
        }
      }
    }
  });
}

describe("lib/core-candy-machine-snapshot-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCandyGuardPda.mockReturnValue(["Guard111111111111111111111111111111111"]);
    mocks.safeFetchCandyGuard.mockResolvedValue({
      publicKey: "Guard111111111111111111111111111111111",
      guards: {}
    });
    mocks.createKitRpcConnection.mockReturnValue({ rpc: true });
    mocks.getAssetsByCollection.mockResolvedValue({
      items: []
    });
    mocks.getSignatureStatusWithKitRpc.mockResolvedValue({
      confirmationStatus: "confirmed",
      err: null,
      slot: 10
    });
    mocks.upsertMintJobFromSnapshot.mockResolvedValue({
      id: "mint-job-1",
      status: "completed"
    });
    mocks.upsertAssetMintSnapshot.mockImplementation(async (input) => ({
      snapshotId: "snapshot-1",
      verificationStatus: input.verificationStatus,
      marketplaceHandoffStatus: input.marketplaceHandoffStatus
    }));
  });

  it("marks deploy snapshot ready when config lines are loaded even if DAS has no minted assets", async () => {
    mockCandyMachineState(3);

    const result = await finalizeCoreCandyMachineSnapshot(VALID_ACTOR, buildFinalizePayload());

    expect(result.canCreateAsset).toBe(true);
    expect(result.verificationStatus).toBe("verified");
    expect(result.verificationMethod).toBe("candy_machine_items_loaded");
    expect(result.foundAssets).toBe(0);
    expect(result.verificationError).toBeNull();
    expect(mocks.upsertMintJobFromSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      status: "completed",
      totalItems: 3,
      submittedItems: 3,
      confirmedItems: 3,
      failedItems: 0,
      lastError: null
    }));
  });

  it("blocks deploy snapshot when config lines are not fully loaded", async () => {
    mockCandyMachineState(2);

    const result = await finalizeCoreCandyMachineSnapshot(VALID_ACTOR, buildFinalizePayload());

    expect(result.canCreateAsset).toBe(false);
    expect(result.verificationStatus).toBe("failed");
    expect(result.verificationMethod).toBe("candy_machine_items_loaded");
    expect(result.verificationError).toEqual(expect.objectContaining({
      code: "CONFIG_LINES_NOT_LOADED"
    }));
  });

  it("blocks deploy snapshot when a deploy proof is only processed, not confirmed", async () => {
    mockCandyMachineState(3);
    mocks.getSignatureStatusWithKitRpc.mockResolvedValue({
      confirmationStatus: "processed",
      err: null,
      slot: 10
    });

    const result = await finalizeCoreCandyMachineSnapshot(VALID_ACTOR, buildFinalizePayload());

    expect(result.canCreateAsset).toBe(false);
    expect(mocks.upsertMintJobFromSnapshot).toHaveBeenCalledWith(expect.objectContaining({
      status: "partial",
      confirmedItems: 0,
      lastError: "Mint proof status is not completed."
    }));
  });
});
