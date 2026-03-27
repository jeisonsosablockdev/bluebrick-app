import { randomUUID } from "node:crypto";

import { createCollectionV2, mplCore } from "@metaplex-foundation/mpl-core";
import { addConfigLines, create, fetchCandyMachine, findCandyGuardPda, mintV1, mplCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { createNoopSigner, dateTime, generateSigner, publicKey, signerIdentity, type Signer, type Umi } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { Connection, PublicKey as Web3PublicKey, VersionedTransaction } from "@solana/web3.js";
import {
  deriveAssociatedTokenAddress,
  resolveUsdcMintAddress,
  resolveUsdcPaymentRecipient
} from "@/lib/candy-guard-payment-config";

import {
  CORE_CANDY_MACHINE_LIMITS,
  buildConfigLinePrefixName,
  deriveCoreCandyMachineNames,
  utf8ByteLength
} from "@/lib/core-candy-machine-naming";
import { createPurchaseThirdPartySigner, getPurchaseThirdPartySignerAddress } from "@/lib/purchase-third-party-signer";
import { getSolanaRpcUrl } from "@/lib/solana";

const MAX_TOTAL_ITEMS = 1000;
const MAX_MINT_PREPARE_ITEMS = 100;
const MAX_SUBMIT_TRANSACTIONS = 150;
const MIN_CONFIG_LINES_PER_TX = 8;
const MAX_CONFIG_LINES_PER_TX_SAFE = 48;
const SIGNATURE_CONFIRM_TIMEOUT_MS = 180_000;
const SIGNATURE_CONFIRM_POLL_MS = 1_500;
const RATE_LIMIT_BACKOFF_INITIAL_MS = 750;
const RATE_LIMIT_BACKOFF_MAX_MS = 8_000;
const SEND_TX_MAX_RETRIES = 4;
const SEND_TX_RETRY_INITIAL_MS = 500;
const SEND_TX_RETRY_MAX_MS = 4_000;
const MAX_URI_INPUT_LENGTH = 512;
const MAX_USDC_ATOMIC = 1_000_000_000_000;
const MAX_SOLANA_TX_RAW_BYTES = 1232;

type PreparedTransactionKind = "create-collection" | "create-candy-machine" | "add-config-lines" | "mint";

export type PrepareCandyMachineDeployInput = {
  payerPublicKey: string;
  collectionName: string;
  collectionUri: string;
  assetNamePrefix: string;
  assetUri: string;
  quantity: number;
  priceUsdcAtomic?: number;
  startDate: string;
  startSerial?: number;
};

export type PrepareCandyMachineMintInput = {
  payerPublicKey: string;
  candyMachineAddress: string;
  collectionAddress: string;
  quantity: number;
  serialOffset?: number;
};

export type PreparedCandyMachineTransaction = {
  kind: PreparedTransactionKind;
  label: string;
  serial: number | null;
  expectedAddress: string | null;
  transactionBase64: string;
};

export type PreparedCandyMachineDeploy = {
  network: "devnet";
  payerPublicKey: string;
  deployId: string;
  candyMachineAddress: string;
  collectionAddress: string;
  quantity: number;
  paymentMode: "USDC";
  priceUsdcAtomic: number | null;
  priceLamports: null;
  startDate: string;
  preparedAt: string;
  transactions: PreparedCandyMachineTransaction[];
};

export type PreparedCandyMachineMint = {
  network: "devnet";
  payerPublicKey: string;
  candyMachineAddress: string;
  collectionAddress: string;
  quantity: number;
  serialOffset: number;
  preparedAt: string;
  transactions: PreparedCandyMachineTransaction[];
};

export type SubmitSignedCandyMachineTransactionInput = {
  kind: PreparedTransactionKind;
  serial: number | null;
  expectedAddress: string | null;
  transactionBase64: string;
};

export type SubmitSignedCandyMachineTransactionsInput = {
  expectedPayerPublicKey: string;
  signedTransactions: SubmitSignedCandyMachineTransactionInput[];
};

export type SubmittedCandyMachineTransaction = {
  kind: PreparedTransactionKind;
  serial: number | null;
  expectedAddress: string | null;
  signature: string;
};

export type CoreCandyMachineSubmitRecoverableErrorCode = "BLOCKHASH_EXPIRED" | "CONFIRMATION_TIMEOUT";

export class CoreCandyMachineAdminInputError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CoreCandyMachineAdminInputError";
    this.status = status;
  }
}

