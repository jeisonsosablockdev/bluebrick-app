import { addPlugin, fetchAsset, mplCore } from "@metaplex-foundation/mpl-core";
import {
  fetchCandyMachine,
  findCandyGuardPda,
  mintV1,
  mplCandyMachine,
  safeFetchCandyGuard
} from "@metaplex-foundation/mpl-core-candy-machine";
import {
  createNoopSigner,
  generateSigner,
  publicKey,
  signerIdentity,
  transactionBuilder,
  type Umi
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import type { PoolClient } from "pg";

import {
  createPurchaseAttempt,
  getPurchaseAttemptByWalletAndIdempotency,
  isPurchaseAttemptsDatabaseConfigured,
  markPurchaseAttemptConfirmed,
  markPurchaseAttemptPrepared,
  markPurchaseAttemptFailed,
  markPurchaseAttemptSubmitted
} from "@/lib/purchase-attempts-repository";
import {
  assertPurchaseRateLimit,
  issuePurchaseChallenge,
  PurchaseAntiBotError,
  verifyAndConsumePurchaseChallenge
} from "@/lib/purchase-anti-bot";
import { withDbClient } from "@/lib/db/pool";
import { getMarketplacePropertyDetailOrThrowRpc } from "@/lib/property-marketplace-server";
import { createPurchaseThirdPartySigner } from "@/lib/purchase-third-party-signer";
import { getSolanaRpcUrl } from "@/lib/solana";
import {
  convertUmiTransactionToLegacyVersionedTransaction,
  createKitRpcConnection,
  deserializeLegacyVersionedTransaction,
  getLegacyTransactionPayer,
  getLegacyTransactionRequiredSignerCount,
  getLegacyTransactionSignatureAt,
  getLegacyTransactionStaticAccountKeys,
  getSignatureStatusWithKitRpc,
  normalizeLegacyPublicKey,
  sendRawTransactionWithKitRpc,
  serializeLegacyVersionedMessage,
  serializeLegacyVersionedTransaction,
  type KitRpcConnection,
  type LegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";
import {
  getMplCoreAssetCollection,
  getMplCoreAssetOwner,
  hasOwnerFreezeDelegatePlugin
} from "@/lib/mpl-core-freeze-delegate";
import { generateUuidV7 } from "@/lib/uuid-v7";

export type PurchaseErrorCode =
  | "MINT_NOT_STARTED"
  | "SOLD_OUT"
  | "PRICE_CHANGED"
  | "INVALID_QUANTITY"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_CHALLENGE"
  | "RATE_LIMITED"
  | "TRANSACTION_FAILED"
  | "UNAUTHORIZED"
  | "COMPLIANCE_RESTRICTED";

export type PurchaseQuantityMode = "SINGLE_ONLY" | "MULTI_ENABLED";
export type PurchasePaymentCurrency = "SOL" | "USDC";

type GuardSnapshot = {
  candyMachineAddress: string;
  collectionAddress: string;
  candyGuardAddress: string | null;
  thirdPartySignerKey: string | null;
  startDateUnix: number | null;
  startDateIso: string | null;
  paymentCurrency: PurchasePaymentCurrency | null;
  priceLamports: number | null;
  priceUsdcAtomic: number | null;
  solPaymentDestination: string | null;
  tokenPaymentDestinationAta: string | null;
  tokenPaymentMint: string | null;
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  fetchedAt: string;
};

type QuoteCacheEntry = {
  snapshot: GuardSnapshot;
  expiresAt: number;
};

type PreparePurchaseInput = {
  propertyId: string;
  buyerPublicKey: string;
  quantity?: number;
  quotedPriceLamports?: number;
  quotedPriceUsdcAtomic?: number;
  challengeId: string;
  challengeSignatureBase64: string;
  clientIp: string;
};

type SubmitPurchaseInput = {
  attemptId: string;
  idempotencyKey: string;
  buyerPublicKey: string;
  signedTransactionBase64: string;
};

export type PurchaseQuoteResult = {
  propertyId: string;
  quantityMode: PurchaseQuantityMode;
  quantity: number;
  paymentCurrency: PurchasePaymentCurrency;
  totalPriceLamports: number | null;
  totalPriceUsdcAtomic: number | null;
  candyMachineAddress: string;
  collectionAddress: string;
  cacheUpdatedAt: string;
  priceLamports: number | null;
  priceUsdcAtomic: number | null;
  startDateIso: string | null;
  itemsRemaining: number;
  itemsAvailable: number;
  itemsRedeemed: number;
};

export type PurchasePrepareResult = {
  attemptId: string;
  idempotencyKey: string;
  propertyId: string;
  quantityMode: PurchaseQuantityMode;
  quantity: number;
  network: "devnet";
  paymentCurrency: PurchasePaymentCurrency;
  candyMachineAddress: string;
  collectionAddress: string;
  priceLamports: number | null;
  totalPriceLamports: number | null;
  priceUsdcAtomic: number | null;
  totalPriceUsdcAtomic: number | null;
  cacheUpdatedAt: string;
  preparedAt: string;
  transactionBase64: string;
  expectedAssetAddress: string;
  expectedAssetAddresses: string[];
};

export type PurchaseSubmitResult = {
  attemptId: string;
  status: "submitted" | "confirmed";
  txSignature: string;
  submittedAt: string;
};

export type PurchaseChallengeResult = {
  propertyId: string;
  quantityMode: PurchaseQuantityMode;
  quantity: number;
  challengeId: string;
  nonce: string;
  message: string;
  expiresAt: string;
};

export class PurchaseFlowError extends Error {
  readonly code: PurchaseErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: PurchaseErrorCode, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "PurchaseFlowError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const QUOTE_CACHE_TTL_MS = 45_000;
const PURCHASE_ATTEMPT_IDEMPOTENCY_TTL_MS = 5 * 60 * 1_000;
const PURCHASE_SUBMIT_CONFIRMATION_POLLS = 10;
const PURCHASE_SUBMIT_CONFIRMATION_DELAY_MS = 1_000;
const PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS_DEFAULT = 24;
const PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS_LIMIT = 120;
const PURCHASE_ASSET_VERIFICATION_RETRY_MS_DEFAULT = 1_500;
const PURCHASE_ASSET_VERIFICATION_RETRY_MS_LIMIT = 5_000;
const DEFAULT_PURCHASE_QUANTITY_MODE: PurchaseQuantityMode = "MULTI_ENABLED";
const DEFAULT_MAX_PURCHASE_QUANTITY = 10;
const quoteCache = new Map<string, QuoteCacheEntry>();
const quoteInFlight = new Map<string, Promise<GuardSnapshot>>();

function readBoundedIntegerEnv(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export function getPurchaseAssetVerificationRetryConfig(
  env: Record<string, string | undefined> = process.env
): { maxAttempts: number; retryDelayMs: number } {
  return {
    maxAttempts: readBoundedIntegerEnv(
      env,
      "PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS",
      PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS_DEFAULT,
      1,
      PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS_LIMIT
    ),
    retryDelayMs: readBoundedIntegerEnv(
      env,
      "PURCHASE_ASSET_VERIFICATION_RETRY_MS",
      PURCHASE_ASSET_VERIFICATION_RETRY_MS_DEFAULT,
      0,
      PURCHASE_ASSET_VERIFICATION_RETRY_MS_LIMIT
    )
  };
}

export function invalidatePurchaseQuoteCache(candyMachineAddress?: string): void {
  const normalized = typeof candyMachineAddress === "string" ? candyMachineAddress.trim() : "";

  if (!normalized) {
    quoteCache.clear();
    quoteInFlight.clear();
    return;
  }

  quoteCache.delete(normalized);
  quoteInFlight.delete(normalized);
}

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1_000);
}

function toInteger(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
}

function isOptionShape(value: unknown): value is { __option?: "Some" | "None"; value?: unknown } {
  return Boolean(value) && typeof value === "object";
}

function unwrapOption<T>(value: unknown): T | null {
  if (!isOptionShape(value)) {
    return null;
  }

  if (value.__option === "Some") {
    return (value.value as T) ?? null;
  }

  return null;
}

export function amountToLamports(value: unknown): number | null {
  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.floor(value) : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const basisPoints = (value as { basisPoints?: unknown }).basisPoints;
  if (typeof basisPoints === "undefined") {
    return null;
  }

  return amountToLamports(basisPoints);
}

export function resolvePreparedPriceLamports(
  paymentCurrency: PurchasePaymentCurrency,
  priceLamports: number | null
): number {
  if (paymentCurrency !== "SOL") {
    return 0;
  }

  if (typeof priceLamports !== "number" || !Number.isFinite(priceLamports) || priceLamports < 0) {
    return 0;
  }

  return Math.floor(priceLamports);
}

function parsePublicKey(raw: string, fieldName: string): string {
  try {
    return normalizeLegacyPublicKey(raw);
  } catch {
    throw new PurchaseFlowError("TRANSACTION_FAILED", `${fieldName} is not a valid Solana public key.`, 400);
  }
}

function mapAntiBotError(error: PurchaseAntiBotError): PurchaseFlowError {
  return new PurchaseFlowError(error.code, error.message, error.status, error.details);
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64Value: string): Buffer {
  try {
    return Buffer.from(base64Value, "base64");
  } catch {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Signed transaction is not valid base64.", 400);
  }
}

export function evaluateMintAvailability(
  input: {
    startDateUnix: number | null;
    itemsRemaining: number;
  },
  nowSeconds: number
): PurchaseFlowError | null {
  if (input.startDateUnix !== null && input.startDateUnix > nowSeconds) {
    return new PurchaseFlowError(
      "MINT_NOT_STARTED",
      "Mint has not started yet.",
      409,
      { startDateUnix: input.startDateUnix }
    );
  }

  if (input.itemsRemaining <= 0) {
    return new PurchaseFlowError("SOLD_OUT", "Candy Machine is sold out.", 409);
  }

  return null;
}

export function mapSubmitErrorToPurchaseError(error: unknown): PurchaseFlowError {
  if (error instanceof PurchaseFlowError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Transaction failed.";
  const normalized = message.toLowerCase();

  if (normalized.includes("insufficient funds")) {
    return new PurchaseFlowError("INSUFFICIENT_FUNDS", "Insufficient balance for mint and network fees.", 409);
  }

  return new PurchaseFlowError("TRANSACTION_FAILED", message, 500);
}

async function fetchGuardSnapshot(candyMachineAddressRaw: string, fallbackCollectionAddress: string): Promise<GuardSnapshot> {
  const candyMachineAddress = parsePublicKey(candyMachineAddressRaw, "candyMachineAddress");
  const collectionAddress = parsePublicKey(fallbackCollectionAddress, "collectionAddress");
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore()).use(mplCandyMachine());
  const candyMachine = await fetchCandyMachine(umi, publicKey(candyMachineAddress));
  const guardPda = findCandyGuardPda(umi, { base: publicKey(candyMachineAddress) });
  const candyGuard = await safeFetchCandyGuard(umi, guardPda);

  const startDateGuard = unwrapOption<{ date?: unknown }>(candyGuard?.guards?.startDate);
  const startDateUnix = startDateGuard ? toInteger(startDateGuard.date) : null;
  const solPayment = unwrapOption<{ lamports?: unknown; destination?: unknown }>(candyGuard?.guards?.solPayment);
  const tokenPayment = unwrapOption<{ amount?: unknown; destinationAta?: unknown; mint?: unknown }>(candyGuard?.guards?.tokenPayment);
  const thirdPartySigner = unwrapOption<{ signerKey?: unknown }>(candyGuard?.guards?.thirdPartySigner);
  const priceLamports = solPayment ? amountToLamports(solPayment.lamports) : null;
  const priceUsdcAtomic = tokenPayment ? amountToLamports(tokenPayment.amount) : null;
  const solPaymentDestination = solPayment?.destination ? String(solPayment.destination) : null;
  const tokenPaymentDestinationAta = tokenPayment?.destinationAta ? String(tokenPayment.destinationAta) : null;
  const tokenPaymentMint = tokenPayment?.mint ? String(tokenPayment.mint) : null;
  const thirdPartySignerKey = thirdPartySigner?.signerKey ? String(thirdPartySigner.signerKey) : null;
  const paymentCurrency: PurchasePaymentCurrency | null = priceUsdcAtomic && tokenPaymentDestinationAta && tokenPaymentMint
    ? "USDC"
    : priceLamports && solPaymentDestination
      ? "SOL"
      : null;

  const itemsAvailable = toInteger(candyMachine.data?.itemsAvailable);
  const itemsRedeemed = toInteger(candyMachine.itemsRedeemed);
  const itemsRemaining = Math.max(0, itemsAvailable - itemsRedeemed);

  return {
    candyMachineAddress,
    collectionAddress: String(candyMachine.collectionMint || collectionAddress),
    candyGuardAddress: candyGuard ? String(candyGuard.publicKey) : String(guardPda[0] ?? guardPda),
    thirdPartySignerKey,
    startDateUnix,
    startDateIso: startDateUnix ? new Date(startDateUnix * 1_000).toISOString() : null,
    paymentCurrency,
    priceLamports,
    priceUsdcAtomic,
    solPaymentDestination,
    tokenPaymentDestinationAta,
    tokenPaymentMint,
    itemsAvailable,
    itemsRedeemed,
    itemsRemaining,
    fetchedAt: new Date().toISOString()
  };
}

async function getQuoteSnapshot(candyMachineAddress: string, collectionAddress: string): Promise<GuardSnapshot> {
  const cached = quoteCache.get(candyMachineAddress);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  const inFlight = quoteInFlight.get(candyMachineAddress);
  if (inFlight) {
    return inFlight;
  }

  const promise = fetchGuardSnapshot(candyMachineAddress, collectionAddress)
    .then((snapshot) => {
      quoteCache.set(candyMachineAddress, {
        snapshot,
        expiresAt: Date.now() + QUOTE_CACHE_TTL_MS
      });
      return snapshot;
    })
    .finally(() => {
      quoteInFlight.delete(candyMachineAddress);
    });

  quoteInFlight.set(candyMachineAddress, promise);
  return promise;
}

function assertAuthedBuyerPubkey(raw: string): string {
  return parsePublicKey(raw, "buyerPublicKey");
}

function resolvePurchaseQuantityMode(): PurchaseQuantityMode {
  const raw = process.env.PURCHASE_QUANTITY_MODE?.trim().toUpperCase();

  if (raw === "SINGLE_ONLY" || raw === "MULTI_ENABLED") {
    return raw;
  }

  return DEFAULT_PURCHASE_QUANTITY_MODE;
}

function resolvePurchaseMaxQuantity(): number {
  const raw = process.env.PURCHASE_MAX_QUANTITY_PER_ORDER?.trim();
  if (!raw) {
    return DEFAULT_MAX_PURCHASE_QUANTITY;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_MAX_PURCHASE_QUANTITY;
  }

  return parsed;
}

export function evaluatePurchaseQuantity(input: {
  quantityMode: PurchaseQuantityMode;
  requestedQuantity: number;
  maxQuantityPerOrder?: number;
}): PurchaseFlowError | null {
  if (!Number.isInteger(input.requestedQuantity) || input.requestedQuantity <= 0) {
    return new PurchaseFlowError("INVALID_QUANTITY", "quantity must be a positive integer.", 400, {
      requestedQuantity: input.requestedQuantity,
      quantityMode: input.quantityMode
    });
  }

  if (input.quantityMode === "SINGLE_ONLY" && input.requestedQuantity !== 1) {
    return new PurchaseFlowError("INVALID_QUANTITY", "This listing currently supports quantity=1 only.", 409, {
      requestedQuantity: input.requestedQuantity,
      quantityMode: input.quantityMode,
      allowedQuantity: 1
    });
  }

  if (input.quantityMode === "MULTI_ENABLED") {
    const maxQuantityPerOrder = Number.isInteger(input.maxQuantityPerOrder)
      && Number(input.maxQuantityPerOrder) > 0
      ? Number(input.maxQuantityPerOrder)
      : DEFAULT_MAX_PURCHASE_QUANTITY;

    if (input.requestedQuantity > maxQuantityPerOrder) {
      return new PurchaseFlowError(
        "INVALID_QUANTITY",
        `Requested quantity exceeds max per order (${maxQuantityPerOrder}).`,
        409,
        {
          requestedQuantity: input.requestedQuantity,
          quantityMode: input.quantityMode,
          maxQuantityPerOrder
        }
      );
    }
  }

  return null;
}

function resolveRequestedQuantity(requestedQuantity: number | undefined, quantityMode: PurchaseQuantityMode): number {
  const normalizedQuantity = typeof requestedQuantity === "number" ? Math.floor(requestedQuantity) : 1;
  const quantityError = evaluatePurchaseQuantity({
    quantityMode,
    requestedQuantity: normalizedQuantity,
    maxQuantityPerOrder: resolvePurchaseMaxQuantity()
  });

  if (quantityError) {
    throw quantityError;
  }

  return normalizedQuantity;
}

function calculateTotalPriceAtomic(priceAtomic: number, quantity: number, fieldName: string): number {
  const total = priceAtomic * quantity;
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", `Could not calculate total ${fieldName} for requested quantity.`, 500, {
      priceAtomic,
      quantity
    });
  }

  return total;
}

