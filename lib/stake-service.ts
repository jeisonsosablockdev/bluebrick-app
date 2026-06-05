import { fetchAsset, fetchCollection, freezeAsset, isFrozen, mplCore, thawAsset } from "@metaplex-foundation/mpl-core";
import { createNoopSigner, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { withDbClient } from "@/lib/db/pool";
import { DasClient } from "@/lib/das-client";
import {
  convertUmiTransactionToLegacyVersionedTransaction,
  createLegacyConnection,
  deserializeLegacyVersionedTransaction,
  getLegacyTransactionMessageMismatchDiagnostics,
  getLegacyTransactionMessageMismatchReasons,
  getLegacyTransactionPayer,
  normalizeLegacyPublicKey,
  sendLegacyVersionedTransaction,
  serializeLegacyVersionedMessage
} from "@/lib/solana-kit/compat/web3-transactions";
import { generateUuidV7 } from "@/lib/uuid-v7";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  createStakeActionAttempt,
  getStakeActionAttemptById,
  listStakeActionAttemptsByWallet,
  markStakeActionAttemptFailed,
  markStakeActionAttemptSubmitted,
  type StakeActionAttemptRecord,
  type StakeProductAction
} from "@/lib/stake-attempts-repository";
import { reconcileSubmittedStakeActionBySignature } from "@/lib/stake-webhook-reconciliation";
import { hasOwnerFreezeDelegatePlugin } from "@/lib/mpl-core-freeze-delegate";

export type StakeVisibleState =
  | "disabled_unsupported"
  | "ready_to_stake"
  | "ready_to_unstake"
  | "sync_pending";

export type StakeAssetItem = {
  assetAddress: string;
  propertyId: string;
  propertyTitle: string;
  collectionAddress: string;
  candyMachineAddress: string;
  displayName: string;
  imageUrl: string | null;
  visibleState: StakeVisibleState;
  action: "Stake" | "Unstake" | null;
  isFrozen: boolean;
  syncPending: boolean;
};

export type PreparedStakeAction = {
  attemptId: string;
  idempotencyKey: string;
  assetAddress: string;
  propertyId: string;
  propertyTitle: string;
  collectionAddress: string;
  candyMachineAddress: string;
  productAction: StakeProductAction;
  network: "devnet";
  preparedAt: string;
  transactionBase64: string;
};

export type SubmittedStakeAction = {
  attemptId: string;
  txSignature: string;
  submittedAt: string;
  status: "submitted";
};

export class StakeFlowError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "StakeFlowError";
    this.code = code;
    this.status = status;
  }
}

type BridsInventoryRow = {
  property_id: string;
  property_title: string;
  collection_address: string;
  candy_machine_address: string;
};

type BridsInventoryRecord = {
  propertyId: string;
  propertyTitle: string;
  collectionAddress: string;
  candyMachineAddress: string;
};

type OwnerDasAssetCandidate = {
  assetAddress: string;
  collectionAddress: string | null;
  displayName: string;
  imageUrl: string | null;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new StakeFlowError("INVALID_INPUT", `${label} is required.`, 400);
  }

  return normalized;
}

function parsePublicKey(raw: string, label: string): string {
  try {
    return normalizeLegacyPublicKey(raw);
  } catch {
    throw new StakeFlowError("INVALID_INPUT", `${label} is not a valid Solana public key.`, 400);
  }
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64Value: string): Buffer {
  try {
    return Buffer.from(base64Value, "base64");
  } catch {
    throw new StakeFlowError("INVALID_INPUT", "Signed transaction is not valid base64.", 400);
  }
}

function parseSignedTransaction(base64Value: string) {
  const raw = fromBase64(base64Value);
  if (!raw.length) {
    throw new StakeFlowError("INVALID_INPUT", "Signed transaction cannot be empty.", 400);
  }

  try {
    return deserializeLegacyVersionedTransaction(raw);
  } catch {
    throw new StakeFlowError("INVALID_INPUT", "Signed transaction payload is invalid.", 400);
  }
}

