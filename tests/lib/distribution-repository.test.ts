import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetDistributionRepositoryStateForTests,
  appendDistributionAuditEvent,
  createDistributionDraft,
  finalizeDistributionRun,
  getDistributionRunById,
  listDistributionItemsByWallet,
  listDistributionAuditEvents,
  replaceDistributionItems
} from "@/features/staking-distribution/infrastructure/distribution-repository";

describe("features/staking-distribution/infrastructure/distribution-repository (in-memory)", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetDistributionRepositoryStateForTests();
  });

  it("creates idempotent drafts per period, policy, collection, and property", async () => {
    const input = {
      periodKey: "2026-05",
      collectionAddress: "Collection111",
      propertyId: "property-1",
      periodStartAt: "2026-05-01T05:00:00.000Z",
      periodEndAt: "2026-06-01T04:59:59.999Z",
      policyVersion: "v1",
      tokenMint: "USDC111",
      totalAmountMinor: 1_000_000n,
      createdByActorId: "admin-1"
    };

    const first = await createDistributionDraft(input);
    const second = await createDistributionDraft(input);

    expect(second.id).toBe(first.id);
    expect(second.collectionAddress).toBe("Collection111");
    expect(second.propertyId).toBe("property-1");
    expect(second.periodTimezone).toBe("America/Bogota");
    expect(second.status).toBe("draft");
  });

  it("blocks finalization when no distribution items were prepared", async () => {
    const run = await createDistributionDraft({
      periodKey: "2026-05",
      collectionAddress: "Collection222",
      propertyId: "property-2",
      periodStartAt: "2026-05-01T05:00:00.000Z",
      periodEndAt: "2026-06-01T04:59:59.999Z",
      policyVersion: "v1",
      tokenMint: "USDC111",
      totalAmountMinor: 1_000_000n,
      createdByActorId: "admin-1"
    });

    await expect(
      finalizeDistributionRun({
        runId: run.id,
        outputChecksum: "sha256:empty",
        finalizedByActorId: "admin-1"
      })
    ).rejects.toThrow("Distribution run has no prepared items.");

    const current = await getDistributionRunById(run.id);
    expect(current?.status).toBe("draft");
  });

  it("finalizes prepared items and prevents later item replacement", async () => {
    const run = await createDistributionDraft({
      periodKey: "2026-05",
      collectionAddress: "Collection444",
      propertyId: "property-4",
      periodStartAt: "2026-05-01T05:00:00.000Z",
      periodEndAt: "2026-06-01T04:59:59.999Z",
      policyVersion: "v1",
      tokenMint: "USDC111",
      totalAmountMinor: 1_000_000n,
      createdByActorId: "admin-1"
    });

    const items = await replaceDistributionItems({
      runId: run.id,
      items: [
        {
          walletPublicKey: "Wallet111",
          assetAddress: "Asset111",
          frozenSeconds: 3_600n,
          amountMinor: 1_000_000n,
          roundingRemainderRank: 0,
          itemPayload: { source: "test" }
        }
      ]
    });

    expect(items).toHaveLength(1);

    const finalized = await finalizeDistributionRun({
      runId: run.id,
      outputChecksum: "sha256:prepared",
      finalizedByActorId: "admin-1"
    });

    expect(finalized.status).toBe("finalized");
    expect(finalized.itemCount).toBe(1);
    expect(finalized.totalWallets).toBe(1);

    await expect(
      replaceDistributionItems({
        runId: run.id,
        items: []
      })
    ).rejects.toThrow("Finalized distribution runs are immutable.");
  });

  it("stores audit events as append-only records", async () => {
    const run = await createDistributionDraft({
      periodKey: "2026-05",
      collectionAddress: "Collection333",
      propertyId: "property-3",
      periodStartAt: "2026-05-01T05:00:00.000Z",
      periodEndAt: "2026-06-01T04:59:59.999Z",
      policyVersion: "v1",
      tokenMint: "USDC111",
      totalAmountMinor: 1_000_000n,
      createdByActorId: "admin-1"
    });

    await appendDistributionAuditEvent({
      runId: run.id,
      eventName: "draft_created",
      actorType: "admin",
      actorId: "admin-1",
      eventPayload: { source: "test" }
    });

    await appendDistributionAuditEvent({
      runId: run.id,
      eventName: "draft_reviewed",
      actorType: "admin",
      actorId: "admin-2",
      eventPayload: { reviewed: true }
    });

    const events = await listDistributionAuditEvents(run.id);

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.eventName)).toEqual(["draft_created", "draft_reviewed"]);
  });

  it("lists finalized distribution items scoped to one wallet for investor overview reads", async () => {
    const run = await createDistributionDraft({
      periodKey: "2026-05",
      collectionAddress: "Collection555",
      propertyId: "property-5",
      periodStartAt: "2026-05-01T05:00:00.000Z",
      periodEndAt: "2026-06-01T04:59:59.999Z",
      policyVersion: "v1",
      tokenMint: "USDC111",
      totalAmountMinor: 1_000_000n,
      createdByActorId: "admin-1"
    });

    await replaceDistributionItems({
      runId: run.id,
      outputChecksum: "sha256:wallet-items",
      items: [
        {
          walletPublicKey: "Wallet111",
          assetAddress: "Asset111",
          frozenSeconds: 3_600n,
          amountMinor: 700_000n,
          roundingRemainderRank: 0,
          itemPayload: { source: "overview" }
        },
        {
          walletPublicKey: "Wallet222",
          assetAddress: "Asset222",
          frozenSeconds: 1_800n,
          amountMinor: 300_000n,
          roundingRemainderRank: 1,
          itemPayload: { source: "overview" }
        }
      ]
    });

    await finalizeDistributionRun({
      runId: run.id,
      outputChecksum: "sha256:wallet-items",
      finalizedByActorId: "admin-1"
    });

    const walletItems = await listDistributionItemsByWallet("Wallet111");

    expect(walletItems).toHaveLength(1);
    expect(walletItems[0]?.walletPublicKey).toBe("Wallet111");
    expect(walletItems[0]?.amountMinor).toBe(700_000n);
    expect(walletItems[0]?.run.status).toBe("finalized");
    expect(walletItems[0]?.run.collectionAddress).toBe("Collection555");
  });
});
