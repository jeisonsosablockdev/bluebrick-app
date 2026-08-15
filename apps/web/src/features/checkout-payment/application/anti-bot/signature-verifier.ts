import { address, getAddressEncoder } from "@solana/kit";
import nacl from "tweetnacl";

import {
  consumePurchaseChallenge,
  getPurchaseChallengeById,
  markPurchaseChallengeFailed
} from "@/lib/purchase-challenges-repository";
import { assertMatchingChallengeContext } from "./challenge-builder";
import { PurchaseAntiBotError } from "./config";

export type VerifyPurchaseChallengeInput = {
  challengeId: string;
  challengeSignatureBase64: string;
  walletPublicKey: string;
  propertyId: string;
  candyMachineAddress: string;
  quantity: number;
};

export function decodeSignature(base64Signature: string): Uint8Array {
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