function normalizeImageUri(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^ipfs:\/\//i.test(trimmed)) {
    const cid = trimmed.replace(/^ipfs:\/\//i, "").replace(/^\/+/, "");
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : null;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function extractCollectionAddress(rawAsset: unknown): string | null {
  const asset = asRecord(rawAsset);
  const grouping = Array.isArray(asset.grouping) ? asset.grouping : [];

  for (const entry of grouping) {
    const record = asRecord(entry);
    const key = asString(record.group_key)?.toLowerCase();
    const value = asString(record.group_value);
    if (key === "collection" && value) {
      return value;
    }
  }

  const content = asRecord(asset.content);
  const metadata = asRecord(content.metadata);
  const collection = asRecord(metadata.collection);

  return asString(collection.key);
}

function extractDisplayName(rawAsset: unknown): string {
  const asset = asRecord(rawAsset);
  const content = asRecord(asset.content);
  const metadata = asRecord(content.metadata);
  return asString(metadata.name) ?? asString(asset.id) ?? "BRIDS NFT";
}

function extractImageUrl(rawAsset: unknown): string | null {
  const asset = asRecord(rawAsset);
  const content = asRecord(asset.content);
  const links = asRecord(content.links);
  const metadata = asRecord(content.metadata);

  return normalizeImageUri(links.image) ?? normalizeImageUri(metadata.image);
}

function normalizeOwnerAsset(rawAsset: unknown): OwnerDasAssetCandidate | null {
  const asset = asRecord(rawAsset);
  const assetAddress = asString(asset.id);
  if (!assetAddress) {
    return null;
  }

  return {
    assetAddress,
    collectionAddress: extractCollectionAddress(rawAsset),
    displayName: extractDisplayName(rawAsset),
    imageUrl: extractImageUrl(rawAsset)
  };
}

function assertPayerMatchesWallet(transaction: ReturnType<typeof parseSignedTransaction>, walletPublicKey: string): void {
  const payer = getLegacyTransactionPayer(transaction);
  if (payer !== walletPublicKey) {
    throw new StakeFlowError("UNAUTHORIZED", "Signed transaction payer does not match authenticated wallet.", 403);
  }
}

function assertPreparedMessageMatches(input: {
  transaction: ReturnType<typeof parseSignedTransaction>;
  preparedMessageBase64: string;
  attemptId: string;
  walletPublicKey: string;
  assetAddress: string;
}): void {
  const preparedMessageBytes = fromBase64(input.preparedMessageBase64);
  const mismatchReasons = getLegacyTransactionMessageMismatchReasons(input.transaction, preparedMessageBytes);
  if (mismatchReasons.length > 0) {
    console.warn(JSON.stringify({
      event: "Stake signed transaction mismatch",
      attemptId: input.attemptId,
      walletPublicKey: input.walletPublicKey,
      assetAddress: input.assetAddress,
      mismatchReasons,
      diagnostics: getLegacyTransactionMessageMismatchDiagnostics(input.transaction, preparedMessageBytes)
    }));
    throw new StakeFlowError("INVALID_TRANSACTION", "Signed transaction does not match the prepared stake action.", 409);
  }
}

function reconcileSubmittedStakeActionInBackground(txSignature: string): void {
  void reconcileSubmittedStakeActionBySignature({ signature: txSignature }).catch((error) => {
    console.warn(JSON.stringify({
      event: "Stake canonical reconciliation failed",
      txSignature,
      errorMessage: error instanceof Error ? error.message : "Unknown reconciliation error"
    }));
  });
}

function shouldRetryStakeAttemptReconciliation(attempt: StakeActionAttemptRecord): boolean {
  return Boolean(
    attempt.txSignature
    && (attempt.status === "submitted" || attempt.status === "reconcile_pending")
  );
}

function listRetryableStakeAttemptSignatures(attempts: StakeActionAttemptRecord[]): string[] {
  const signatures = new Set<string>();

  for (const attempt of attempts) {
    if (!shouldRetryStakeAttemptReconciliation(attempt) || !attempt.txSignature) {
      continue;
    }

    signatures.add(attempt.txSignature);

    if (signatures.size >= 10) {
      break;
    }
  }

  return Array.from(signatures);
}

function logStakeReconciliationRetryFailures(results: PromiseSettledResult<unknown>[]): void {
  for (const result of results) {
    if (result.status === "rejected") {
      console.warn(JSON.stringify({
        event: "Stake pending reconciliation retry failed",
        errorMessage: result.reason instanceof Error ? result.reason.message : "Unknown reconciliation retry error"
      }));
    }
  }
}

async function reconcilePendingStakeAttempts(attempts: StakeActionAttemptRecord[]): Promise<boolean> {
  const signatures = listRetryableStakeAttemptSignatures(attempts);

  if (signatures.length === 0) {
    return false;
  }

  const results = await Promise.allSettled(
    signatures.map((signature) => reconcileSubmittedStakeActionBySignature({ signature }))
  );

  logStakeReconciliationRetryFailures(results);

  return true;
}

async function listBridsStakeInventory(): Promise<BridsInventoryRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  return withDbClient(async (client) => {
    const result = await client.query<BridsInventoryRow>(
      `SELECT property_id, property_title, collection_address, candy_machine_address
       FROM (
         SELECT DISTINCT ON (e.collection_address, e.asset_mint_address)
           e.id AS property_id,
           e.title AS property_title,
           e.collection_address,
           e.asset_mint_address AS candy_machine_address,
           e.updated_at,
           e.created_at
         FROM marketplace_entries AS e
         INNER JOIN asset_mint_snapshots AS s
           ON s.collection_address = e.collection_address
          AND s.candy_machine_address = e.asset_mint_address
         WHERE s.verification_status = 'verified'
         ORDER BY e.collection_address, e.asset_mint_address, e.updated_at DESC, e.created_at DESC
       ) AS latest_verified_inventory
       ORDER BY updated_at DESC, created_at DESC`
    );

    return result.rows.map((row) => ({
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      collectionAddress: row.collection_address,
      candyMachineAddress: row.candy_machine_address
    }));
  });
}

async function listOwnerBridsDasAssets(walletPublicKey: string): Promise<OwnerDasAssetCandidate[]> {
  const client = new DasClient();
  const items: OwnerDasAssetCandidate[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 3; page += 1) {
    const result = await client.getAssetsByOwner(walletPublicKey, { page, limit: 200 });

    for (const rawAsset of result.items) {
      const normalized = normalizeOwnerAsset(rawAsset);
      if (!normalized || seen.has(normalized.assetAddress)) {
        continue;
      }

      seen.add(normalized.assetAddress);
      items.push(normalized);
    }

    if (result.items.length < 200) {
      break;
    }
  }

  return items;
}

function buildOwnerUmi(walletPublicKey: string) {
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());
  const ownerSigner = createNoopSigner(publicKey(walletPublicKey));
  umi.use(signerIdentity(ownerSigner, true));
  return { umi, ownerSigner };
}