function assertIdempotencyKey(raw: string): string {
  const normalized = typeof raw === "string" ? raw.trim() : "";

  if (!normalized) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "idempotencyKey is required.", 400);
  }

  return normalized;
}

function isAttemptExpired(idempotencyExpiresAt: string): boolean {
  const expiresAtMs = new Date(idempotencyExpiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return expiresAtMs <= Date.now();
}

function parseSignedTransaction(base64Value: string): LegacyVersionedTransaction {
  const raw = fromBase64(base64Value);

  if (!raw.length) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Signed transaction cannot be empty.", 400);
  }

  try {
    return deserializeLegacyVersionedTransaction(raw);
  } catch {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Signed transaction payload is invalid.", 400);
  }
}

function hasZeroedSignature(signature: Uint8Array | null | undefined): boolean {
  if (!signature || signature.length === 0) {
    return true;
  }

  for (const value of signature) {
    if (value !== 0) {
      return false;
    }
  }

  return true;
}

function assertThirdPartySignerSigned(transaction: LegacyVersionedTransaction, thirdPartySignerPublicKey: string): void {
  const signerIndex = getLegacyTransactionStaticAccountKeys(transaction).findIndex((key) => key === thirdPartySignerPublicKey);

  if (signerIndex < 0) {
    throw new PurchaseFlowError(
      "TRANSACTION_FAILED",
      "Prepared transaction is missing Candy Guard third-party signer account.",
      500
    );
  }

  if (signerIndex >= getLegacyTransactionRequiredSignerCount(transaction)) {
    throw new PurchaseFlowError(
      "TRANSACTION_FAILED",
      "Candy Guard third-party signer is not marked as a required signer in prepared transaction.",
      500
    );
  }

  const signerSignature = getLegacyTransactionSignatureAt(transaction, signerIndex);
  if (hasZeroedSignature(signerSignature)) {
    throw new PurchaseFlowError(
      "TRANSACTION_FAILED",
      "Prepared transaction is missing backend third-party signature.",
      500
    );
  }
}

