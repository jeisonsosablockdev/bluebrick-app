import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  createPurchaseAttempt,
  getPurchaseAttemptBySignature,
  markPurchaseAttemptPrepared,
  markPurchaseAttemptSubmitted
} from "@/lib/purchase-attempts-repository";
import {
  listPurchaseWebhookEvents,
  processPurchaseHeliusWebhookPayload
} from "@/lib/purchase-webhook-reconciliation";

async function createSubmittedAttempt(signature: string): Promise<void> {
  const walletPublicKey = `wallet-${randomUUID()}`;
  const idempotencyKey = `idem-${randomUUID()}`;
  const created = await createPurchaseAttempt({
    propertyId: "torre-marina-premium",
    walletPublicKey,
    candyMachineAddress: "ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9",
    collectionAddress: "5vTFKv5xFagfTN7nqdBA6XYQDGdSxArZFS6P2j3orfP9",
    challengeId: "challenge-webhook-1",
    clientIp: "127.0.0.1",
    quotedPriceLamports: 10_000,
    idempotencyKey,
    idempotencyExpiresAt: "2026-03-20T23:59:59.000Z"
  });

  await markPurchaseAttemptPrepared({
    id: created.id,
    preparedPriceLamports: 10_000,
    cacheUpdatedAt: "2026-03-20T18:00:00.000Z",
    preparedTxMessageBase64: "AQ=="
  });

  await markPurchaseAttemptSubmitted({
    id: created.id,
    signature
  });
}

describe("lib/purchase-webhook-reconciliation", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("deduplicates webhook events and reconciles submitted attempt to confirmed", async () => {
    const signature = `sig-${randomUUID()}`;
    await createSubmittedAttempt(signature);

    const first = await processPurchaseHeliusWebhookPayload([
      {
        signature,
        slot: 123,
        type: "NFT_SALE",
        transactionError: null
      }
    ]);

    expect(first.received).toBe(1);
    expect(first.processed).toBe(1);
    expect(first.duplicates).toBe(0);
    expect(first.reconciled).toBe(1);

    const second = await processPurchaseHeliusWebhookPayload([
      {
        signature,
        slot: 123,
        type: "NFT_SALE",
        transactionError: null
      }
    ]);

    expect(second.received).toBe(1);
    expect(second.processed).toBe(0);
    expect(second.duplicates).toBe(1);
    expect(second.reconciled).toBe(0);

    const updated = await getPurchaseAttemptBySignature({ signature });
    expect(updated?.status).toBe("confirmed");

    const webhookEvents = await listPurchaseWebhookEvents({ signature, limit: 10 });
    expect(webhookEvents).toHaveLength(1);
  });

  it("does not regress confirmed attempt when a late failed event arrives", async () => {
    const signature = `sig-${randomUUID()}`;
    await createSubmittedAttempt(signature);

    await processPurchaseHeliusWebhookPayload([
      {
        signature,
        slot: 200,
        type: "NFT_SALE",
        transactionError: null
      }
    ]);

    await processPurchaseHeliusWebhookPayload([
      {
        signature,
        slot: 201,
        type: "NFT_SALE",
        transactionError: {
          error: "InstructionError"
        }
      }
    ]);

    const updated = await getPurchaseAttemptBySignature({ signature });
    expect(updated?.status).toBe("confirmed");
  });
});
