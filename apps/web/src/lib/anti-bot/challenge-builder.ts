import { randomBytes } from "node:crypto";

import { createPurchaseChallenge } from "@/lib/purchase-challenges-repository";
import { getPurchaseAntiBotConfig, PurchaseAntiBotError } from "./config";
import { assertPurchaseRateLimit } from "./rate-limiter";

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

export type IssuedPurchaseChallenge = {
  challengeId: string;
  nonce: string;
  message: string;
  expiresAt: string;
};

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

export function assertMatchingChallengeContext(input: {
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