function assertPayerMatchesBuyer(transaction: LegacyVersionedTransaction, expectedBuyer: string): void {
  const payer = getLegacyTransactionPayer(transaction);

  if (!payer) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Could not determine transaction payer.", 400);
  }

  if (payer !== expectedBuyer) {
    throw new PurchaseFlowError("UNAUTHORIZED", "Signed transaction payer does not match authenticated wallet.", 403);
  }
}

async function readPropertyContext(propertyId: string): Promise<{
  propertyId: string;
  candyMachineAddress: string;
  collectionAddress: string;
}> {
  const property = await getMarketplacePropertyDetailOrThrowRpc(propertyId);

  if (!property) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Property not found.", 404);
  }

  return {
    propertyId: property.id,
    // In this project the marketplace column stores candy machine address as assetMintAddress.
    candyMachineAddress: property.blockchain.assetMintAddress,
    collectionAddress: property.blockchain.collectionAddress
  };
}

function createBuyerUmi(buyerPublicKey: string): { umi: Umi; buyerSigner: ReturnType<typeof createNoopSigner> } {
  const umi = createUmi(getSolanaRpcUrl()).use(mplCore()).use(mplCandyMachine());
  const buyerSigner = createNoopSigner(publicKey(buyerPublicKey));
  umi.use(signerIdentity(buyerSigner, true));
  return { umi, buyerSigner };
}

