import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchCandyMachine,
  findCandyGuardPda,
  mplCandyMachine,
  safeFetchCandyGuard
} from "@metaplex-foundation/mpl-core-candy-machine";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";

import { DasClient } from "@/lib/das-client";
import {
  type MintJobSnapshotStatus,
  type SnapshotProofConfirmationStatus,
  type SnapshotProofKind,
  upsertAssetMintSnapshot,
  upsertMintJobFromSnapshot
} from "@/lib/core-candy-machine-snapshot-repository";
import { readBoundedIntegerEnv } from "@/lib/runtime-config";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  createKitRpcConnection,
  getSignatureStatusWithKitRpc,
  normalizeLegacyPublicKey
} from "@/lib/solana-kit/compat/web3-transactions";

const DAS_PAGE_LIMIT = 1_000;
const DAS_MAX_PAGES = 100;
const CANDY_MACHINE_STATE_MAX_ATTEMPTS_DEFAULT = 8;
const CANDY_MACHINE_STATE_MAX_ATTEMPTS_LIMIT = 25;
const CANDY_MACHINE_STATE_RETRY_MS_DEFAULT = 1_500;
const CANDY_MACHINE_STATE_RETRY_MS_LIMIT = 5_000;
const SNAPSHOT_FINALIZE_MAX_WAIT_MS_DEFAULT = 120_000;
const SNAPSHOT_FINALIZE_MAX_WAIT_MS_LIMIT = 180_000;
const SNAPSHOT_FINALIZE_RETRY_MS_DEFAULT = 5_000;
const SNAPSHOT_FINALIZE_RETRY_MS_LIMIT = 30_000;

type SnapshotFinalizeRequest = {
  draftId: string;
  formSnapshot: Record<string, unknown>;
  mint: {
    quantity: number;
    status: string | null;
    collectionName: string | null;
    collectionUri: string | null;
    assetNamePrefix: string | null;
    assetUri: string | null;
    startDate: string | null;
    candyMachineAddress: string;
    collectionAddress: string;
    signatures: Array<{
      kind: SnapshotProofKind;
      label: string;
      signature: string;
      expectedAddress: string | null;
    }>;
  };
};

type SnapshotVerificationStatus = "verified" | "failed" | "degraded";
type SnapshotVerificationMethod = "das_get_assets_by_group" | "candy_machine_items_loaded";
type SnapshotMarketplaceHandoffStatus = "pending" | "ready" | "consumed" | "failed";

type SnapshotVerificationError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

type SignatureProof = {
  kind: SnapshotProofKind;
  label: string;
  signature: string;
  expectedAddress: string | null;
  confirmationStatus: SnapshotProofConfirmationStatus;
  slot: number | null;
  txError: string | null;
};

type MintJobResolution = ReturnType<typeof resolveMintJobStatus>;

type SnapshotVerificationAttempt = {
  proofs: SignatureProof[];
  mintJob: MintJobResolution;
  onchain: CandyMachineOnchainState | null;
  foundAssets: number | null;
  verificationStatus: SnapshotVerificationStatus;
  verificationError: SnapshotVerificationError | null;
  definitive: boolean;
};

type CandyMachineOnchainState = {
  cluster: "devnet";
  rpcUrl: string;
  candyMachineAddress: string;
  candyGuardAddress: string | null;
  collectionAddressOnchain: string;
  authority: string;
  mintAuthority: string;
  itemsAvailable: number;
  itemsLoaded: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  guardStartDateUnix: number | null;
  guardStartDateIso: string | null;
  guardSolPaymentLamports: number | null;
  guardSolPaymentDestination: string | null;
  configLineSettings: Record<string, unknown> | null;
};

export type FinalizeCoreCandyMachineSnapshotResult = {
  snapshotId: string;
  mintJobId: string;
  verificationStatus: SnapshotVerificationStatus;
  verificationMethod: SnapshotVerificationMethod;
  marketplaceHandoffStatus: SnapshotMarketplaceHandoffStatus;
  expectedQuantity: number;
  foundAssets: number | null;
  canCreateAsset: boolean;
  verificationError: SnapshotVerificationError | null;
};

