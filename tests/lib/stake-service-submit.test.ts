import { beforeEach, describe, expect, it, vi } from "vitest";

const compatMocks = vi.hoisted(() => ({
  createLegacyConnection: vi.fn(),
  deserializeLegacyVersionedTransaction: vi.fn(),
  getLegacyTransactionMessageMismatchDiagnostics: vi.fn(),
  getLegacyTransactionMessageMismatchReasons: vi.fn(),
  getLegacyTransactionPayer: vi.fn(),
  normalizeLegacyPublicKey: vi.fn(),
  sendLegacyVersionedTransaction: vi.fn(),
  serializeLegacyVersionedMessage: vi.fn()
}));

const repositoryMocks = vi.hoisted(() => ({
  getStakeActionAttemptById: vi.fn(),
  markStakeActionAttemptFailed: vi.fn(),
  markStakeActionAttemptSubmitted: vi.fn()
}));

const reconciliationMocks = vi.hoisted(() => ({
  reconcileSubmittedStakeActionBySignature: vi.fn()
}));

vi.mock("@metaplex-foundation/mpl-core", () => ({
  fetchAsset: vi.fn(),
  fetchCollection: vi.fn(),
  freezeAsset: vi.fn(),
  isFrozen: vi.fn(),
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

vi.mock("@/lib/das-client", () => ({
  DasClient: vi.fn()
}));

vi.mock("@/lib/mpl-core-freeze-delegate", () => ({
  hasOwnerFreezeDelegatePlugin: vi.fn()
}));

vi.mock("@/lib/solana", () => ({
  getSolanaRpcUrl: vi.fn(() => "https://api.devnet.solana.com")
}));

vi.mock("@/lib/stake-attempts-repository", () => ({
  createStakeActionAttempt: vi.fn(),
  getStakeActionAttemptById: repositoryMocks.getStakeActionAttemptById,
  listStakeActionAttemptsByWallet: vi.fn(),
  markStakeActionAttemptFailed: repositoryMocks.markStakeActionAttemptFailed,
  markStakeActionAttemptSubmitted: repositoryMocks.markStakeActionAttemptSubmitted
}));

vi.mock("@/lib/stake-webhook-reconciliation", () => ({
  reconcileSubmittedStakeActionBySignature: reconciliationMocks.reconcileSubmittedStakeActionBySignature
}));

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  convertUmiTransactionToLegacyVersionedTransaction: vi.fn(),
  createLegacyConnection: compatMocks.createLegacyConnection,
  deserializeLegacyVersionedTransaction: compatMocks.deserializeLegacyVersionedTransaction,
  getLegacyTransactionMessageMismatchDiagnostics: compatMocks.getLegacyTransactionMessageMismatchDiagnostics,
  getLegacyTransactionMessageMismatchReasons: compatMocks.getLegacyTransactionMessageMismatchReasons,
  getLegacyTransactionPayer: compatMocks.getLegacyTransactionPayer,
  normalizeLegacyPublicKey: compatMocks.normalizeLegacyPublicKey,
  sendLegacyVersionedTransaction: compatMocks.sendLegacyVersionedTransaction,
  serializeLegacyVersionedMessage: compatMocks.serializeLegacyVersionedMessage
}));

import { submitStakeAction } from "@/lib/stake-service";

describe("submitStakeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    compatMocks.normalizeLegacyPublicKey.mockImplementation((value: string) => value);
    compatMocks.deserializeLegacyVersionedTransaction.mockReturnValue({ kind: "signed-transaction" });
    compatMocks.getLegacyTransactionPayer.mockReturnValue("Wallet11111111111111111111111111111111111");
    compatMocks.getLegacyTransactionMessageMismatchReasons.mockReturnValue([]);
    compatMocks.createLegacyConnection.mockReturnValue({ kind: "connection" });
    compatMocks.sendLegacyVersionedTransaction.mockResolvedValue("tx-signature-1");
    reconciliationMocks.reconcileSubmittedStakeActionBySignature.mockResolvedValue({
      status: "validated",
      attemptId: "attempt-1",
      errorMessage: null
    });
    repositoryMocks.getStakeActionAttemptById.mockResolvedValue({
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
      txSignature: null,
      status: "prepared",
      errorMessage: null,
      createdAt: "2026-06-05T00:00:00.000Z",
      updatedAt: "2026-06-05T00:00:00.000Z"
    });
    repositoryMocks.markStakeActionAttemptSubmitted.mockResolvedValue(null);
  });

  it("persists submitted as soon as raw transaction submission returns a signature", async () => {
    const result = await submitStakeAction({
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      attemptId: "attempt-1",
      idempotencyKey: "idem-1",
      signedTransactionBase64: "AQ=="
    });

    expect(compatMocks.sendLegacyVersionedTransaction).toHaveBeenCalledWith(
      { kind: "connection" },
      { kind: "signed-transaction" }
    );
    expect(repositoryMocks.markStakeActionAttemptSubmitted).toHaveBeenCalledWith({
      attemptId: "attempt-1",
      txSignature: "tx-signature-1"
    });
    expect(reconciliationMocks.reconcileSubmittedStakeActionBySignature).toHaveBeenCalledWith({
      signature: "tx-signature-1"
    });
    expect(result).toMatchObject({
      attemptId: "attempt-1",
      txSignature: "tx-signature-1",
      status: "submitted"
    });
  });
});