export async function quotePurchaseForProperty(propertyId: string, quantity = 1): Promise<PurchaseQuoteResult> {
  const quantityMode = resolvePurchaseQuantityMode();
  const requestedQuantity = resolveRequestedQuantity(quantity, quantityMode);
  const propertyContext = await readPropertyContext(propertyId);
  const snapshot = await getQuoteSnapshot(propertyContext.candyMachineAddress, propertyContext.collectionAddress);
  const availabilityError = evaluateMintAvailability(
    {
      startDateUnix: snapshot.startDateUnix,
      itemsRemaining: snapshot.itemsRemaining
    },
    nowUnixSeconds()
  );

  if (availabilityError) {
    throw availabilityError;
  }

  if (!snapshot.paymentCurrency) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard payment guard is not configured.", 409);
  }

  if (snapshot.itemsRemaining < requestedQuantity) {
    throw new PurchaseFlowError("SOLD_OUT", "Requested quantity exceeds available supply.", 409, {
      requestedQuantity,
      itemsRemaining: snapshot.itemsRemaining
    });
  }

  const totalPriceLamports = snapshot.paymentCurrency === "SOL" && snapshot.priceLamports !== null
    ? calculateTotalPriceAtomic(snapshot.priceLamports, requestedQuantity, "priceLamports")
    : null;
  const totalPriceUsdcAtomic = snapshot.paymentCurrency === "USDC" && snapshot.priceUsdcAtomic !== null
    ? calculateTotalPriceAtomic(snapshot.priceUsdcAtomic, requestedQuantity, "priceUsdcAtomic")
    : null;

  if (snapshot.paymentCurrency === "SOL" && totalPriceLamports === null) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard solPayment is not configured.", 409);
  }

  if (snapshot.paymentCurrency === "USDC" && totalPriceUsdcAtomic === null) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard tokenPayment is not configured.", 409);
  }

  return {
    propertyId: propertyContext.propertyId,
    quantityMode,
    quantity: requestedQuantity,
    paymentCurrency: snapshot.paymentCurrency,
    totalPriceLamports,
    totalPriceUsdcAtomic,
    candyMachineAddress: snapshot.candyMachineAddress,
    collectionAddress: snapshot.collectionAddress,
    cacheUpdatedAt: snapshot.fetchedAt,
    priceLamports: snapshot.priceLamports,
    priceUsdcAtomic: snapshot.priceUsdcAtomic,
    startDateIso: snapshot.startDateIso,
    itemsRemaining: snapshot.itemsRemaining,
    itemsAvailable: snapshot.itemsAvailable,
    itemsRedeemed: snapshot.itemsRedeemed
  };
}