async function inspectBridsStakeAsset(input: {
  walletPublicKey: string;
  assetAddress: string;
}): Promise<{
  inventory: BridsInventoryRecord;
  displayName: string;
  imageUrl: string | null;
  isFrozenState: boolean;
  supportsFreeze: boolean;
}> {
  const walletPublicKey = parsePublicKey(input.walletPublicKey, "walletPublicKey");
  const assetAddress = parsePublicKey(input.assetAddress, "assetAddress");
  const inventory = await listBridsStakeInventory();
  const inventoryByCollection = new Map(inventory.map((entry) => [entry.collectionAddress, entry]));
  const ownerAssets = await listOwnerBridsDasAssets(walletPublicKey);
  const ownerAsset = ownerAssets.find((entry) => entry.assetAddress === assetAddress) ?? null;

  if (!ownerAsset) {
    throw new StakeFlowError("ASSET_NOT_OWNED", "Asset is not currently owned by the authenticated wallet.", 404);
  }

  const collectionAddress = ownerAsset.collectionAddress;
  if (!collectionAddress) {
    throw new StakeFlowError("ASSET_NOT_BRIDS", "Asset does not belong to the BRIDS inventory.", 404);
  }

  const linkedInventory = inventoryByCollection.get(collectionAddress) ?? null;
  if (!linkedInventory) {
    throw new StakeFlowError("ASSET_NOT_BRIDS", "Asset does not belong to the BRIDS inventory.", 404);
  }

  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());
  const asset = await fetchAsset(umi, publicKey(assetAddress));
  const collection = await fetchCollection(umi, publicKey(collectionAddress)).catch(() => null);
  const frozen = isFrozen(asset, collection ?? undefined);
  const supportsFreeze = hasOwnerFreezeDelegatePlugin(asset);

  return {
    inventory: linkedInventory,
    displayName: ownerAsset.displayName,
    imageUrl: ownerAsset.imageUrl,
    isFrozenState: frozen,
    supportsFreeze
  };
}

