import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  query: vi.fn()
}));

const dasMocks = vi.hoisted(() => ({
  getAssetsByOwner: vi.fn()
}));

const mplCoreMocks = vi.hoisted(() => ({
  fetchAsset: vi.fn(),
  fetchCollection: vi.fn(),
  isFrozen: vi.fn()
}));

const repositoryMocks = vi.hoisted(() => ({
  listStakeActionAttemptsByWallet: vi.fn()
}));

const reconciliationMocks = vi.hoisted(() => ({
  reconcileSubmittedStakeActionBySignature: vi.fn()
}));

const compatMocks = vi.hoisted(() => ({
  normalizeLegacyPublicKey: vi.fn()
}));

const freezeDelegateMocks = vi.hoisted(() => ({
  hasOwnerFreezeDelegatePlugin: vi.fn()
}));

vi.mock("@/features/shared/infrastructure/db/pool", () => ({
  withDbClient: vi.fn(async (callback: (client: { query: typeof dbMocks.query }) => Promise<unknown>) =>
    callback({ query: dbMocks.query })
  )
}));

vi.mock("@/lib/das-client", () => ({
  DasClient: vi.fn(function DasClient() {
    return {
    getAssetsByOwner: dasMocks.getAssetsByOwner
    };
  })
}));

vi.mock("@metaplex-foundation/mpl-core", () => ({
  fetchAsset: mplCoreMocks.fetchAsset,
  fetchCollection: mplCoreMocks.fetchCollection,
  freezeAsset: vi.fn(),
  isFrozen: mplCoreMocks.isFrozen,
  mplCore: vi.fn(),
  thawAsset: vi.fn()
}));

vi.mock("@metaplex-foundation/umi", () => ({
  createNoopSigner: vi.fn(),
  publicKey: vi.fn((value: string) => value),
  signerIdentity: vi.fn()
}));

vi.mock("@metaplex-foundation/umi-bundle-defaults", () => ({
  createUmi: vi.fn(() => ({ use: vi.fn().mockReturnThis() }))
}));

vi.mock("@/lib/mpl-core-freeze-delegate", () => ({
  hasOwnerFreezeDelegatePlugin: freezeDelegateMocks.hasOwnerFreezeDelegatePlugin
}));

vi.mock("@/lib/solana", () => ({
  getSolanaRpcUrl: vi.fn(() => "https://api.devnet.solana.com")
}));

vi.mock("@/lib/stake-attempts-repository", () => ({
  createStakeActionAttempt: vi.fn(),
  getStakeActionAttemptById: vi.fn(),
  listStakeActionAttemptsByWallet: repositoryMocks.listStakeActionAttemptsByWallet,
  markStakeActionAttemptFailed: vi.fn(),
  markStakeActionAttemptSubmitted: vi.fn()
}));

vi.mock("@/lib/stake-webhook-reconciliation", () => ({
  reconcileSubmittedStakeActionBySignature: reconciliationMocks.reconcileSubmittedStakeActionBySignature
}));

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  convertUmiTransactionToLegacyVersionedTransaction: vi.fn(),
  createLegacyConnection: vi.fn(),
  deserializeLegacyVersionedTransaction: vi.fn(),
  getLegacyTransactionMessageMismatchDiagnostics: vi.fn(),
  getLegacyTransactionMessageMismatchReasons: vi.fn(),
  getLegacyTransactionPayer: vi.fn(),
  normalizeLegacyPublicKey: compatMocks.normalizeLegacyPublicKey,
  sendLegacyVersionedTransaction: vi.fn(),
  serializeLegacyVersionedMessage: vi.fn()
}));

import { listStakeAssetsForWallet } from "@/lib/stake-service";

const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

function createAttempt(status: "reconcile_pending" | "submitted" | "validated") {
  return {
    id: "attempt-1",
    idempotencyKey: "idem-1",
    walletPublicKey: "Wallet11111111111111111111111111111111111",
    assetAddress: "Asset111111111111111111111111111111111111",
    collectionAddress: "Collection1111111111111111111111111111",
    candyMachineAddress: "Candy111111111111111111111111111111",
    propertyId: "property-1",
    propertyTitle: "Property",
    productAction: "stake",
    preparedTxMessageBase64: "AQ==",
    txSignature: "tx-signature-1",
    status,
    errorMessage: null,
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:01.000Z"
  };
}

describe("listStakeAssetsForWallet", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://unit.test/brids";
    vi.clearAllMocks();
    compatMocks.normalizeLegacyPublicKey.mockImplementation((value: string) => value);
    dbMocks.query.mockResolvedValue({
      rows: [
        {
          property_id: "property-1",
          property_title: "Property",
          collection_address: "Collection1111111111111111111111111111",
          candy_machine_address: "Candy111111111111111111111111111111"
        }
      ]
    });
    dasMocks.getAssetsByOwner.mockResolvedValue({
      items: [
        {
          id: "Asset111111111111111111111111111111111111",
          grouping: [
            {
              group_key: "collection",
              group_value: "Collection1111111111111111111111111111"
            }
          ],
          content: {
            metadata: {
              name: "BRIDS Fraction #1"
            },
            links: {
              image: "https://example.com/asset.png"
            }
          }
        }
      ]
    });
    mplCoreMocks.fetchAsset.mockResolvedValue({ kind: "asset" });
    mplCoreMocks.fetchCollection.mockResolvedValue({ kind: "collection" });
    mplCoreMocks.isFrozen.mockReturnValue(true);
    freezeDelegateMocks.hasOwnerFreezeDelegatePlugin.mockReturnValue(true);
    reconciliationMocks.reconcileSubmittedStakeActionBySignature.mockResolvedValue({
      status: "validated",
      attemptId: "attempt-1",
      errorMessage: null
    });
  });

  afterEach(() => {
    process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
  });

  it("retries canonical reconciliation before resolving the visible asset state", async () => {
    repositoryMocks.listStakeActionAttemptsByWallet
      .mockResolvedValueOnce([createAttempt("reconcile_pending")])
      .mockResolvedValueOnce([createAttempt("validated")]);

    const assets = await listStakeAssetsForWallet("Wallet11111111111111111111111111111111111");

    expect(reconciliationMocks.reconcileSubmittedStakeActionBySignature).toHaveBeenCalledWith({
      signature: "tx-signature-1"
    });
    expect(repositoryMocks.listStakeActionAttemptsByWallet).toHaveBeenCalledTimes(2);
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      assetAddress: "Asset111111111111111111111111111111111111",
      visibleState: "ready_to_unstake",
      action: "Unstake",
      syncPending: false
    });
  });

  it("keeps sync pending when canonical reconciliation still cannot close", async () => {
    repositoryMocks.listStakeActionAttemptsByWallet
      .mockResolvedValueOnce([createAttempt("submitted")])
      .mockResolvedValueOnce([createAttempt("reconcile_pending")]);

    const assets = await listStakeAssetsForWallet("Wallet11111111111111111111111111111111111");

    expect(reconciliationMocks.reconcileSubmittedStakeActionBySignature).toHaveBeenCalledWith({
      signature: "tx-signature-1"
    });
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({
      visibleState: "sync_pending",
      action: null,
      syncPending: true
    });
  });
});