export async function issuePurchaseChallengeForProperty(input: {
  propertyId: string;
  buyerPublicKey: string;
  quantity?: number;
  clientIp: string;
}): Promise<PurchaseChallengeResult> {
  const buyerPublicKey = assertAuthedBuyerPubkey(input.buyerPublicKey);
  const quantityMode = resolvePurchaseQuantityMode();
  const requestedQuantity = resolveRequestedQuantity(input.quantity, quantityMode);
  const propertyContext = await readPropertyContext(input.propertyId);

  try {
    const challenge = await issuePurchaseChallenge({
      walletPublicKey: buyerPublicKey,
      propertyId: propertyContext.propertyId,
      candyMachineAddress: propertyContext.candyMachineAddress,
      quantity: requestedQuantity,
      clientIp: input.clientIp
    });

    return {
      propertyId: propertyContext.propertyId,
      quantityMode,
      quantity: requestedQuantity,
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt
    };
  } catch (error) {
    if (error instanceof PurchaseAntiBotError) {
      throw mapAntiBotError(error);
    }

    throw error;
  }
}

export async function preparePurchase(input: PreparePurchaseInput): Promise<PurchasePrepareResult> {
  const buyerPublicKey = assertAuthedBuyerPubkey(input.buyerPublicKey);
  const quantityMode = resolvePurchaseQuantityMode();
  const requestedQuantity = resolveRequestedQuantity(input.quantity, quantityMode);
  const challengeId = typeof input.challengeId === "string" ? input.challengeId.trim() : "";
  const challengeSignatureBase64 = typeof input.challengeSignatureBase64 === "string"
    ? input.challengeSignatureBase64.trim()
    : "";
  const clientIp = input.clientIp.trim() || "unknown";

  if (!challengeId) {
    throw new PurchaseFlowError("INVALID_CHALLENGE", "challengeId is required.", 400);
  }

  if (!challengeSignatureBase64) {
    throw new PurchaseFlowError("INVALID_CHALLENGE", "challengeSignatureBase64 is required.", 400);
  }

  const propertyContext = await readPropertyContext(input.propertyId);
  const freshSnapshot = await fetchGuardSnapshot(propertyContext.candyMachineAddress, propertyContext.collectionAddress);
  const availabilityError = evaluateMintAvailability(
    {
      startDateUnix: freshSnapshot.startDateUnix,
      itemsRemaining: freshSnapshot.itemsRemaining
    },
    nowUnixSeconds()
  );

  if (availabilityError) {
    throw availabilityError;
  }

  if (!freshSnapshot.paymentCurrency) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard payment guard is not configured.", 409);
  }

  if (freshSnapshot.paymentCurrency === "SOL" && (freshSnapshot.priceLamports === null || !freshSnapshot.solPaymentDestination)) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard solPayment is not configured.", 409);
  }

  if (
    freshSnapshot.paymentCurrency === "USDC"
    && (
      freshSnapshot.priceUsdcAtomic === null
      || !freshSnapshot.tokenPaymentDestinationAta
      || !freshSnapshot.tokenPaymentMint
    )
  ) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard tokenPayment is not configured.", 409);
  }

  if (freshSnapshot.itemsRemaining < requestedQuantity) {
    throw new PurchaseFlowError("SOLD_OUT", "Requested quantity exceeds available supply.", 409, {
      requestedQuantity,
      itemsRemaining: freshSnapshot.itemsRemaining
    });
  }

  if (freshSnapshot.paymentCurrency === "SOL") {
    if (
      typeof input.quotedPriceLamports === "number"
      && input.quotedPriceLamports > 0
      && input.quotedPriceLamports !== freshSnapshot.priceLamports
    ) {
      throw new PurchaseFlowError(
        "PRICE_CHANGED",
        "Mint price changed since quote.",
        409,
        {
          quotedPriceLamports: input.quotedPriceLamports,
          currentPriceLamports: freshSnapshot.priceLamports
        }
      );
    }
  } else if (
    typeof input.quotedPriceUsdcAtomic === "number"
    && input.quotedPriceUsdcAtomic > 0
    && input.quotedPriceUsdcAtomic !== freshSnapshot.priceUsdcAtomic
  ) {
    throw new PurchaseFlowError(
      "PRICE_CHANGED",
      "Mint price changed since quote.",
      409,
      {
        quotedPriceUsdcAtomic: input.quotedPriceUsdcAtomic,
        currentPriceUsdcAtomic: freshSnapshot.priceUsdcAtomic
      }
    );
  }

  try {
    await assertPurchaseRateLimit({
      endpoint: "purchase_prepare",
      walletPublicKey: buyerPublicKey,
      clientIp
    });
  } catch (error) {
    if (error instanceof PurchaseAntiBotError) {
      throw mapAntiBotError(error);
    }

    throw error;
  }

  try {
    await verifyAndConsumePurchaseChallenge({
      challengeId,
      challengeSignatureBase64,
      walletPublicKey: buyerPublicKey,
      propertyId: propertyContext.propertyId,
      candyMachineAddress: freshSnapshot.candyMachineAddress,
      quantity: requestedQuantity
    });
  } catch (error) {
    if (error instanceof PurchaseAntiBotError) {
      throw mapAntiBotError(error);
    }

    throw error;
  }

  const idempotencyKey = generateUuidV7();
  const idempotencyExpiresAt = new Date(Date.now() + PURCHASE_ATTEMPT_IDEMPOTENCY_TTL_MS).toISOString();
  const attempt = await createPurchaseAttempt({
    propertyId: propertyContext.propertyId,
    walletPublicKey: buyerPublicKey,
    candyMachineAddress: freshSnapshot.candyMachineAddress,
    collectionAddress: freshSnapshot.collectionAddress,
    challengeId,
    clientIp,
    quantity: requestedQuantity,
    quotedPriceLamports: freshSnapshot.paymentCurrency === "SOL" && typeof input.quotedPriceLamports === "number"
      ? input.quotedPriceLamports
      : null,
    idempotencyKey,
    idempotencyExpiresAt
  });

  try {
    const { umi, buyerSigner } = createBuyerUmi(buyerPublicKey);
    const thirdPartySigner = createPurchaseThirdPartySigner(umi);

    if (!freshSnapshot.thirdPartySignerKey) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Candy Guard thirdPartySigner is not configured.", 409);
    }

    if (freshSnapshot.thirdPartySignerKey !== String(thirdPartySigner.publicKey)) {
      throw new PurchaseFlowError(
        "TRANSACTION_FAILED",
        "Candy Guard third-party signer does not match backend signer configuration.",
        409,
        {
          configuredOnchain: freshSnapshot.thirdPartySignerKey,
          configuredBackend: String(thirdPartySigner.publicKey)
        }
      );
    }

    const buildMintBatch = (quantity: number): {
      expectedAssetAddresses: string[];
      builder: ReturnType<typeof transactionBuilder>;
    } => {
      const expectedAssetAddresses: string[] = [];
      let builder = transactionBuilder();

      for (let index = 0; index < quantity; index += 1) {
        const assetSigner = generateSigner(umi);
        expectedAssetAddresses.push(String(assetSigner.publicKey));

        const mintArgs = freshSnapshot.paymentCurrency === "USDC"
          ? {
              tokenPayment: {
                destinationAta: publicKey(freshSnapshot.tokenPaymentDestinationAta as string),
                mint: publicKey(freshSnapshot.tokenPaymentMint as string)
              },
              thirdPartySigner: {
                signer: thirdPartySigner
              }
            }
          : {
              solPayment: {
                destination: publicKey(freshSnapshot.solPaymentDestination as string)
              },
              thirdPartySigner: {
                signer: thirdPartySigner
              }
            };

        builder = builder
          .add(mintV1(umi, {
            candyMachine: candyMachineAddress,
            candyGuard,
            collection: collectionAddress,
            payer: buyerSigner,
            minter: buyerSigner,
            owner: buyerSigner.publicKey,
            asset: assetSigner,
            mintArgs
          }))
          .add(addPlugin(umi, {
            asset: assetSigner.publicKey,
            collection: collectionAddress,
            payer: buyerSigner,
            authority: buyerSigner,
            plugin: {
              type: "FreezeDelegate",
              frozen: false,
              authority: {
                type: "Owner"
              }
            }
          }));
      }

      return { expectedAssetAddresses, builder };
    };

    const candyMachineAddress = publicKey(freshSnapshot.candyMachineAddress);
    const collectionAddress = publicKey(freshSnapshot.collectionAddress);
    const candyGuard = findCandyGuardPda(umi, { base: candyMachineAddress });
    const { expectedAssetAddresses, builder: mintBatchBuilder } = buildMintBatch(requestedQuantity);

    if (!mintBatchBuilder.fitsInOneTransaction(umi)) {
      let suggestedMaxQuantity = 1;

      for (let candidate = requestedQuantity - 1; candidate >= 1; candidate -= 1) {
        const { builder } = buildMintBatch(candidate);
        if (builder.fitsInOneTransaction(umi)) {
          suggestedMaxQuantity = candidate;
          break;
        }
      }

      throw new PurchaseFlowError(
        "INVALID_QUANTITY",
        "Requested quantity is too large for a single transaction. Reduce quantity and retry.",
        409,
        {
          requestedQuantity,
          quantityMode,
          maxQuantityPerOrder: resolvePurchaseMaxQuantity(),
          suggestedMaxQuantity
        }
      );
    }

    const signedBuilderTx = await mintBatchBuilder.buildAndSign(umi);
    const web3Tx = convertUmiTransactionToLegacyVersionedTransaction(signedBuilderTx);
    assertThirdPartySignerSigned(web3Tx, freshSnapshot.thirdPartySignerKey);
    const transactionBase64 = toBase64(web3Tx.serialize());
    const preparedTxMessageBase64 = toBase64(serializeLegacyVersionedMessage(web3Tx));
    const prepared = await markPurchaseAttemptPrepared({
      id: attempt.id,
      preparedPriceLamports: resolvePreparedPriceLamports(
        freshSnapshot.paymentCurrency,
        freshSnapshot.priceLamports
      ),
      cacheUpdatedAt: freshSnapshot.fetchedAt,
      preparedTxMessageBase64,
      expectedAssetAddresses
    });

    if (!prepared || prepared.status !== "prepared") {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Purchase attempt is not in a preparable state.", 409);
    }

    const totalPriceLamports = freshSnapshot.paymentCurrency === "SOL" && freshSnapshot.priceLamports !== null
      ? calculateTotalPriceAtomic(freshSnapshot.priceLamports, requestedQuantity, "priceLamports")
      : null;
    const totalPriceUsdcAtomic = freshSnapshot.paymentCurrency === "USDC" && freshSnapshot.priceUsdcAtomic !== null
      ? calculateTotalPriceAtomic(freshSnapshot.priceUsdcAtomic, requestedQuantity, "priceUsdcAtomic")
      : null;

    return {
      attemptId: prepared.id,
      idempotencyKey: prepared.idempotencyKey,
      propertyId: propertyContext.propertyId,
      quantityMode,
      quantity: requestedQuantity,
      network: "devnet",
      paymentCurrency: freshSnapshot.paymentCurrency,
      candyMachineAddress: freshSnapshot.candyMachineAddress,
      collectionAddress: freshSnapshot.collectionAddress,
      priceLamports: freshSnapshot.priceLamports,
      totalPriceLamports,
      priceUsdcAtomic: freshSnapshot.priceUsdcAtomic,
      totalPriceUsdcAtomic,
      cacheUpdatedAt: freshSnapshot.fetchedAt,
      preparedAt: prepared.preparedAt ?? new Date().toISOString(),
      transactionBase64,
      expectedAssetAddress: expectedAssetAddresses[0] ?? "",
      expectedAssetAddresses
    };
  } catch (error) {
    const mapped = error instanceof PurchaseFlowError
      ? error
      : new PurchaseFlowError(
        "TRANSACTION_FAILED",
        error instanceof Error ? error.message : "Could not prepare purchase transaction.",
        500
      );

    await markPurchaseAttemptFailed({
      id: attempt.id,
      errorCode: mapped.code,
      errorMessage: mapped.message
    });
    throw mapped;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendSignedTransaction(
  rpc: KitRpcConnection,
  transaction: LegacyVersionedTransaction
): Promise<string> {
  return sendRawTransactionWithKitRpc(rpc, serializeLegacyVersionedTransaction(transaction), {
    skipPreflight: false,
    maxRetries: 3
  });
}

async function waitForConfirmedSignature(
  rpc: KitRpcConnection,
  signature: string
): Promise<void> {
  for (let attempt = 0; attempt < PURCHASE_SUBMIT_CONFIRMATION_POLLS; attempt += 1) {
    const status = await getSignatureStatusWithKitRpc(rpc, signature, { searchTransactionHistory: true });

    if (status?.err) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Submitted transaction failed on-chain.", 409, {
        signature,
        transactionError: status.err
      });
    }

    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }

    await sleep(PURCHASE_SUBMIT_CONFIRMATION_DELAY_MS);
  }

  throw new PurchaseFlowError("TRANSACTION_FAILED", "Submitted transaction was not confirmed before verification.", 409, {
    signature
  });
}