function resolveVisibleState(input: {
  supportsFreeze: boolean;
  isFrozenState: boolean;
  hasPendingSync: boolean;
}): StakeVisibleState {
  if (!input.supportsFreeze) {
    return "disabled_unsupported";
  }

  if (input.hasPendingSync) {
    return "sync_pending";
  }

  return input.isFrozenState ? "ready_to_unstake" : "ready_to_stake";
}

export async function listStakeAssetsForWallet(walletPublicKey: string): Promise<StakeAssetItem[]> {
  const wallet = parsePublicKey(walletPublicKey, "walletPublicKey");
  const inventory = await listBridsStakeInventory();

  if (inventory.length === 0) {
    return [];
  }

  const ownerAssets = await listOwnerBridsDasAssets(wallet);
  const inventoryByCollection = new Map(inventory.map((entry) => [entry.collectionAddress, entry]));
  let attempts = await listStakeActionAttemptsByWallet(wallet);
  if (await reconcilePendingStakeAttempts(attempts)) {
    attempts = await listStakeActionAttemptsByWallet(wallet);
  }

  const latestAttemptByAsset = new Map<string, Awaited<ReturnType<typeof listStakeActionAttemptsByWallet>>[number]>();

  for (const attempt of attempts) {
    if (!latestAttemptByAsset.has(attempt.assetAddress)) {
      latestAttemptByAsset.set(attempt.assetAddress, attempt);
    }
  }

  const filteredAssets = ownerAssets.filter((entry) => entry.collectionAddress && inventoryByCollection.has(entry.collectionAddress));
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());

  const resolved = await Promise.all(filteredAssets.map(async (asset) => {
    const inventoryEntry = inventoryByCollection.get(asset.collectionAddress as string);
    if (!inventoryEntry) {
      return null;
    }

    const onchainAsset = await fetchAsset(umi, publicKey(asset.assetAddress));
    const onchainCollection = await fetchCollection(umi, publicKey(inventoryEntry.collectionAddress)).catch(() => null);
    const frozen = isFrozen(onchainAsset, onchainCollection ?? undefined);
    const latestAttempt = latestAttemptByAsset.get(asset.assetAddress) ?? null;
    const hasPendingSync = Boolean(
      latestAttempt
      && (latestAttempt.status === "submitted" || latestAttempt.status === "reconcile_pending")
    );
    const visibleState = resolveVisibleState({
      supportsFreeze: hasOwnerFreezeDelegatePlugin(onchainAsset),
      isFrozenState: frozen,
      hasPendingSync
    });

    return {
      assetAddress: asset.assetAddress,
      propertyId: inventoryEntry.propertyId,
      propertyTitle: inventoryEntry.propertyTitle,
      collectionAddress: inventoryEntry.collectionAddress,
      candyMachineAddress: inventoryEntry.candyMachineAddress,
      displayName: asset.displayName,
      imageUrl: asset.imageUrl,
      visibleState,
      action: visibleState === "ready_to_unstake" ? "Unstake" : visibleState === "ready_to_stake" ? "Stake" : null,
      isFrozen: frozen,
      syncPending: hasPendingSync
    } satisfies StakeAssetItem;
  }));

  return resolved.filter((item): item is StakeAssetItem => Boolean(item));
}