export class CoreCandyMachineSubmitRecoverableError extends Error {
  readonly status: number;
  readonly code: CoreCandyMachineSubmitRecoverableErrorCode;

  constructor(message: string, code: CoreCandyMachineSubmitRecoverableErrorCode, status = 409) {
    super(message);
    this.name = "CoreCandyMachineSubmitRecoverableError";
    this.status = status;
    this.code = code;
  }
}

export function isCoreCandyMachineAdminInputError(error: unknown): error is CoreCandyMachineAdminInputError {
  return error instanceof CoreCandyMachineAdminInputError;
}

export function isCoreCandyMachineSubmitRecoverableError(error: unknown): error is CoreCandyMachineSubmitRecoverableError {
  return error instanceof CoreCandyMachineSubmitRecoverableError;
}

function assertNonEmptyString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new CoreCandyMachineAdminInputError(`${fieldName} must be a string.`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} exceeds max length (${maxLength}).`);
  }

  return trimmed;
}

function assertPublicKeyString(value: unknown, fieldName: string): string {
  const candidate = assertNonEmptyString(value, fieldName, 128);

  try {
    return new Web3PublicKey(candidate).toBase58();
  } catch {
    throw new CoreCandyMachineAdminInputError(`${fieldName} must be a valid Solana public key.`);
  }
}

function assertUri(value: unknown, fieldName: string): string {
  const uri = assertNonEmptyString(value, fieldName, MAX_URI_INPUT_LENGTH);

  try {
    const parsed = new URL(uri);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "https:" && protocol !== "ipfs:") {
      throw new CoreCandyMachineAdminInputError(`${fieldName} must use https:// or ipfs://.`);
    }
  } catch (error) {
    if (error instanceof CoreCandyMachineAdminInputError) {
      throw error;
    }

    throw new CoreCandyMachineAdminInputError(`${fieldName} must be a valid URI.`);
  }

  return uri;
}

