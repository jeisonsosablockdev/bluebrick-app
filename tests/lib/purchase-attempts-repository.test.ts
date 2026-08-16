import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  createPurchaseAttempt,
  getPurchaseAttemptBySignature,
  getPurchaseAttemptByWalletAndIdempotency,
  markPurchaseAttemptAssetVerificationFailed,
  markPurchaseAttemptConfirmed,
  markPurchaseAttemptFailed,
  markPurchaseAttemptFailedBySignature,
  markPurchaseAttemptPrepared,
  markPurchaseAttemptSubmitted
} from "@/features/checkout-payment/infrastructure/purchase-attempts-repository";

describe("features/checkout-payment/infrastructure/purchase-attempts-repository (in-memory)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("creates attempts in created state and resolves by wallet+idempotency key", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-1",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    expect(created.status).toBe("created");
    expect(created.preparedTxMessageBase64).toBeNull();
    expect(created.preparedPriceLamports).toBeNull();

    const found = await getPurchaseAttemptByWalletAndIdempotency({
      walletPublicKey,
      idempotencyKey
    });

    expect(found?.id).toBe(created.id);
  });

  it("transitions created -> prepared -> submitted", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-2",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    const prepared = await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ==",
      expectedAssetAddresses: [
        "Asset1111111111111111111111111111111111111",
        "Asset2222222222222222222222222222222222222"
      ]
    });
    expect(prepared?.status).toBe("prepared");
    expect(prepared?.preparedTxMessageBase64).toBe("AQ==");
    expect(prepared?.expectedAssetAddresses).toEqual([
      "Asset1111111111111111111111111111111111111",
      "Asset2222222222222222222222222222222222222"
    ]);
    expect(prepared?.verifiedAssetAddresses).toEqual([]);
    expect(prepared?.assetVerificationStatus).toBe("pending");

    const submitted = await markPurchaseAttemptSubmitted({
      id: created.id,
      signature: "sig-123"
    });
    expect(submitted?.status).toBe("submitted");
    expect(submitted?.txSignature).toBe("sig-123");
  });

  it("normalizes prepared price to zero when null is provided", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-null-price",
      clientIp: "127.0.0.1",
      quotedPriceLamports: null,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    const prepared = await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: null,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ=="
    });

    expect(prepared?.status).toBe("prepared");
    expect(prepared?.preparedPriceLamports).toBe(0);
  });

  it("allows marking attempts as failed", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-3",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    const failed = await markPurchaseAttemptFailed({
      id: created.id,
      errorCode: "TRANSACTION_FAILED",
      errorMessage: "boom"
    });

    expect(failed?.status).toBe("failed");
    expect(failed?.errorMessage).toBe("boom");
  });

  it("marks asset verification failed when a prepared attempt with expected assets fails", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-asset-verification-failed",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ==",
      expectedAssetAddresses: ["AssetFailed111111111111111111111111111111"]
    });

    const failed = await markPurchaseAttemptFailed({
      id: created.id,
      errorCode: "TRANSACTION_FAILED",
      errorMessage: "asset verification failed"
    });

    expect(failed?.status).toBe("failed");
    expect(failed?.assetVerificationStatus).toBe("failed");
    expect(failed?.assetVerificationError).toBe("asset verification failed");
    expect(failed?.assetVerificationCheckedAt).not.toBeNull();
  });

  it("resolves attempts by signature and marks them confirmed", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-4",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ=="
    });

    await markPurchaseAttemptSubmitted({
      id: created.id,
      signature: "sig-confirm-123"
    });

    const bySignature = await getPurchaseAttemptBySignature({ signature: "sig-confirm-123" });
    expect(bySignature?.id).toBe(created.id);
    expect(bySignature?.status).toBe("submitted");

    const confirmed = await markPurchaseAttemptConfirmed({
      signature: "sig-confirm-123",
      verifiedAssetAddresses: ["AssetConfirmed11111111111111111111111111111"]
    });
    expect(confirmed?.status).toBe("confirmed");
    expect(confirmed?.confirmedAt).not.toBeNull();
    expect(confirmed?.verifiedAssetAddresses).toEqual(["AssetConfirmed11111111111111111111111111111"]);
    expect(confirmed?.assetVerificationStatus).toBe("verified");
    expect(confirmed?.assetVerificationCheckedAt).not.toBeNull();
  });

  it("keeps an on-chain confirmed purchase confirmed when asset verification fails later", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-confirmed-asset-verification-failed",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ==",
      expectedAssetAddresses: ["AssetPending111111111111111111111111111111"]
    });
    await markPurchaseAttemptSubmitted({
      id: created.id,
      signature: "sig-confirmed-verification-failed-123"
    });
    await markPurchaseAttemptConfirmed({ signature: "sig-confirmed-verification-failed-123" });

    const updated = await markPurchaseAttemptAssetVerificationFailed({
      signature: "sig-confirmed-verification-failed-123",
      errorMessage: "asset verification failed after confirmation"
    });

    expect(updated?.status).toBe("confirmed");
    expect(updated?.errorCode).toBeNull();
    expect(updated?.errorMessage).toBeNull();
    expect(updated?.assetVerificationStatus).toBe("failed");
    expect(updated?.assetVerificationError).toBe("asset verification failed after confirmation");
    expect(updated?.assetVerificationCheckedAt).not.toBeNull();
  });

  it("does not regress confirmed attempt to failed when webhook is late", async () => {
    const walletPublicKey = `wallet-${randomUUID()}`;
    const idempotencyKey = `idem-${randomUUID()}`;
    const created = await createPurchaseAttempt({
      propertyId: "central-norte",
      walletPublicKey,
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      collectionAddress: "COL1111111111111111111111111111111111111111",
      challengeId: "challenge-5",
      clientIp: "127.0.0.1",
      quotedPriceLamports: 10_000,
      idempotencyKey,
      idempotencyExpiresAt: "2026-03-20T12:05:00.000Z"
    });

    await markPurchaseAttemptPrepared({
      id: created.id,
      preparedPriceLamports: 10_000,
      cacheUpdatedAt: "2026-03-20T12:00:00.000Z",
      preparedTxMessageBase64: "AQ=="
    });

    await markPurchaseAttemptSubmitted({
      id: created.id,
      signature: "sig-late-failed-123"
    });

    await markPurchaseAttemptConfirmed({ signature: "sig-late-failed-123" });
    const afterFailed = await markPurchaseAttemptFailedBySignature({
      signature: "sig-late-failed-123",
      errorCode: "ONCHAIN_FAILED",
      errorMessage: "late failure event"
    });

    expect(afterFailed?.status).toBe("confirmed");
  });
});