export async function prepareStakeAction(input: {
  walletPublicKey: string;
  assetAddress: string;
  action: StakeProductAction;
}): Promise<PreparedStakeAction> {
  const walletPublicKey = parsePublicKey(input.walletPublicKey, "walletPublicKey");
  const assetAddress = parsePublicKey(input.assetAddress, "assetAddress");
  const inspection = await inspectBridsStakeAsset({ walletPublicKey, assetAddress });

  if (!inspection.supportsFreeze) {
    throw new StakeFlowError("ASSET_UNSUPPORTED", "Asset does not support owner-managed freeze / unfreeze.", 409);
  }

  if (input.action === "stake" && inspection.isFrozenState) {
    throw new StakeFlowError("INVALID_STATE", "Asset is already staked.", 409);
  }

  if (input.action === "unstake" && !inspection.isFrozenState) {
    throw new StakeFlowError("INVALID_STATE", "Asset is not currently staked.", 409);
  }

  const { umi, ownerSigner } = buildOwnerUmi(walletPublicKey);
  const asset = await fetchAsset(umi, publicKey(assetAddress));
  const collection = await fetchCollection(umi, publicKey(inspection.inventory.collectionAddress)).catch(() => null);
  const builder = input.action === "stake"
    ? freezeAsset(umi, {
        asset,
        collection: collection ?? undefined,
        authority: ownerSigner,
        delegate: ownerSigner.publicKey
      })
    : thawAsset(umi, {
        asset,
        collection: collection ?? undefined,
        delegate: ownerSigner
      });

  const built = await builder.buildWithLatestBlockhash(umi);
  const web3Transaction = convertUmiTransactionToLegacyVersionedTransaction(built);
  const transactionBase64 = toBase64(web3Transaction.serialize());
  const preparedTxMessageBase64 = toBase64(web3Transaction.message.serialize());
  const idempotencyKey = generateUuidV7();
  const attempt = await createStakeActionAttempt({
    idempotencyKey,
    walletPublicKey,
    assetAddress,
    collectionAddress: inspection.inventory.collectionAddress,
    candyMachineAddress: inspection.inventory.candyMachineAddress,
    propertyId: inspection.inventory.propertyId,
    propertyTitle: inspection.inventory.propertyTitle,
    productAction: input.action,
    preparedTxMessageBase64
  });

  return {
    attemptId: attempt.id,
    idempotencyKey: attempt.idempotencyKey,
    assetAddress,
    propertyId: inspection.inventory.propertyId,
    propertyTitle: inspection.inventory.propertyTitle,
    collectionAddress: inspection.inventory.collectionAddress,
    candyMachineAddress: inspection.inventory.candyMachineAddress,
    productAction: input.action,
    network: "devnet",
    preparedAt: attempt.createdAt,
    transactionBase64
  };
}

export async function submitStakeAction(input: {
  walletPublicKey: string;
  attemptId: string;
  idempotencyKey: string;
  signedTransactionBase64: string;
}): Promise<SubmittedStakeAction> {
  const walletPublicKey = parsePublicKey(input.walletPublicKey, "walletPublicKey");
  const attemptId = assertNonEmpty(input.attemptId, "attemptId");
  const idempotencyKey = assertNonEmpty(input.idempotencyKey, "idempotencyKey");
  const signedTransactionBase64 = assertNonEmpty(input.signedTransactionBase64, "signedTransactionBase64");
  const attempt = await getStakeActionAttemptById(attemptId);

  if (!attempt || attempt.walletPublicKey !== walletPublicKey || attempt.idempotencyKey !== idempotencyKey) {
    throw new StakeFlowError("UNAUTHORIZED", "Stake attempt does not belong to the authenticated wallet.", 403);
  }

  if (attempt.status !== "prepared") {
    throw new StakeFlowError("INVALID_STATE", "Stake attempt is not in a submittable state.", 409);
  }

  const signedTransaction = parseSignedTransaction(signedTransactionBase64);
  assertPayerMatchesWallet(signedTransaction, walletPublicKey);
  assertPreparedMessageMatches({
    transaction: signedTransaction,
    preparedMessageBase64: attempt.preparedTxMessageBase64,
    attemptId,
    walletPublicKey,
    assetAddress: attempt.assetAddress
  });

  const connection = createLegacyConnection(getSolanaRpcUrl(), "confirmed");

  try {
    const txSignature = await sendLegacyVersionedTransaction(connection, signedTransaction);
    await markStakeActionAttemptSubmitted({ attemptId, txSignature });
    reconcileSubmittedStakeActionInBackground(txSignature);

    return {
      attemptId,
      txSignature,
      submittedAt: new Date().toISOString(),
      status: "submitted"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit stake transaction.";
    await markStakeActionAttemptFailed({
      attemptId,
      errorMessage: message
    });
    throw new StakeFlowError("TRANSACTION_FAILED", message, 500);
  }
}