function assertMaxUtf8Bytes(value: string, fieldName: string, maxBytes: number): string {
  if (utf8ByteLength(value) > maxBytes) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} exceeds max UTF-8 byte length (${maxBytes}).`);
  }

  return value;
}

function normalizeMetadataUri(uri: string): string {
  const parsed = new URL(uri);

  if (!parsed.search && !parsed.hash) {
    return uri;
  }

  // Metadata URIs should be stable/public. Query/hash commonly carry temporary tokens.
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function assertPositiveInteger(value: unknown, fieldName: string, maxValue: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} must be an integer.`);
  }

  if (value < 1) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} must be greater than zero.`);
  }

  if (value > maxValue) {
    throw new CoreCandyMachineAdminInputError(`${fieldName} exceeds max value (${maxValue}).`);
  }

  return value;
}

function buildConfigLineSuffix(serial: number): string {
  return String(serial);
}

function extractUriTemplate(assetUri: string): { prefixUri: string; suffix: string } | null {
  const markers = ["{serial}", "{id}", "$ID+1$"];

  for (const marker of markers) {
    const markerIndex = assetUri.indexOf(marker);
    if (markerIndex <= 0) {
      continue;
    }

    const prefixUri = assetUri.slice(0, markerIndex);
    const suffix = assetUri.slice(markerIndex + marker.length);
    return { prefixUri, suffix };
  }

  return null;
}

function buildConfigLineOptimization(input: {
  assetNamePrefix: string;
  assetUri: string;
  startSerial: number;
  quantity: number;
}): {
  configLineSettings: {
    prefixName: string;
    nameLength: number;
    prefixUri: string;
    uriLength: number;
    isSequential: true;
  };
  buildName: (serial: number) => string;
  buildUri: (serial: number) => string;
} {
  const maxSerial = input.startSerial + input.quantity - 1;
  const nameLength = Math.max(1, String(maxSerial).length);
  const prefixName = buildConfigLinePrefixName(input.assetNamePrefix);
  const nameWindowBytes = utf8ByteLength(prefixName) + nameLength;

  if (nameWindowBytes > CORE_CANDY_MACHINE_LIMITS.maxConfigLineTotalNameBytes) {
    throw new CoreCandyMachineAdminInputError(
      `assetNamePrefix is too long for serial range (max ${CORE_CANDY_MACHINE_LIMITS.maxConfigLineTotalNameBytes} UTF-8 bytes including suffix).`
    );
  }

  const uriTemplate = extractUriTemplate(input.assetUri);

  if (uriTemplate) {
    const uriLength = Math.max(1, utf8ByteLength(`${maxSerial}${uriTemplate.suffix}`));
    const totalUriBytes = utf8ByteLength(uriTemplate.prefixUri) + uriLength;

    if (totalUriBytes > CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes) {
      throw new CoreCandyMachineAdminInputError(
        `assetUri exceeds max config line URI byte window (${CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes}).`
      );
    }

    return {
      configLineSettings: {
        prefixName,
        nameLength,
        prefixUri: uriTemplate.prefixUri,
        uriLength,
        isSequential: true
      },
      buildName: (serial) => buildConfigLineSuffix(serial),
      buildUri: (serial) => `${serial}${uriTemplate.suffix}`
    };
  }

  // Most metadata providers (including Pinata) use one stable JSON URI template for all mints.
  // Packing the full URI into prefixUri and keeping per-line URI suffix empty drastically reduces tx size.
  if (utf8ByteLength(input.assetUri) > CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes) {
    throw new CoreCandyMachineAdminInputError(
      `assetUri exceeds max config line URI byte window (${CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes}).`
    );
  }

  return {
    configLineSettings: {
      prefixName,
      nameLength,
      prefixUri: input.assetUri,
      uriLength: 0,
      isSequential: true
    },
    buildName: (serial) => buildConfigLineSuffix(serial),
    buildUri: () => ""
  };
}

function determineConfigLinesPerTx(config: {
  nameLength: number;
  uriLength: number;
}): number {
  if (config.uriLength === 0 && config.nameLength <= 4) {
    return 220;
  }

  if (config.uriLength <= 8 && config.nameLength <= 6) {
    return 160;
  }

  if (config.uriLength <= 16 && config.nameLength <= 8) {
    return 112;
  }

  if (config.uriLength <= 24 && config.nameLength <= 10) {
    return 72;
  }

  return 32;
}

function isConfigLineChunkTooLargeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("encoding overruns uint8array")
    || message.includes("transaction too large")
    || message.includes("message too large")
    || message.includes("versionedtransaction too large");
}

function createServerUmi(payerPublicKey: string): { umi: Umi; payerSigner: Signer } {
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore()).use(mplCandyMachine());
  const payerSigner = createNoopSigner(publicKey(payerPublicKey));

  umi.use(signerIdentity(payerSigner, true));
  return { umi, payerSigner };
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64Value: string): Buffer {
  try {
    return Buffer.from(base64Value, "base64");
  } catch {
    throw new CoreCandyMachineAdminInputError("transactionBase64 is not valid base64.");
  }
}

function isTransactionWithinSizeLimit(transactionBase64: string): boolean {
  return fromBase64(transactionBase64).length <= MAX_SOLANA_TX_RAW_BYTES;
}

type TransactionBuilderLike = {
  buildAndSign: (umi: Umi) => Promise<unknown>;
  setBlockhash?: (blockhash: any) => TransactionBuilderLike;
};

async function serializeSignedBuilderTransaction(
  umi: Umi,
  buildPromise: Promise<TransactionBuilderLike> | TransactionBuilderLike,
  blockhash?: any
): Promise<string> {
  const builder = await Promise.resolve(buildPromise);
  const builderWithBlockhash = blockhash && typeof builder.setBlockhash === "function"
    ? builder.setBlockhash(blockhash)
    : builder;
  const umiTransaction = await builderWithBlockhash.buildAndSign(umi);
  const web3Transaction = toWeb3JsTransaction(umiTransaction as never);
  return toBase64(web3Transaction.serialize());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("429")
    || message.includes("too many requests")
    || message.includes("fetch failed")
    || message.includes("failed to fetch")
    || message.includes("timed out")
    || message.includes("timeout")
    || message.includes("socket hang up")
    || message.includes("econnreset")
    || message.includes("etimedout");
}

function isBlockhashExpiredRpcError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("blockhash not found");
}

function resolveDeployPriceUsdcAtomic(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new CoreCandyMachineAdminInputError("priceUsdcAtomic must be an integer.");
  }

  if (value < 1) {
    throw new CoreCandyMachineAdminInputError("priceUsdcAtomic must be greater than zero.");
  }

  if (value > MAX_USDC_ATOMIC) {
    throw new CoreCandyMachineAdminInputError(`priceUsdcAtomic exceeds max value (${MAX_USDC_ATOMIC}).`);
  }

  return value;
}

async function sendRawTransactionWithRetry(connection: Connection, serializedTransaction: Uint8Array): Promise<string> {
  let attempt = 0;
  let delayMs = SEND_TX_RETRY_INITIAL_MS;

  while (attempt <= SEND_TX_MAX_RETRIES) {
    try {
      return await connection.sendRawTransaction(serializedTransaction, {
        skipPreflight: true,
        maxRetries: 3
      });
    } catch (error) {
      if (isBlockhashExpiredRpcError(error)) {
        throw new CoreCandyMachineSubmitRecoverableError(
          "Transaction blockhash expired before submission. Prepare and sign fresh transactions.",
          "BLOCKHASH_EXPIRED"
        );
      }

      if (!isTransientRpcError(error) || attempt === SEND_TX_MAX_RETRIES) {
        throw error;
      }

      await sleep(delayMs);
      delayMs = Math.min(SEND_TX_RETRY_MAX_MS, delayMs * 2);
      attempt += 1;
    }
  }

  throw new Error("Could not send transaction after retry attempts.");
}

function validateDeployInput(input: PrepareCandyMachineDeployInput): PrepareCandyMachineDeployInput {
  const payerPublicKey = assertPublicKeyString(input.payerPublicKey, "payerPublicKey");
  const candidateCollectionName = assertNonEmptyString(input.collectionName, "collectionName", 256);
  const candidateAssetNamePrefix = assertNonEmptyString(input.assetNamePrefix, "assetNamePrefix", 256);
  const quantity = assertPositiveInteger(input.quantity, "quantity", MAX_TOTAL_ITEMS);
  const startSerial = input.startSerial === undefined ? 1 : assertPositiveInteger(input.startSerial, "startSerial", 1_000_000);
  const collectionUri = assertMaxUtf8Bytes(
    normalizeMetadataUri(assertUri(input.collectionUri, "collectionUri")),
    "collectionUri",
    CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes
  );
  const assetUri = assertMaxUtf8Bytes(
    normalizeMetadataUri(assertUri(input.assetUri, "assetUri")),
    "assetUri",
    CORE_CANDY_MACHINE_LIMITS.maxConfigLineUriBytes
  );
  const derivedNames = deriveCoreCandyMachineNames({
    collectionSource: candidateCollectionName,
    assetPrefixSource: candidateAssetNamePrefix,
    quantity,
    startSerial
  });

  if (typeof input.startDate !== "string" || !input.startDate.trim()) {
    throw new CoreCandyMachineAdminInputError("startDate is required and must be an ISO date string.");
  }

  const parsedStartDate = new Date(input.startDate);
  if (Number.isNaN(parsedStartDate.getTime())) {
    throw new CoreCandyMachineAdminInputError("startDate must be a valid ISO date string.");
  }

  const priceUsdcAtomic = resolveDeployPriceUsdcAtomic(input.priceUsdcAtomic);

  return {
    payerPublicKey,
    collectionName: derivedNames.collectionName,
    collectionUri,
    assetNamePrefix: derivedNames.assetNamePrefix,
    assetUri,
    quantity,
    priceUsdcAtomic,
    startDate: parsedStartDate.toISOString(),
    startSerial
  };
}

function validateMintPrepareInput(input: PrepareCandyMachineMintInput): PrepareCandyMachineMintInput {
  const payerPublicKey = assertPublicKeyString(input.payerPublicKey, "payerPublicKey");
  const candyMachineAddress = assertPublicKeyString(input.candyMachineAddress, "candyMachineAddress");
  const collectionAddress = assertPublicKeyString(input.collectionAddress, "collectionAddress");
  const quantity = assertPositiveInteger(input.quantity, "quantity", MAX_MINT_PREPARE_ITEMS);
  const serialOffset = input.serialOffset === undefined ? 0 : assertPositiveInteger(input.serialOffset + 1, "serialOffset+1", 1_000_000) - 1;

  return {
    payerPublicKey,
    candyMachineAddress,
    collectionAddress,
    quantity,
    serialOffset
  };
}

function validateSubmitInput(input: SubmitSignedCandyMachineTransactionsInput): SubmitSignedCandyMachineTransactionsInput {
  const expectedPayerPublicKey = assertPublicKeyString(input.expectedPayerPublicKey, "expectedPayerPublicKey");

  if (!Array.isArray(input.signedTransactions) || input.signedTransactions.length === 0) {
    throw new CoreCandyMachineAdminInputError("signedTransactions must be a non-empty array.");
  }

  if (input.signedTransactions.length > MAX_SUBMIT_TRANSACTIONS) {
    throw new CoreCandyMachineAdminInputError(`signedTransactions exceeds max value (${MAX_SUBMIT_TRANSACTIONS}).`);
  }

  const signedTransactions = input.signedTransactions.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new CoreCandyMachineAdminInputError(`signedTransactions[${index}] must be an object.`);
    }

    if (
      entry.kind !== "create-collection" &&
      entry.kind !== "create-candy-machine" &&
      entry.kind !== "add-config-lines" &&
      entry.kind !== "mint"
    ) {
      throw new CoreCandyMachineAdminInputError(`signedTransactions[${index}].kind is invalid.`);
    }

    const transactionBase64 = assertNonEmptyString(entry.transactionBase64, `signedTransactions[${index}].transactionBase64`, 200_000);
    const serial = entry.serial === null || entry.serial === undefined
      ? null
      : assertPositiveInteger(entry.serial, `signedTransactions[${index}].serial`, 1_000_000);
    const expectedAddress = entry.expectedAddress === null || entry.expectedAddress === undefined
      ? null
      : assertPublicKeyString(entry.expectedAddress, `signedTransactions[${index}].expectedAddress`);

    return {
      kind: entry.kind,
      serial,
      expectedAddress,
      transactionBase64
    };
  });

  return {
    expectedPayerPublicKey,
    signedTransactions
  };
}

export async function prepareCoreCandyMachineDeploy(rawInput: PrepareCandyMachineDeployInput): Promise<PreparedCandyMachineDeploy> {
  const input = validateDeployInput(rawInput);
  const { umi, payerSigner } = createServerUmi(input.payerPublicKey);
  const latestBlockhash = await umi.rpc.getLatestBlockhash();
  const thirdPartySignerAddress = getPurchaseThirdPartySignerAddress();
  const usdcMintAddress = resolveUsdcMintAddress();
  const usdcRecipient = resolveUsdcPaymentRecipient();
  const usdcDestinationAta = deriveAssociatedTokenAddress(usdcRecipient, usdcMintAddress);
  const configLineOptimization = buildConfigLineOptimization({
    assetNamePrefix: input.assetNamePrefix,
    assetUri: input.assetUri,
    startSerial: input.startSerial ?? 1,
    quantity: input.quantity
  });

  const collectionSigner = generateSigner(umi);
  const candyMachineSigner = generateSigner(umi);
  const deployId = randomUUID();
  const transactions: PreparedCandyMachineTransaction[] = [];
  const configLinesPerTx = Math.min(
    MAX_CONFIG_LINES_PER_TX_SAFE,
    Math.max(MIN_CONFIG_LINES_PER_TX, determineConfigLinesPerTx(configLineOptimization.configLineSettings))
  );

  const createCollectionBuilder = createCollectionV2(umi, {
    collection: collectionSigner,
    updateAuthority: payerSigner.publicKey,
    payer: payerSigner,
    name: input.collectionName,
    uri: input.collectionUri
  });

  transactions.push({
    kind: "create-collection",
    label: "Create Core Collection",
    serial: null,
    expectedAddress: collectionSigner.publicKey,
    transactionBase64: await serializeSignedBuilderTransaction(umi, createCollectionBuilder, latestBlockhash)
  });

  const guardSet = {
    startDate: {
      date: dateTime(input.startDate)
    },
    tokenPayment: {
      amount: BigInt(input.priceUsdcAtomic ?? 0),
      mint: publicKey(usdcMintAddress),
      destinationAta: publicKey(usdcDestinationAta)
    },
    thirdPartySigner: {
      signerKey: publicKey(thirdPartySignerAddress)
    }
  };

  const createCandyMachineBuilder = create(umi, {
    candyMachine: candyMachineSigner,
    collection: collectionSigner.publicKey,
    collectionUpdateAuthority: payerSigner,
    itemsAvailable: BigInt(input.quantity),
    configLineSettings: configLineOptimization.configLineSettings,
    guards: guardSet,
    groups: []
  });

  transactions.push({
    kind: "create-candy-machine",
    label: "Create Core Candy Machine + Guard",
    serial: null,
    expectedAddress: candyMachineSigner.publicKey,
    transactionBase64: await serializeSignedBuilderTransaction(umi, createCandyMachineBuilder, latestBlockhash)
  });

  let offset = 0;
  let chunkTarget = configLinesPerTx;

  while (offset < input.quantity) {
    const maxChunkCandidate = Math.min(chunkTarget, input.quantity - offset);
    let low = 1;
    let high = maxChunkCandidate;
    let selectedChunkCount = 0;
    let serializedTransactionBase64: string | null = null;
    let lastError: unknown = null;

    while (low <= high) {
      const chunkCount = Math.floor((low + high) / 2);
      const configLines = Array.from({ length: chunkCount }, (_, index) => {
        const serial = (input.startSerial ?? 1) + offset + index;
        return {
          name: configLineOptimization.buildName(serial),
          uri: configLineOptimization.buildUri(serial)
        };
      });

      const addConfigLinesBuilder = addConfigLines(umi, {
        candyMachine: candyMachineSigner.publicKey,
        authority: payerSigner,
        index: offset,
        configLines
      });

      try {
        const serialized = await serializeSignedBuilderTransaction(umi, addConfigLinesBuilder, latestBlockhash);
        if (!isTransactionWithinSizeLimit(serialized)) {
          high = chunkCount - 1;
          continue;
        }

        serializedTransactionBase64 = serialized;
        selectedChunkCount = chunkCount;
        low = chunkCount + 1;
      } catch (error) {
        lastError = error;
        if (!isConfigLineChunkTooLargeError(error)) {
          throw error;
        }

        high = chunkCount - 1;
      }
    }

    if (!serializedTransactionBase64) {
      if (lastError instanceof Error) {
        throw lastError;
      }

      throw new Error("Could not serialize add-config-lines transaction.");
    }

    transactions.push({
      kind: "add-config-lines",
      label: `Load config lines ${offset + 1}-${offset + selectedChunkCount}`,
      serial: null,
      expectedAddress: candyMachineSigner.publicKey,
      transactionBase64: serializedTransactionBase64
    });

    chunkTarget = selectedChunkCount;
    offset += selectedChunkCount;
  }

  return {
    network: "devnet",
    payerPublicKey: input.payerPublicKey,
    deployId,
    candyMachineAddress: candyMachineSigner.publicKey,
    collectionAddress: collectionSigner.publicKey,
    quantity: input.quantity,
    paymentMode: "USDC",
    priceUsdcAtomic: input.priceUsdcAtomic ?? null,
    priceLamports: null,
    startDate: input.startDate,
    preparedAt: new Date().toISOString(),
    transactions
  };
}

export async function prepareCoreCandyMachineMint(rawInput: PrepareCandyMachineMintInput): Promise<PreparedCandyMachineMint> {
  const input = validateMintPrepareInput(rawInput);
  const { umi, payerSigner } = createServerUmi(input.payerPublicKey);
  const latestBlockhash = await umi.rpc.getLatestBlockhash();
  const usdcMintAddress = resolveUsdcMintAddress();
  const usdcRecipient = resolveUsdcPaymentRecipient();
  const usdcDestinationAta = deriveAssociatedTokenAddress(usdcRecipient, usdcMintAddress);
  const candyMachineAddress = publicKey(input.candyMachineAddress);
  const collectionAddress = publicKey(input.collectionAddress);
  const thirdPartySigner = createPurchaseThirdPartySigner(umi);
  const candyMachineAccount = await fetchCandyMachine(umi, candyMachineAddress);
  const candyMachineAuthority = String(candyMachineAccount.authority ?? "");

  if (candyMachineAuthority !== String(payerSigner.publicKey)) {
    throw new CoreCandyMachineAdminInputError("Connected admin is not the candy machine authority.", 403);
  }

  const candyGuard = findCandyGuardPda(umi, {
    base: candyMachineAddress
  });
  const transactions: PreparedCandyMachineTransaction[] = [];

  const serialOffset = input.serialOffset ?? 0;

  for (let index = 0; index < input.quantity; index += 1) {
    const serial = serialOffset + index + 1;
    const assetSigner = generateSigner(umi);

    const mintBuilder = mintV1(umi, {
      candyMachine: candyMachineAddress,
      candyGuard,
      collection: collectionAddress,
      payer: payerSigner,
      minter: payerSigner,
      owner: payerSigner.publicKey,
      asset: assetSigner,
      mintArgs: {
        tokenPayment: {
          mint: publicKey(usdcMintAddress),
          destinationAta: publicKey(usdcDestinationAta)
        },
        thirdPartySigner: {
          signer: thirdPartySigner
        }
      }
    });

    transactions.push({
      kind: "mint",
      label: `Mint NFT #${serial}`,
      serial,
      expectedAddress: assetSigner.publicKey,
      transactionBase64: await serializeSignedBuilderTransaction(umi, mintBuilder, latestBlockhash)
    });
  }

  return {
    network: "devnet",
    payerPublicKey: input.payerPublicKey,
    candyMachineAddress: input.candyMachineAddress,
    collectionAddress: input.collectionAddress,
    quantity: input.quantity,
    serialOffset,
    preparedAt: new Date().toISOString(),
    transactions
  };
}

