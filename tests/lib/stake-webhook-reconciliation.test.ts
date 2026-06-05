import { beforeEach, describe, expect, it, vi } from "vitest";

const web3Mocks = vi.hoisted(() => ({
  getTransaction: vi.fn()
}));

vi.mock("@solana/web3.js", async () => {
  const actual = await vi.importActual<typeof import("@solana/web3.js")>("@solana/web3.js");

  return {
    ...actual,
    Connection: class MockConnection {
      getTransaction = web3Mocks.getTransaction;
    }
  };
});

import {
  createStakeActionAttempt,
  getStakeActionAttemptBySignature,
  markStakeActionAttemptSubmitted
} from "@/lib/stake-attempts-repository";
import { listStakeProfileEventsByWallet } from "@/lib/stake-profile-events-repository";
import {
  processStakeHeliusWebhookPayload,
  reconcileSubmittedStakeActionBySignature
} from "@/lib/stake-webhook-reconciliation";

describe("lib/stake-webhook-reconciliation", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    vi.clearAllMocks();
    web3Mocks.getTransaction.mockResolvedValue({
      slot: 123,
      blockTime: 1_800_000_000,
      meta: { err: null },
      transaction: {
        message: {
          staticAccountKeys: [
            {
              toBase58: () => "Wallet11111111111111111111111111111111111"
            }
          ]
        }
      }
    });
  });

  it("deduplicates Helius stake events and persists a validated profile record", async () => {
    const attempt = await createStakeActionAttempt({
      idempotencyKey: "idem-1",
      walletPublicKey: "Wallet11111111111111111111111111111111111",
      assetAddress: "Asset111",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      propertyId: "property-1",
      propertyTitle: "Torre Magnolia",
      productAction: "stake",
      preparedTxMessageBase64: "AQ=="
    });

    await markStakeActionAttemptSubmitted({
      attemptId: attempt.id,
      txSignature: "sig-1"
    });

    const first = await processStakeHeliusWebhookPayload([
      {
        signature: "sig-1",
        slot: 123,
        type: "UNKNOWN",
        transactionError: null
      }
    ]);

    expect(first.received).toBe(1);
    expect(first.processed).toBe(1);
    expect(first.duplicates).toBe(0);
    expect(first.reconciled).toBe(1);

    const second = await processStakeHeliusWebhookPayload([
      {
        signature: "sig-1",
        slot: 123,
        type: "UNKNOWN",
        transactionError: null
      }
    ]);

    expect(second.duplicates).toBe(1);

    const events = await listStakeProfileEventsByWallet("Wallet11111111111111111111111111111111111");
    expect(events).toHaveLength(1);
    expect(events[0]?.productAction).toBe("stake");
    expect(events[0]?.blockchainAction).toBe("freeze");
    expect(events[0]?.validationStatus).toBe("validated");
  });

  it("reconciles submitted stake attempts directly from canonical RPC without a webhook", async () => {
    web3Mocks.getTransaction.mockResolvedValue({
      slot: 456,
      blockTime: 1_800_000_100,
      meta: { err: null },
      transaction: {
        message: {
          staticAccountKeys: [
            {
              toBase58: () => "Wallet22222222222222222222222222222222222"
            }
          ]
        }
      }
    });

    const attempt = await createStakeActionAttempt({
      idempotencyKey: "idem-2",
      walletPublicKey: "Wallet22222222222222222222222222222222222",
      assetAddress: "Asset222",
      collectionAddress: "Collection222",
      candyMachineAddress: "Candy222",
      propertyId: "property-2",
      propertyTitle: "Vista Mar",
      productAction: "unstake",
      preparedTxMessageBase64: "AQ=="
    });

    await markStakeActionAttemptSubmitted({
      attemptId: attempt.id,
      txSignature: "sig-2"
    });

    const reconciled = await reconcileSubmittedStakeActionBySignature({ signature: "sig-2" });

    expect(reconciled).toMatchObject({
      status: "validated",
      attemptId: attempt.id,
      errorMessage: null
    });

    const updatedAttempt = await getStakeActionAttemptBySignature("sig-2");
    expect(updatedAttempt?.status).toBe("validated");

    const events = await listStakeProfileEventsByWallet("Wallet22222222222222222222222222222222222");
    expect(events).toHaveLength(1);
    expect(events[0]?.productAction).toBe("unstake");
    expect(events[0]?.blockchainAction).toBe("unfreeze");
    expect(events[0]?.validationStatus).toBe("validated");
  });
});