export class CoreCandyMachineSnapshotError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "CoreCandyMachineSnapshotError";
    this.code = code;
    this.status = status;
  }
}

export function isCoreCandyMachineSnapshotError(error: unknown): error is CoreCandyMachineSnapshotError {
  return error instanceof CoreCandyMachineSnapshotError;
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
  return trimmed ? trimmed : null;
}

function asPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function toInteger(value: unknown): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.floor(value) : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getCandyMachineStateRetryConfig(): { maxAttempts: number; retryMs: number } {
  return {
    maxAttempts: readBoundedIntegerEnv({
      env: process.env,
      name: "CORE_CM_SNAPSHOT_STATE_MAX_ATTEMPTS",
      fallback: CANDY_MACHINE_STATE_MAX_ATTEMPTS_DEFAULT,
      min: 1,
      max: CANDY_MACHINE_STATE_MAX_ATTEMPTS_LIMIT
    }),
    retryMs: readBoundedIntegerEnv({
      env: process.env,
      name: "CORE_CM_SNAPSHOT_STATE_RETRY_MS",
      fallback: CANDY_MACHINE_STATE_RETRY_MS_DEFAULT,
      min: 0,
      max: CANDY_MACHINE_STATE_RETRY_MS_LIMIT
    })
  };
}

function getSnapshotFinalizeRetryConfig(): { maxWaitMs: number; retryMs: number } {
  return {
    maxWaitMs: readBoundedIntegerEnv({
      env: process.env,
      name: "CORE_CM_SNAPSHOT_FINALIZE_MAX_WAIT_MS",
      fallback: SNAPSHOT_FINALIZE_MAX_WAIT_MS_DEFAULT,
      min: 0,
      max: SNAPSHOT_FINALIZE_MAX_WAIT_MS_LIMIT
    }),
    retryMs: readBoundedIntegerEnv({
      env: process.env,
      name: "CORE_CM_SNAPSHOT_FINALIZE_RETRY_MS",
      fallback: SNAPSHOT_FINALIZE_RETRY_MS_DEFAULT,
      min: 1,
      max: SNAPSHOT_FINALIZE_RETRY_MS_LIMIT
    })
  };
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertPublicKey(input: string, fieldName: string): string {
  try {
    return normalizeLegacyPublicKey(input);
  } catch {
    throw new CoreCandyMachineSnapshotError("INVALID_PUBLIC_KEY", `${fieldName} must be a valid Solana public key.`, 400);
  }
}

function isKnownProofKind(value: unknown): value is SnapshotProofKind {
  return (
    value === "create-collection"
    || value === "create-candy-machine"
    || value === "add-config-lines"
    || value === "mint"
  );
}

function parseSnapshotFinalizeRequest(raw: unknown): SnapshotFinalizeRequest {
  const payload = asRecord(raw);
  const draftId = asString(payload.draftId);

  if (!draftId) {
    throw new CoreCandyMachineSnapshotError("INVALID_SNAPSHOT_PAYLOAD", "draftId is required.", 400);
  }

  const formSnapshotRaw = payload.formSnapshot;
  if (!formSnapshotRaw || typeof formSnapshotRaw !== "object" || Array.isArray(formSnapshotRaw)) {
    throw new CoreCandyMachineSnapshotError("INVALID_SNAPSHOT_PAYLOAD", "formSnapshot must be an object.", 400);
  }
  const formSnapshot = formSnapshotRaw as Record<string, unknown>;

  const mint = asRecord(payload.mint);
  const quantity = asPositiveInteger(mint.quantity);
  const candyMachineAddressRaw = asString(mint.candyMachineAddress);
  const collectionAddressRaw = asString(mint.collectionAddress);

  if (!quantity) {
    throw new CoreCandyMachineSnapshotError("INVALID_SNAPSHOT_PAYLOAD", "mint.quantity must be a positive integer.", 400);
  }

  if (!candyMachineAddressRaw) {
    throw new CoreCandyMachineSnapshotError("INVALID_SNAPSHOT_PAYLOAD", "mint.candyMachineAddress is required.", 400);
  }

  if (!collectionAddressRaw) {
    throw new CoreCandyMachineSnapshotError("INVALID_SNAPSHOT_PAYLOAD", "mint.collectionAddress is required.", 400);
  }

  const signaturesRaw = Array.isArray(mint.signatures) ? mint.signatures : [];
  const uniqueSignatures = new Map<string, SnapshotFinalizeRequest["mint"]["signatures"][number]>();

  for (const item of signaturesRaw) {
    const entry = asRecord(item);
    const signature = asString(entry.signature);
    const label = asString(entry.label);
    const kind = entry.kind;

    if (!signature || !label || !isKnownProofKind(kind)) {
      continue;
    }

    if (uniqueSignatures.has(signature)) {
      continue;
    }

    uniqueSignatures.set(signature, {
      kind,
      label,
      signature,
      expectedAddress: asString(entry.expectedAddress)
    });
  }

  return {
    draftId,
    formSnapshot,
    mint: {
      quantity,
      status: asString(mint.status),
      collectionName: asString(mint.collectionName),
      collectionUri: asString(mint.collectionUri),
      assetNamePrefix: asString(mint.assetNamePrefix),
      assetUri: asString(mint.assetUri),
      startDate: asString(mint.startDate),
      candyMachineAddress: assertPublicKey(candyMachineAddressRaw, "mint.candyMachineAddress"),
      collectionAddress: assertPublicKey(collectionAddressRaw, "mint.collectionAddress"),
      signatures: Array.from(uniqueSignatures.values())
    }
  };
}

function unwrapOption<T>(value: unknown): T | null {
  const option = asRecord(value);

  if (option.__option === "Some") {
    return option.value as T;
  }

  return null;
}

function toGuardAddress(value: unknown): string | null {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }

  const asText = String(value);
  if (asText.includes(",")) {
    const [address] = asText.split(",");
    return address ?? null;
  }

  return asText || null;
}

