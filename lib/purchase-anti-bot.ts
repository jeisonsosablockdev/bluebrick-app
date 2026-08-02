import { randomBytes } from "node:crypto";

import { address, getAddressEncoder } from "@solana/kit";
import nacl from "tweetnacl";

import {
  consumePurchaseChallenge,
  createPurchaseChallenge,
  getPurchaseChallengeById,
  markPurchaseChallengeFailed
} from "@/lib/purchase-challenges-repository";
import {
  countRecentPurchaseRateLimitEvents,
  createPurchaseRateLimitEvent,
  type PurchaseRateLimitEndpoint
} from "@/lib/purchase-rate-limit-repository";

export type PurchaseAntiBotErrorCode = "INVALID_CHALLENGE" | "RATE_LIMITED";

export class PurchaseAntiBotError extends Error {
  readonly code: PurchaseAntiBotErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PurchaseAntiBotErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PurchaseAntiBotError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type PurchaseChallengePayload = {
  walletPublicKey: string;
  propertyId: string;
  candyMachineAddress: string;
  quantity: number;
  nonce: string;
  expiresAtIso: string;
};

export type IssuePurchaseChallengeInput = {
  walletPublicKey: string;
  propertyId: string;
  candyMachineAddress: string;
  quantity?: number;
  clientIp: string;
};

export type VerifyPurchaseChallengeInput = {
  challengeId: string;
  challengeSignatureBase64: string;
  walletPublicKey: string;
  propertyId: string;
  candyMachineAddress: string;
  quantity: number;
};

export type IssuedPurchaseChallenge = {
  challengeId: string;
  nonce: string;
  message: string;
  expiresAt: string;
};

type PurchaseAntiBotConfig = {
  challengeTtlSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxByWallet: number;
  rateLimitMaxByIp: number;
};

const DEFAULT_CHALLENGE_TTL_SECONDS = 120;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_BY_WALLET = 8;
const DEFAULT_RATE_LIMIT_MAX_BY_IP = 20;

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getPurchaseAntiBotConfig(): PurchaseAntiBotConfig {
  return {
    challengeTtlSeconds: parseEnvInt("PURCHASE_CHALLENGE_TTL_SECONDS", DEFAULT_CHALLENGE_TTL_SECONDS),
    rateLimitWindowSeconds: parseEnvInt("PURCHASE_RATE_LIMIT_WINDOW_SECONDS", DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
    rateLimitMaxByWallet: parseEnvInt("PURCHASE_RATE_LIMIT_MAX_BY_WALLET", DEFAULT_RATE_LIMIT_MAX_BY_WALLET),
    rateLimitMaxByIp: parseEnvInt("PURCHASE_RATE_LIMIT_MAX_BY_IP", DEFAULT_RATE_LIMIT_MAX_BY_IP)
  };
}

function decodeSignature(base64Signature: string): Uint8Array {
  try {
    const decoded = Buffer.from(base64Signature, "base64");
    if (!decoded.length) {
      throw new Error("empty");
    }
    return Uint8Array.from(decoded);
  } catch {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge signature format is invalid.", 400);
  }
}

function assertMatchingChallengeContext(input: {
  challengeWallet: string;
  challengePropertyId: string;
  challengeCandyMachineAddress: string;
  challengeMessage: string;
  walletPublicKey: string;
  propertyId: string;
  candyMachineAddress: string;
  quantity: number;
}): void {
  if (input.challengeWallet !== input.walletPublicKey) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge wallet does not match authenticated wallet.", 403);
  }

  if (input.challengePropertyId !== input.propertyId) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge property does not match purchase request.", 409);
  }

  if (input.challengeCandyMachineAddress !== input.candyMachineAddress) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge candy machine does not match purchase request.", 409);
  }

  const quantityMatch = input.challengeMessage.match(/^Quantity:\s*(\d+)$/m);
  const challengeQuantity = quantityMatch ? Number(quantityMatch[1]) : NaN;
  if (!Number.isInteger(challengeQuantity) || challengeQuantity <= 0) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge payload is missing quantity.", 409);
  }

  if (challengeQuantity !== input.quantity) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge quantity does not match purchase request.", 409);
  }
}

export function buildPurchaseChallengeMessage(payload: PurchaseChallengePayload): string {
  return [
    "Solana Purchase Challenge",
    "Version: 1",
    `Wallet: ${payload.walletPublicKey}`,
    `Property: ${payload.propertyId}`,
    `Candy Machine: ${payload.candyMachineAddress}`,
    `Quantity: ${payload.quantity}`,
    `Nonce: ${payload.nonce}`,
    `Expires At: ${payload.expiresAtIso}`,
    "Statement: Authorize purchase transaction preparation."
  ].join("\n");
}

