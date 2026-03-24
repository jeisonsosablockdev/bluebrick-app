import { randomUUID } from "node:crypto";

import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { afterEach, describe, expect, it } from "vitest";

import {
  assertPurchaseRateLimit,
  buildPurchaseChallengeMessage,
  issuePurchaseChallenge,
  PurchaseAntiBotError,
  verifyAndConsumePurchaseChallenge
} from "@/lib/purchase-anti-bot";

const ORIGINAL_CHALLENGE_TTL = process.env.PURCHASE_CHALLENGE_TTL_SECONDS;
const ORIGINAL_WINDOW = process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS;
const ORIGINAL_MAX_WALLET = process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET;
const ORIGINAL_MAX_IP = process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP;

afterEach(() => {
  if (ORIGINAL_CHALLENGE_TTL === undefined) {
    delete process.env.PURCHASE_CHALLENGE_TTL_SECONDS;
  } else {
    process.env.PURCHASE_CHALLENGE_TTL_SECONDS = ORIGINAL_CHALLENGE_TTL;
  }

  if (ORIGINAL_WINDOW === undefined) {
    delete process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS;
  } else {
    process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS = ORIGINAL_WINDOW;
  }

  if (ORIGINAL_MAX_WALLET === undefined) {
    delete process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET;
  } else {
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET = ORIGINAL_MAX_WALLET;
  }

  if (ORIGINAL_MAX_IP === undefined) {
    delete process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP;
  } else {
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP = ORIGINAL_MAX_IP;
  }
});

describe("lib/purchase-anti-bot", () => {
  it("builds deterministic challenge message payload", () => {
    const message = buildPurchaseChallengeMessage({
      walletPublicKey: "Wallet1111111111111111111111111111111111111",
      propertyId: "torre-marina-premium",
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      quantity: 1,
      nonce: "nonce-1",
      expiresAtIso: "2026-03-20T00:00:30.000Z"
    });

    expect(message).toContain("Solana Purchase Challenge");
    expect(message).toContain("Wallet: Wallet1111111111111111111111111111111111111");
    expect(message).toContain("Property: torre-marina-premium");
    expect(message).toContain("Nonce: nonce-1");
    expect(message).toContain("Expires At: 2026-03-20T00:00:30.000Z");
  });

  it("enforces wallet/IP rate limit thresholds", async () => {
    process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET = "2";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP = "2";

    const wallet = `wallet-${randomUUID()}`;
    const ip = `ip-${randomUUID()}`;

    await assertPurchaseRateLimit({
      endpoint: "purchase_prepare",
      walletPublicKey: wallet,
      clientIp: ip
    });
    await assertPurchaseRateLimit({
      endpoint: "purchase_prepare",
      walletPublicKey: wallet,
      clientIp: ip
    });

    await expect(
      assertPurchaseRateLimit({
        endpoint: "purchase_prepare",
        walletPublicKey: wallet,
        clientIp: ip
      })
    ).rejects.toBeInstanceOf(PurchaseAntiBotError);
  });

  it("verifies and consumes challenge once (anti-replay)", async () => {
    process.env.PURCHASE_CHALLENGE_TTL_SECONDS = "120";
    process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET = "100";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP = "100";

    const wallet = Keypair.generate();
    const walletPublicKey = wallet.publicKey.toBase58();

    const challenge = await issuePurchaseChallenge({
      walletPublicKey,
      propertyId: "torre-marina-premium",
      candyMachineAddress: "9D7e6sH9QxU8SmR3TGbfnwRCG2Jx5Vt4upPDb9uWQ7Wx",
      clientIp: `ip-${randomUUID()}`
    });

    const messageBytes = new TextEncoder().encode(challenge.message);
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
    const signatureBase64 = Buffer.from(signature).toString("base64");

    await verifyAndConsumePurchaseChallenge({
      challengeId: challenge.challengeId,
      challengeSignatureBase64: signatureBase64,
      walletPublicKey,
      propertyId: "torre-marina-premium",
      candyMachineAddress: "9D7e6sH9QxU8SmR3TGbfnwRCG2Jx5Vt4upPDb9uWQ7Wx",
      quantity: 1
    });

    await expect(
      verifyAndConsumePurchaseChallenge({
        challengeId: challenge.challengeId,
        challengeSignatureBase64: signatureBase64,
        walletPublicKey,
        propertyId: "torre-marina-premium",
        candyMachineAddress: "9D7e6sH9QxU8SmR3TGbfnwRCG2Jx5Vt4upPDb9uWQ7Wx",
        quantity: 1
      })
    ).rejects.toBeInstanceOf(PurchaseAntiBotError);
  });

  it("rejects challenge verification when quantity mismatches", async () => {
    process.env.PURCHASE_CHALLENGE_TTL_SECONDS = "120";
    process.env.PURCHASE_RATE_LIMIT_WINDOW_SECONDS = "60";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_WALLET = "100";
    process.env.PURCHASE_RATE_LIMIT_MAX_BY_IP = "100";

    const wallet = Keypair.generate();
    const walletPublicKey = wallet.publicKey.toBase58();

    const challenge = await issuePurchaseChallenge({
      walletPublicKey,
      propertyId: "torre-marina-premium",
      candyMachineAddress: "9D7e6sH9QxU8SmR3TGbfnwRCG2Jx5Vt4upPDb9uWQ7Wx",
      quantity: 1,
      clientIp: `ip-${randomUUID()}`
    });

    const messageBytes = new TextEncoder().encode(challenge.message);
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
    const signatureBase64 = Buffer.from(signature).toString("base64");

    await expect(
      verifyAndConsumePurchaseChallenge({
        challengeId: challenge.challengeId,
        challengeSignatureBase64: signatureBase64,
        walletPublicKey,
        propertyId: "torre-marina-premium",
        candyMachineAddress: "9D7e6sH9QxU8SmR3TGbfnwRCG2Jx5Vt4upPDb9uWQ7Wx",
        quantity: 2
      })
    ).rejects.toBeInstanceOf(PurchaseAntiBotError);
  });
});
