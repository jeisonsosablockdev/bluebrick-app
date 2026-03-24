import { randomUUID } from "node:crypto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  createPurchaseAttempt,
  markPurchaseAttemptConfirmed,
  markPurchaseAttemptFailedBySignature,
  markPurchaseAttemptPrepared,
  markPurchaseAttemptSubmitted
} from "@/lib/purchase-attempts-repository";
import {
  getAdminDashboardOverview,
  getAdminSalesOverview
} from "@/lib/purchase-metrics-service";

async function seedAttempt(input: {
  signature: string;
  status: "confirmed" | "failed";
  quantity: number;
  candyMachineAddress: string;
  collectionAddress: string;
}): Promise<void> {
  const walletPublicKey = `wallet-${randomUUID()}`;
  const idempotencyKey = `idem-${randomUUID()}`;

  const created = await createPurchaseAttempt({
    propertyId: "torre-marina-premium",
    walletPublicKey,
    candyMachineAddress: input.candyMachineAddress,
    collectionAddress: input.collectionAddress,
    challengeId: "challenge-metrics",
    clientIp: "127.0.0.1",
    quantity: input.quantity,
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
    signature: input.signature
  });

  if (input.status === "confirmed") {
    await markPurchaseAttemptConfirmed({ signature: input.signature });
    return;
  }

  await markPurchaseAttemptFailedBySignature({
    signature: input.signature,
    errorCode: "ONCHAIN_FAILED",
    errorMessage: "mock failure"
  });
}

describe("lib/purchase-metrics-service", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  it("aggregates dashboard KPIs from purchase attempts", async () => {
    await seedAttempt({
      signature: `sig-${randomUUID()}`,
      status: "confirmed",
      quantity: 2,
      candyMachineAddress: "ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9",
      collectionAddress: "5vTFKv5xFagfTN7nqdBA6XYQDGdSxArZFS6P2j3orfP9"
    });

    await seedAttempt({
      signature: `sig-${randomUUID()}`,
      status: "failed",
      quantity: 1,
      candyMachineAddress: "ECPhPjUhjKpt2vSBSqasnRGT76KG5EW9cP1CQW8RTbg9",
      collectionAddress: "5vTFKv5xFagfTN7nqdBA6XYQDGdSxArZFS6P2j3orfP9"
    });

    const overview = await getAdminDashboardOverview({ range: "30d" });

    expect(overview.kpis.totalAttempts).toBeGreaterThanOrEqual(2);
    expect(overview.kpis.confirmedAttempts).toBeGreaterThanOrEqual(1);
    expect(overview.kpis.failedAttempts).toBeGreaterThanOrEqual(1);
    expect(overview.kpis.revenueLamports).toBeGreaterThanOrEqual(20_000);
    expect(overview.assetSummary.length).toBeGreaterThanOrEqual(1);
  });

  it("filters sales overview by status", async () => {
    const sales = await getAdminSalesOverview({ range: "30d", status: "confirmed" });

    expect(sales.meta.range).toBe("30d");
    expect(sales.recentSales.every((item) => item.status === "confirmed")).toBe(true);
  });
});