async function verifyExpectedMintedAssets(input: {
  buyerPublicKey: string;
  collectionAddress: string;
  expectedAssetAddresses: string[];
}): Promise<string[]> {
  if (input.expectedAssetAddresses.length === 0) {
    throw new PurchaseFlowError(
      "TRANSACTION_FAILED",
      "Purchase attempt has no expected asset addresses to verify.",
      409
    );
  }

  const umi = createUmi(getSolanaRpcUrl()).use(mplCore());
  const verified: string[] = [];
  const retryConfig = getPurchaseAssetVerificationRetryConfig();

  for (const assetAddress of input.expectedAssetAddresses) {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt += 1) {
      try {
        const asset = await fetchAsset(umi, publicKey(assetAddress));
        const owner = getMplCoreAssetOwner(asset);
        const collection = getMplCoreAssetCollection(asset);

        if (owner !== input.buyerPublicKey) {
          throw new PurchaseFlowError("TRANSACTION_FAILED", "Verified asset owner does not match buyer.", 409, {
            assetAddress,
            expectedOwner: input.buyerPublicKey,
            actualOwner: owner
          });
        }

        if (collection !== input.collectionAddress) {
          throw new PurchaseFlowError("TRANSACTION_FAILED", "Verified asset collection does not match purchase collection.", 409, {
            assetAddress,
            expectedCollection: input.collectionAddress,
            actualCollection: collection
          });
        }

        if (!hasOwnerFreezeDelegatePlugin(asset)) {
          throw new PurchaseFlowError(
            "TRANSACTION_FAILED",
            "Verified asset does not expose owner-managed FreezeDelegate.",
            409,
            { assetAddress }
          );
        }

        verified.push(assetAddress);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (error instanceof PurchaseFlowError) {
          break;
        }

        if (attempt < retryConfig.maxAttempts) {
          await sleep(retryConfig.retryDelayMs);
        }
      }
    }

    if (lastError) {
      if (lastError instanceof PurchaseFlowError) {
        throw lastError;
      }

      throw new PurchaseFlowError(
        "TRANSACTION_FAILED",
        "Could not verify minted asset after transaction confirmation.",
        409,
        {
          assetAddress,
          cause: lastError instanceof Error ? lastError.message : String(lastError),
          verificationAttempts: retryConfig.maxAttempts,
          verificationRetryDelayMs: retryConfig.retryDelayMs
        }
      );
    }
  }

  return verified;
}