function parseSignedTransaction(transactionBase64: string): VersionedTransaction {
  const raw = fromBase64(transactionBase64);

  if (!raw.length) {
    throw new CoreCandyMachineAdminInputError("transactionBase64 cannot be empty.");
  }

  try {
    return VersionedTransaction.deserialize(raw);
  } catch {
    throw new CoreCandyMachineAdminInputError("Signed transaction payload is invalid.");
  }
}

function assertPayerMatches(transaction: VersionedTransaction, expectedPayerPublicKey: string): void {
  const payer = transaction.message.staticAccountKeys[0];

  if (!payer || !(payer instanceof Web3PublicKey)) {
    throw new CoreCandyMachineAdminInputError("Could not determine transaction payer.");
  }

  if (payer.toBase58() !== expectedPayerPublicKey) {
    throw new CoreCandyMachineAdminInputError("Signed transaction payer does not match authenticated admin.", 403);
  }
}

async function waitForConfirmedSignature(connection: Connection, signature: string): Promise<void> {
  const startedAt = Date.now();
  let rateLimitBackoffMs = RATE_LIMIT_BACKOFF_INITIAL_MS;

  while (Date.now() - startedAt < SIGNATURE_CONFIRM_TIMEOUT_MS) {
    let statuses: Awaited<ReturnType<Connection["getSignatureStatuses"]>>;
    try {
      statuses = await connection.getSignatureStatuses([signature]);
      rateLimitBackoffMs = RATE_LIMIT_BACKOFF_INITIAL_MS;
    } catch (error) {
      if (!isTransientRpcError(error)) {
        throw error;
      }

      await sleep(rateLimitBackoffMs);
      rateLimitBackoffMs = Math.min(RATE_LIMIT_BACKOFF_MAX_MS, rateLimitBackoffMs * 2);
      continue;
    }

    const status = statuses.value[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }

    await sleep(SIGNATURE_CONFIRM_POLL_MS);
  }

  let finalStatus: Awaited<ReturnType<Connection["getSignatureStatuses"]>>["value"][number] | null = null;
  try {
    const statuses = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    finalStatus = statuses.value[0];
  } catch (error) {
    if (!isTransientRpcError(error)) {
      throw error;
    }
  }

  if (finalStatus?.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(finalStatus.err)}`);
  }

  if (finalStatus?.confirmationStatus === "confirmed" || finalStatus?.confirmationStatus === "finalized") {
    return;
  }

  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    });

    if (transaction?.meta?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(transaction.meta.err)}`);
    }

    if (transaction) {
      return;
    }
  } catch (error) {
    if (!isTransientRpcError(error)) {
      throw error;
    }
  }

  throw new CoreCandyMachineSubmitRecoverableError(
    `Timed out waiting for signature confirmation: ${signature}. The network may still confirm it; verify the signature and retry only pending transactions.`,
    "CONFIRMATION_TIMEOUT",
    409
  );
}