function toAmountLamports(value: unknown): number | null {
  const record = asRecord(value);
  const basisPoints = record.basisPoints;

  if (typeof basisPoints === "undefined") {
    return null;
  }

  const parsed = toInteger(basisPoints);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchOnchainCandyMachineState(candyMachineAddress: string): Promise<CandyMachineOnchainState> {
  const rpcUrl = getSolanaRpcUrl();
  const umi = createUmi(rpcUrl).use(mplCore()).use(mplCandyMachine());
  const candyMachine = await fetchCandyMachine(umi, publicKey(candyMachineAddress));
  const candyGuardPda = findCandyGuardPda(umi, { base: publicKey(candyMachineAddress) });
  const candyGuard = await safeFetchCandyGuard(umi, candyGuardPda);

  const itemsAvailable = toInteger(candyMachine.data?.itemsAvailable);
  const itemsLoaded = toInteger(candyMachine.itemsLoaded);
  const itemsRedeemed = toInteger(candyMachine.itemsRedeemed);
  const itemsRemaining = Math.max(0, itemsAvailable - itemsRedeemed);
  const configLineSettings = unwrapOption<Record<string, unknown>>(candyMachine.data?.configLineSettings);

  const startDate = unwrapOption<{ date?: unknown }>(candyGuard?.guards?.startDate);
  const startDateUnix = startDate ? toInteger(startDate.date) : null;
  const solPayment = unwrapOption<{ lamports?: unknown; destination?: unknown }>(candyGuard?.guards?.solPayment);

  return {
    cluster: "devnet",
    rpcUrl,
    candyMachineAddress,
    candyGuardAddress: candyGuard ? String(candyGuard.publicKey) : toGuardAddress(candyGuardPda),
    collectionAddressOnchain: String(candyMachine.collectionMint),
    authority: String(candyMachine.authority),
    mintAuthority: String(candyMachine.mintAuthority),
    itemsAvailable,
    itemsLoaded,
    itemsRedeemed,
    itemsRemaining,
    guardStartDateUnix: startDateUnix,
    guardStartDateIso: startDateUnix ? new Date(startDateUnix * 1_000).toISOString() : null,
    guardSolPaymentLamports: solPayment ? toAmountLamports(solPayment.lamports) : null,
    guardSolPaymentDestination: solPayment?.destination ? String(solPayment.destination) : null,
    configLineSettings
  };
}

async function countAssetsWithDas(collectionAddress: string): Promise<{ foundAssets: number; pagesFetched: number }> {
  const dasClient = new DasClient();
  let page = 1;
  let pagesFetched = 0;
  let foundAssets = 0;

  while (pagesFetched < DAS_MAX_PAGES) {
    const pageResult = await dasClient.getAssetsByCollection(collectionAddress, {
      page,
      limit: DAS_PAGE_LIMIT
    });
    const batchSize = pageResult.items.length;

    pagesFetched += 1;
    foundAssets += batchSize;

    if (batchSize < DAS_PAGE_LIMIT) {
      break;
    }

    page += 1;
  }

  return {
    foundAssets,
    pagesFetched
  };
}

async function enrichProofsWithSignatureStatus(signatures: SnapshotFinalizeRequest["mint"]["signatures"]): Promise<SignatureProof[]> {
  if (signatures.length === 0) {
    return [];
  }

  const rpc = createKitRpcConnection(getSolanaRpcUrl());
  const bySignature = new Map<string, { confirmationStatus: SnapshotProofConfirmationStatus; slot: number | null; txError: string | null }>();

  await Promise.all(signatures.map(async (entry) => {
    const signature = entry.signature;

    try {
      const status = await getSignatureStatusWithKitRpc(rpc, signature, {
        searchTransactionHistory: true
      });
      if (!status) {
        bySignature.set(signature, {
          confirmationStatus: "submitted",
          slot: null,
          txError: null
        });
        return;
      }

      if (status.err) {
        bySignature.set(signature, {
          confirmationStatus: "failed",
          slot: typeof status.slot === "number" ? status.slot : null,
          txError: JSON.stringify(status.err)
        });
        return;
      }

      const confirmationStatus = status.confirmationStatus ?? null;
      if (confirmationStatus !== "confirmed" && confirmationStatus !== "finalized") {
        bySignature.set(signature, {
          confirmationStatus: "submitted",
          slot: typeof status.slot === "number" ? status.slot : null,
          txError: null
        });
        return;
      }

      bySignature.set(signature, {
        confirmationStatus: "confirmed",
        slot: typeof status.slot === "number" ? status.slot : null,
        txError: null
      });
    } catch {
      bySignature.set(signature, {
        confirmationStatus: "submitted",
        slot: null,
        txError: null
      });
    }
  }));

  return signatures.map((entry) => {
    const resolved = bySignature.get(entry.signature) ?? {
      confirmationStatus: "submitted" as const,
      slot: null,
      txError: null
    };

    return {
      kind: entry.kind,
      label: entry.label,
      signature: entry.signature,
      expectedAddress: entry.expectedAddress,
      confirmationStatus: resolved.confirmationStatus,
      slot: resolved.slot,
      txError: resolved.txError
    };
  });
}

function resolveMintJobStatus(expectedQuantity: number, proofs: SignatureProof[]): {
  status: MintJobSnapshotStatus;
  submittedItems: number;
  confirmedItems: number;
  failedItems: number;
} {
  const mintProofs = proofs.filter((proof) => proof.kind === "mint");
  const proofSet = mintProofs.length > 0 ? mintProofs : proofs;
  const submittedProofs = proofSet.length;
  const confirmedProofs = proofSet.filter((proof) => proof.confirmationStatus === "confirmed").length;
  const failedProofs = proofSet.filter((proof) => proof.confirmationStatus === "failed").length;
  const pendingProofs = proofSet.filter((proof) => proof.confirmationStatus === "submitted").length;

  if (mintProofs.length === 0 && submittedProofs > 0 && confirmedProofs === submittedProofs && failedProofs === 0 && pendingProofs === 0) {
    return {
      status: "completed",
      submittedItems: expectedQuantity,
      confirmedItems: expectedQuantity,
      failedItems: 0
    };
  }

  const submittedItems = mintProofs.length;
  const confirmedItems = confirmedProofs;
  const failedItems = failedProofs;
  const pendingItems = pendingProofs;

  if (confirmedItems === expectedQuantity && failedItems === 0 && pendingItems === 0) {
    return {
      status: "completed",
      submittedItems,
      confirmedItems,
      failedItems
    };
  }

  if (failedItems > 0) {
    return {
      status: "failed",
      submittedItems,
      confirmedItems,
      failedItems
    };
  }

  if (confirmedItems > 0 || pendingItems > 0) {
    return {
      status: "partial",
      submittedItems,
      confirmedItems,
      failedItems
    };
  }

  return {
    status: "failed",
    submittedItems,
    confirmedItems,
    failedItems
  };
}

function buildVerificationError(code: string, message: string, details: Record<string, unknown>): SnapshotVerificationError {
  return {
    code,
    message,
    details
  };
}

function withFinalizeRetryDetails(
  error: SnapshotVerificationError,
  {
    attempts,
    elapsedMs,
    maxWaitMs,
    lastRecoverableCode
  }: {
    attempts: number;
    elapsedMs: number;
    maxWaitMs: number;
    lastRecoverableCode: string | null;
  }
): SnapshotVerificationError {
  return {
    ...error,
    details: {
      ...error.details,
      snapshotFinalizeAttempts: attempts,
      snapshotFinalizeElapsedMs: elapsedMs,
      snapshotFinalizeMaxWaitMs: maxWaitMs,
      lastRecoverableCode
    }
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function buildSignatureProofsFailedError(proofs: SignatureProof[]): SnapshotVerificationError {
  const failedProofs = proofs
    .filter((proof) => proof.confirmationStatus === "failed")
    .map((proof) => ({
      kind: proof.kind,
      label: proof.label,
      signature: proof.signature,
      expectedAddress: proof.expectedAddress,
      slot: proof.slot,
      txError: proof.txError
    }));

  return buildVerificationError(
    "SIGNATURES_FAILED",
    "One or more deploy transaction signatures failed on-chain.",
    {
      failedProofs
    }
  );
}

function buildSignatureProofsPendingError(proofs: SignatureProof[]): SnapshotVerificationError {
  const pendingProofs = proofs
    .filter((proof) => proof.confirmationStatus !== "confirmed")
    .map((proof) => ({
      kind: proof.kind,
      label: proof.label,
      signature: proof.signature,
      expectedAddress: proof.expectedAddress,
      confirmationStatus: proof.confirmationStatus,
      slot: proof.slot
    }));

  return buildVerificationError(
    "SIGNATURES_NOT_CONFIRMED",
    "Deploy transaction signatures are not fully confirmed by RPC.",
    {
      pendingProofs
    }
  );
}

function buildOnchainReadUnavailableError(input: SnapshotFinalizeRequest, error: unknown): SnapshotVerificationError {
  return buildVerificationError(
    "CANDY_MACHINE_STATE_UNAVAILABLE",
    "Candy Machine state could not be read from RPC yet.",
    {
      candyMachineAddress: input.mint.candyMachineAddress,
      lastReadError: getErrorMessage(error)
    }
  );
}

function buildSnapshotFinalizeTimeoutError(lastError: SnapshotVerificationError | null): SnapshotVerificationError {
  return buildVerificationError(
    "SNAPSHOT_FINALIZE_TIMEOUT",
    "Mint snapshot could not be verified before the retry deadline.",
    {
      lastRecoverableCode: lastError?.code ?? null,
      lastRecoverableMessage: lastError?.message ?? null,
      lastRecoverableDetails: lastError?.details ?? null
    }
  );
}

function buildCollectionMismatchError(
  input: SnapshotFinalizeRequest,
  onchain: CandyMachineOnchainState
): SnapshotVerificationError {
  return buildVerificationError(
    "COLLECTION_ADDRESS_MISMATCH",
    "Collection address mismatch between request payload and on-chain candy machine data.",
    {
      requestCollectionAddress: input.mint.collectionAddress,
      onchainCollectionAddress: onchain.collectionAddressOnchain
    }
  );
}

function buildCandyMachineQuantityMismatchError(
  input: SnapshotFinalizeRequest,
  onchain: CandyMachineOnchainState,
  verificationMethod: SnapshotVerificationMethod,
  foundAssets: number | null
): SnapshotVerificationError {
  return buildVerificationError(
    "CANDY_MACHINE_QUANTITY_MISMATCH",
    "Candy Machine on-chain quantity does not match the requested deploy quantity.",
    {
      expected: input.mint.quantity,
      candyMachineItemsLoaded: onchain.itemsLoaded,
      candyMachineItemsAvailable: onchain.itemsAvailable,
      foundAssets,
      verificationMethod
    }
  );
}

function buildConfigLinesNotLoadedError({
  input,
  onchain,
  foundAssets,
  verificationMethod,
  stateReadAttempts,
  maxAttempts,
  lastReadError
}: {
  input: SnapshotFinalizeRequest;
  onchain: CandyMachineOnchainState;
  foundAssets: number | null;
  verificationMethod: SnapshotVerificationMethod;
  stateReadAttempts: number;
  maxAttempts: number;
  lastReadError: string | null;
}): SnapshotVerificationError {
  return buildVerificationError(
    "CONFIG_LINES_NOT_LOADED",
    `Expected ${input.mint.quantity} Candy Machine config lines but found ${onchain.itemsLoaded} loaded on-chain.`,
    {
      expected: input.mint.quantity,
      candyMachineItemsLoaded: onchain.itemsLoaded,
      candyMachineItemsAvailable: onchain.itemsAvailable,
      foundAssets,
      verificationMethod,
      stateReadAttempts,
      maxStateReadAttempts: maxAttempts,
      lastStateReadError: lastReadError
    }
  );
}

function getDefinitiveCandyMachineStateError(
  input: SnapshotFinalizeRequest,
  onchain: CandyMachineOnchainState,
  verificationMethod: SnapshotVerificationMethod,
  foundAssets: number | null
): SnapshotVerificationError | null {
  if (onchain.collectionAddressOnchain !== input.mint.collectionAddress) {
    return buildCollectionMismatchError(input, onchain);
  }

  if (onchain.itemsAvailable !== input.mint.quantity || onchain.itemsLoaded > input.mint.quantity) {
    return buildCandyMachineQuantityMismatchError(input, onchain, verificationMethod, foundAssets);
  }

  return null;
}

function isDefinitiveVerificationError(error: SnapshotVerificationError | null): boolean {
  return (
    error?.code === "COLLECTION_ADDRESS_MISMATCH"
    || error?.code === "CANDY_MACHINE_QUANTITY_MISMATCH"
    || error?.code === "SIGNATURES_FAILED"
  );
}

async function resolveCandyMachineReadiness({
  input,
  initialOnchain,
  mintJobStatus,
  foundAssets,
  verificationMethod
}: {
  input: SnapshotFinalizeRequest;
  initialOnchain: CandyMachineOnchainState;
  mintJobStatus: MintJobSnapshotStatus;
  foundAssets: number | null;
  verificationMethod: SnapshotVerificationMethod;
}): Promise<{
  onchain: CandyMachineOnchainState;
  verificationStatus: SnapshotVerificationStatus;
  verificationError: SnapshotVerificationError | null;
}> {
  const retryConfig = getCandyMachineStateRetryConfig();
  let onchain = initialOnchain;
  let stateReadAttempts = 1;
  let lastReadError: string | null = null;

  while (true) {
    const definitiveError = getDefinitiveCandyMachineStateError(input, onchain, verificationMethod, foundAssets);
    if (definitiveError) {
      return {
        onchain,
        verificationStatus: "failed",
        verificationError: definitiveError
      };
    }

    if (onchain.itemsLoaded === input.mint.quantity) {
      return {
        onchain,
        verificationStatus: "verified",
        verificationError: null
      };
    }

    if (mintJobStatus !== "completed" || stateReadAttempts >= retryConfig.maxAttempts) {
      return {
        onchain,
        verificationStatus: "failed",
        verificationError: buildConfigLinesNotLoadedError({
          input,
          onchain,
          foundAssets,
          verificationMethod,
          stateReadAttempts,
          maxAttempts: retryConfig.maxAttempts,
          lastReadError
        })
      };
    }

    await wait(retryConfig.retryMs);
    stateReadAttempts += 1;

    try {
      onchain = await fetchOnchainCandyMachineState(input.mint.candyMachineAddress);
      lastReadError = null;
    } catch (error) {
      lastReadError = getErrorMessage(error);
    }
  }
}

async function countAssetsWithDasSafely(collectionAddress: string): Promise<number | null> {
  try {
    const dasResult = await countAssetsWithDas(collectionAddress);
    return dasResult.foundAssets;
  } catch {
    return null;
  }
}

async function resolveSnapshotVerificationAttempt(input: SnapshotFinalizeRequest): Promise<SnapshotVerificationAttempt> {
  const proofs = await enrichProofsWithSignatureStatus(input.mint.signatures);
  const mintJob = resolveMintJobStatus(input.mint.quantity, proofs);
  const verificationMethod: SnapshotVerificationMethod = "candy_machine_items_loaded";

  let onchain: CandyMachineOnchainState;
  try {
    onchain = await fetchOnchainCandyMachineState(input.mint.candyMachineAddress);
  } catch (error) {
    return {
      proofs,
      mintJob,
      onchain: null,
      foundAssets: null,
      verificationStatus: "failed",
      verificationError: buildOnchainReadUnavailableError(input, error),
      definitive: false
    };
  }

  const foundAssets = await countAssetsWithDasSafely(input.mint.collectionAddress);
  const readiness = await resolveCandyMachineReadiness({
    input,
    initialOnchain: onchain,
    mintJobStatus: mintJob.status,
    foundAssets,
    verificationMethod
  });

  let verificationStatus = readiness.verificationStatus;
  let verificationError = readiness.verificationError;

  const failedProofs = proofs.some((proof) => proof.confirmationStatus === "failed");
  const readinessIsDefinitive = isDefinitiveVerificationError(verificationError);

  if (failedProofs) {
    verificationStatus = "failed";
    verificationError = buildSignatureProofsFailedError(proofs);
  } else if (!readinessIsDefinitive && mintJob.status !== "completed") {
    verificationStatus = "failed";
    verificationError = buildSignatureProofsPendingError(proofs);
  }

  return {
    proofs,
    mintJob,
    onchain: readiness.onchain,
    foundAssets,
    verificationStatus,
    verificationError,
    definitive: isDefinitiveVerificationError(verificationError)
  };
}

async function resolveSnapshotVerificationWithRetry(input: SnapshotFinalizeRequest): Promise<{
  proofs: SignatureProof[];
  mintJob: MintJobResolution;
  onchain: CandyMachineOnchainState;
  foundAssets: number | null;
  verificationStatus: SnapshotVerificationStatus;
  verificationError: SnapshotVerificationError | null;
}> {
  const retryConfig = getSnapshotFinalizeRetryConfig();
  const startedAt = Date.now();
  let attempts = 0;
  let lastPersistableAttempt: SnapshotVerificationAttempt | null = null;
  let lastRecoverableError: SnapshotVerificationError | null = null;

  while (true) {
    attempts += 1;
    const attempt = await resolveSnapshotVerificationAttempt(input);

    if (attempt.onchain) {
      lastPersistableAttempt = attempt;
    }

    const canCreateAsset = attempt.mintJob.status === "completed" && attempt.verificationStatus === "verified";
    if (canCreateAsset || attempt.definitive) {
      if (!attempt.onchain) {
        throw new CoreCandyMachineSnapshotError(
          "SNAPSHOT_FINALIZE_TIMEOUT",
          "Mint snapshot could not be verified because Candy Machine state was unavailable.",
          503
        );
      }

      return {
        proofs: attempt.proofs,
        mintJob: attempt.mintJob,
        onchain: attempt.onchain,
        foundAssets: attempt.foundAssets,
        verificationStatus: attempt.verificationStatus,
        verificationError: attempt.verificationError
      };
    }

    lastRecoverableError = attempt.verificationError;
    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs >= retryConfig.maxWaitMs) {
      const finalAttempt = attempt.onchain ? attempt : lastPersistableAttempt;

      if (!finalAttempt?.onchain) {
        throw new CoreCandyMachineSnapshotError(
          "SNAPSHOT_FINALIZE_TIMEOUT",
          "Mint snapshot could not be verified because Candy Machine state was unavailable before the retry deadline.",
          503
        );
      }

      const timeoutError = withFinalizeRetryDetails(
        finalAttempt.verificationError ?? buildSnapshotFinalizeTimeoutError(lastRecoverableError),
        {
          attempts,
          elapsedMs,
          maxWaitMs: retryConfig.maxWaitMs,
          lastRecoverableCode: lastRecoverableError?.code ?? null
        }
      );

      return {
        proofs: finalAttempt.proofs,
        mintJob: finalAttempt.mintJob,
        onchain: finalAttempt.onchain,
        foundAssets: finalAttempt.foundAssets,
        verificationStatus: "failed",
        verificationError: timeoutError
      };
    }

    const remainingMs = retryConfig.maxWaitMs - elapsedMs;
    await wait(Math.min(retryConfig.retryMs, remainingMs));
  }
}

export async function finalizeCoreCandyMachineSnapshot(
  actorPubkey: string,
  rawInput: unknown
): Promise<FinalizeCoreCandyMachineSnapshotResult> {
  const normalizedActorPubkey = assertPublicKey(actorPubkey, "actorPubkey");
  const input = parseSnapshotFinalizeRequest(rawInput);

  const {
    proofs,
    mintJob,
    onchain,
    foundAssets,
    verificationStatus,
    verificationError
  } = await resolveSnapshotVerificationWithRetry(input);
  const verificationMethod: SnapshotVerificationMethod = "candy_machine_items_loaded";

  const canCreateAsset = mintJob.status === "completed" && verificationStatus === "verified";
  const marketplaceHandoffStatus: SnapshotMarketplaceHandoffStatus = canCreateAsset ? "ready" : "failed";
  const verifiedAt = canCreateAsset ? new Date().toISOString() : null;

  const emissionId = `core-cm:${input.draftId}:${input.mint.candyMachineAddress}`;
  const idempotencyKey = `core-cm-snapshot:${input.draftId}:${input.mint.candyMachineAddress}`;
  const lastError = verificationError?.message ?? (mintJob.status === "completed" ? null : "Mint proof status is not completed.");

  const mintJobRecord = await upsertMintJobFromSnapshot({
    emissionId,
    idempotencyKey,
    status: mintJob.status,
    totalItems: input.mint.quantity,
    submittedItems: mintJob.submittedItems,
    confirmedItems: mintJob.confirmedItems,
    failedItems: mintJob.failedItems,
    collectionAddress: input.mint.collectionAddress,
    lastError
  });

  const blockchainSnapshot: Record<string, unknown> = {
    ...onchain,
    collectionAddress: input.mint.collectionAddress,
    collectionNameConfigured: input.mint.collectionName,
    collectionUriConfigured: input.mint.collectionUri,
    assetNamePrefixConfigured: input.mint.assetNamePrefix,
    assetUriConfigured: input.mint.assetUri,
    startDateConfigured: input.mint.startDate,
    mintStatus: input.mint.status
  };

  const persisted = await upsertAssetMintSnapshot({
    mintJobId: mintJobRecord.id,
    draftId: input.draftId,
    createdBy: normalizedActorPubkey,
    collectionAddress: input.mint.collectionAddress,
    candyMachineAddress: input.mint.candyMachineAddress,
    expectedQuantity: input.mint.quantity,
    formSnapshot: input.formSnapshot,
    blockchainSnapshot,
    verificationMethod,
    verificationStatus,
    verificationErrorJson: verificationError,
    verifiedAt,
    marketplaceHandoffStatus,
    proofs
  });

  return {
    snapshotId: persisted.snapshotId,
    mintJobId: mintJobRecord.id,
    verificationStatus: persisted.verificationStatus,
    verificationMethod,
    marketplaceHandoffStatus: persisted.marketplaceHandoffStatus,
    expectedQuantity: input.mint.quantity,
    foundAssets,
    canCreateAsset,
    verificationError
  };
}