export async function assertPurchaseRateLimit(input: {
  endpoint: PurchaseRateLimitEndpoint;
  walletPublicKey: string;
  clientIp: string;
}): Promise<void> {
  const config = getPurchaseAntiBotConfig();
  const ipAddress = input.clientIp.trim() || "unknown";

  const recent = await countRecentPurchaseRateLimitEvents({
    endpoint: input.endpoint,
    walletPublicKey: input.walletPublicKey,
    ipAddress,
    windowSeconds: config.rateLimitWindowSeconds
  });

  if (recent.walletCount >= config.rateLimitMaxByWallet) {
    throw new PurchaseAntiBotError(
      "RATE_LIMITED",
      "Too many purchase attempts from this wallet. Please wait a moment.",
      429,
      {
        scope: "wallet",
        endpoint: input.endpoint,
        limit: config.rateLimitMaxByWallet,
        windowSeconds: config.rateLimitWindowSeconds
      }
    );
  }

  if (recent.ipCount >= config.rateLimitMaxByIp) {
    throw new PurchaseAntiBotError(
      "RATE_LIMITED",
      "Too many purchase attempts from this IP. Please wait a moment.",
      429,
      {
        scope: "ip",
        endpoint: input.endpoint,
        limit: config.rateLimitMaxByIp,
        windowSeconds: config.rateLimitWindowSeconds
      }
    );
  }

  await createPurchaseRateLimitEvent({
    endpoint: input.endpoint,
    walletPublicKey: input.walletPublicKey,
    ipAddress
  });
}

export async function issuePurchaseChallenge(input: IssuePurchaseChallengeInput): Promise<IssuedPurchaseChallenge> {
  await assertPurchaseRateLimit({
    endpoint: "purchase_challenge",
    walletPublicKey: input.walletPublicKey,
    clientIp: input.clientIp
  });

  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const nonce = randomBytes(18).toString("base64url");
  const config = getPurchaseAntiBotConfig();
  const expiresAt = new Date(Date.now() + config.challengeTtlSeconds * 1_000).toISOString();
  const message = buildPurchaseChallengeMessage({
    walletPublicKey: input.walletPublicKey,
    propertyId: input.propertyId,
    candyMachineAddress: input.candyMachineAddress,
    quantity,
    nonce,
    expiresAtIso: expiresAt
  });

  const challenge = await createPurchaseChallenge({
    propertyId: input.propertyId,
    walletPublicKey: input.walletPublicKey,
    candyMachineAddress: input.candyMachineAddress,
    challengeNonce: nonce,
    challengeMessage: message,
    expiresAt
  });

  return {
    challengeId: challenge.id,
    nonce,
    message,
    expiresAt: challenge.expiresAt
  };
}

export async function verifyAndConsumePurchaseChallenge(input: VerifyPurchaseChallengeInput): Promise<void> {
  const challenge = await getPurchaseChallengeById(input.challengeId);

  if (!challenge) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge not found.", 404);
  }

  assertMatchingChallengeContext({
    challengeWallet: challenge.walletPublicKey,
    challengePropertyId: challenge.propertyId,
    challengeCandyMachineAddress: challenge.candyMachineAddress,
    challengeMessage: challenge.challengeMessage,
    walletPublicKey: input.walletPublicKey,
    propertyId: input.propertyId,
    candyMachineAddress: input.candyMachineAddress,
    quantity: input.quantity
  });

  if (challenge.status !== "issued") {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge already used or invalid.", 409);
  }

  if (Date.parse(challenge.expiresAt) <= Date.now()) {
    await markPurchaseChallengeFailed(challenge.id, "Challenge expired.", "expired");
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge expired.", 409);
  }

  const signatureBytes = decodeSignature(input.challengeSignatureBase64);
  let walletPublicKeyBytes: Uint8Array;
  try {
    const validAddress = address(input.walletPublicKey);
    walletPublicKeyBytes = Uint8Array.from(getAddressEncoder().encode(validAddress));
  } catch {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Authenticated wallet format is invalid.", 400);
  }

  const messageBytes = new TextEncoder().encode(challenge.challengeMessage);
  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, walletPublicKeyBytes);

  if (!isValid) {
    await markPurchaseChallengeFailed(challenge.id, "Wallet signature validation failed.");
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge signature validation failed.", 401);
  }

  const consumed = await consumePurchaseChallenge(challenge.id);
  if (!consumed) {
    throw new PurchaseAntiBotError("INVALID_CHALLENGE", "Challenge cannot be consumed (expired or replayed).", 409);
  }
}