export async function submitCoreCandyMachineSignedTransactions(rawInput: SubmitSignedCandyMachineTransactionsInput): Promise<SubmittedCandyMachineTransaction[]> {
  const input = validateSubmitInput(rawInput);
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const results: SubmittedCandyMachineTransaction[] = [];
  const deferredConfirmations: string[] = [];

  for (const [index, signed] of input.signedTransactions.entries()) {
    try {
      const transaction = parseSignedTransaction(signed.transactionBase64);
      assertPayerMatches(transaction, input.expectedPayerPublicKey);
      const serializedTransaction = transaction.serialize();

      const signature = await sendRawTransactionWithRetry(connection, serializedTransaction);
      const mustConfirmImmediately = signed.kind === "create-collection" || signed.kind === "create-candy-machine";

      if (mustConfirmImmediately) {
        await waitForConfirmedSignature(connection, signature);
      } else {
        deferredConfirmations.push(signature);
      }

      results.push({
        kind: signed.kind,
        serial: signed.serial,
        expectedAddress: signed.expectedAddress,
        signature
      });
    } catch (error) {
      if (isCoreCandyMachineSubmitRecoverableError(error)) {
        throw new CoreCandyMachineSubmitRecoverableError(
          `${error.message} Failed on transaction ${index + 1}/${input.signedTransactions.length}.`,
          error.code,
          error.status
        );
      }

      throw error;
    }
  }

  for (const signature of deferredConfirmations) {
    await waitForConfirmedSignature(connection, signature);
  }

  return results;
}