export async function submitPurchase(input: SubmitPurchaseInput): Promise<PurchaseSubmitResult> {
  const buyerPublicKey = assertAuthedBuyerPubkey(input.buyerPublicKey);
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const transaction = parseSignedTransaction(input.signedTransactionBase64);
  assertPayerMatchesBuyer(transaction, buyerPublicKey);
  const messageBase64 = toBase64(serializeLegacyVersionedMessage(transaction));
  const rpc = createKitRpcConnection(getSolanaRpcUrl());

  async function confirmAndVerifySubmittedAttempt(inputAttempt: {
    id: string;
    collectionAddress: string;
    expectedAssetAddresses: string[];
  }, inputSignature: {
    signature: string;
    submittedAt: string;
  }, options?: { client?: PoolClient }): Promise<PurchaseSubmitResult> {
    try {
      await waitForConfirmedSignature(rpc, inputSignature.signature);
      const verifiedAssetAddresses = await verifyExpectedMintedAssets({
        buyerPublicKey,
        collectionAddress: inputAttempt.collectionAddress,
        expectedAssetAddresses: inputAttempt.expectedAssetAddresses
      });
      await markPurchaseAttemptConfirmed({
        signature: inputSignature.signature,
        verifiedAssetAddresses
      }, options);

      return {
        attemptId: inputAttempt.id,
        status: "confirmed",
        txSignature: inputSignature.signature,
        submittedAt: inputSignature.submittedAt
      };
    } catch (error) {
      const mapped = mapSubmitErrorToPurchaseError(error);
      await markPurchaseAttemptFailed(
        {
          id: inputAttempt.id,
          errorCode: mapped.code,
          errorMessage: mapped.message
        },
        options
      );
      throw mapped;
    }
  }

  async function submitPreparedAttemptWithCurrentState(inputAttempt: {
    id: string;
    walletPublicKey: string;
    collectionAddress: string;
    expectedAssetAddresses: string[];
    status: "created" | "prepared" | "submitted" | "confirmed" | "failed";
    txSignature: string | null;
    submittedAt: string | null;
    preparedTxMessageBase64: string | null;
    idempotencyExpiresAt: string;
  }, options?: { client?: PoolClient; deferVerification?: boolean }): Promise<PurchaseSubmitResult> {
    if (inputAttempt.id !== input.attemptId) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Attempt id does not match idempotency key.", 409);
    }

    if (inputAttempt.walletPublicKey !== buyerPublicKey) {
      throw new PurchaseFlowError("UNAUTHORIZED", "Attempt ownership does not match authenticated wallet.", 403);
    }

    if ((inputAttempt.status === "submitted" || inputAttempt.status === "confirmed") && inputAttempt.txSignature) {
      const submittedAt = inputAttempt.submittedAt ?? new Date().toISOString();
      if (options?.deferVerification) {
        return {
          attemptId: inputAttempt.id,
          status: "submitted",
          txSignature: inputAttempt.txSignature,
          submittedAt
        };
      }

      return confirmAndVerifySubmittedAttempt(inputAttempt, {
        signature: inputAttempt.txSignature,
        submittedAt
      }, options);
    }

    if (inputAttempt.status !== "prepared") {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Attempt is not in a submittable state.", 409);
    }

    if (isAttemptExpired(inputAttempt.idempotencyExpiresAt)) {
      const expiredError = new PurchaseFlowError(
        "TRANSACTION_FAILED",
        "Purchase attempt idempotency key expired. Prepare a new purchase.",
        409
      );
      await markPurchaseAttemptFailed(
        {
          id: inputAttempt.id,
          errorCode: expiredError.code,
          errorMessage: expiredError.message
        },
        options
      );
      throw expiredError;
    }

    if (!inputAttempt.preparedTxMessageBase64 || messageBase64 !== inputAttempt.preparedTxMessageBase64) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Signed transaction does not match prepared payload.", 409);
    }

    try {
      const signature = await sendSignedTransaction(rpc, transaction);
      const stored = await markPurchaseAttemptSubmitted(
        {
          id: inputAttempt.id,
          signature
        },
        options
      );
      const finalSignature = stored?.txSignature ?? signature;
      const submittedAt = stored?.submittedAt ?? new Date().toISOString();
      if (options?.deferVerification) {
        return {
          attemptId: inputAttempt.id,
          status: "submitted",
          txSignature: finalSignature,
          submittedAt
        };
      }

      return await confirmAndVerifySubmittedAttempt(inputAttempt, {
        signature: finalSignature,
        submittedAt
      }, options);
    } catch (error) {
      const mapped = mapSubmitErrorToPurchaseError(error);
      await markPurchaseAttemptFailed(
        {
          id: inputAttempt.id,
          errorCode: mapped.code,
          errorMessage: mapped.message
        },
        options
      );
      throw mapped;
    }
  }

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const attempt = await getPurchaseAttemptByWalletAndIdempotency({
      walletPublicKey: buyerPublicKey,
      idempotencyKey
    });

    if (!attempt) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "Purchase attempt not found.", 404);
    }

    return submitPreparedAttemptWithCurrentState(attempt);
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");
    let committed = false;

    try {
      const attempt = await getPurchaseAttemptByWalletAndIdempotency(
        {
          walletPublicKey: buyerPublicKey,
          idempotencyKey
        },
        {
          client,
          forUpdate: true
        }
      );

      if (!attempt) {
        throw new PurchaseFlowError("TRANSACTION_FAILED", "Purchase attempt not found.", 404);
      }

      let result: PurchaseSubmitResult | null = null;
      let recoverablePurchaseError: PurchaseFlowError | null = null;
      let attemptForVerification: {
        id: string;
        collectionAddress: string;
        expectedAssetAddresses: string[];
      } | null = null;

      try {
        attemptForVerification = attempt;
        result = await submitPreparedAttemptWithCurrentState(attempt, { client, deferVerification: true });
      } catch (error) {
        if (error instanceof PurchaseFlowError) {
          recoverablePurchaseError = error;
        } else {
          throw error;
        }
      }

      await client.query("COMMIT");
      committed = true;

      if (recoverablePurchaseError) {
        throw recoverablePurchaseError;
      }

      if (!result) {
        throw new PurchaseFlowError("TRANSACTION_FAILED", "Submit flow did not produce a result.", 500);
      }

      if (result.status === "submitted" && attemptForVerification) {
        return confirmAndVerifySubmittedAttempt(attemptForVerification, {
          signature: result.txSignature,
          submittedAt: result.submittedAt
        });
      }

      return result;
    } catch (error) {
      if (!committed) {
        await client.query("ROLLBACK");
      }
      throw error;
    }
  });
}
