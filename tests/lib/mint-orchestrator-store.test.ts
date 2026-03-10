import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  calculateMintJobProgress,
  createMintJob,
  getBatchSignatures,
  getMintJob,
  isMintOrchestratorError,
  prepareNextMintBatch,
  reconcileMintJobSignatures,
  submitMintBatch
} from "@/lib/mint-orchestrator-store";

function createTestJob(totalItems = 3, batchSize = 2) {
  return createMintJob({
    createdBy: `admin-${randomUUID()}`,
    totalItems,
    batchSize,
    startSerial: 1
  });
}

describe("lib/mint-orchestrator-store", () => {
  it("creates jobs with pending items and serial sequence", () => {
    const job = createMintJob({
      createdBy: `admin-${randomUUID()}`,
      totalItems: 3,
      batchSize: 2,
      startSerial: 10
    });

    expect(job.status).toBe("draft");
    expect(job.items).toHaveLength(3);
    expect(job.items.map((item) => item.serial)).toEqual([10, 11, 12]);
    expect(calculateMintJobProgress(job)).toMatchObject({
      totalItems: 3,
      pending: 3
    });
  });

  it("prepares batches idempotently per job", () => {
    const job = createTestJob(4, 2);

    const first = prepareNextMintBatch({
      jobId: job.jobId,
      idempotencyKey: "same-key"
    });
    const second = prepareNextMintBatch({
      jobId: job.jobId,
      idempotencyKey: "same-key"
    });

    expect(first.batch.batchNo).toBe(1);
    expect(first.items).toHaveLength(2);
    expect(second.batch.batchNo).toBe(first.batch.batchNo);
    expect(second.items.map((item) => item.itemId)).toEqual(first.items.map((item) => item.itemId));
  });

  it("submits and reconciles signatures updating item statuses", () => {
    const job = createTestJob(2, 2);
    const prepared = prepareNextMintBatch({
      jobId: job.jobId,
      idempotencyKey: `idempotency-${randomUUID()}`
    });
    const [firstItem, secondItem] = prepared.items;
    const firstSignature = `sig-${randomUUID()}`;
    const secondSignature = `sig-${randomUUID()}`;

    submitMintBatch({
      jobId: job.jobId,
      batchNo: prepared.batch.batchNo,
      submissions: [
        {
          itemId: firstItem.itemId,
          serial: firstItem.serial,
          signature: firstSignature
        },
        {
          itemId: secondItem.itemId,
          serial: secondItem.serial,
          signature: secondSignature
        }
      ]
    });

    const reconciled = reconcileMintJobSignatures({
      jobId: job.jobId,
      resolutions: [
        {
          signature: firstSignature,
          confirmed: true,
          failed: false,
          errorMessage: null
        },
        {
          signature: secondSignature,
          confirmed: false,
          failed: true,
          errorMessage: "rejected"
        }
      ]
    });
    const refreshedJob = getMintJob(job.jobId);
    const refreshedFirst = refreshedJob.items.find((item) => item.itemId === firstItem.itemId);
    const refreshedSecond = refreshedJob.items.find((item) => item.itemId === secondItem.itemId);

    expect(reconciled.updatedItems).toHaveLength(2);
    expect(reconciled.job.status).toBe("partial");
    expect(refreshedFirst?.status).toBe("confirmed");
    expect(refreshedSecond?.status).toBe("failed");
    expect(getBatchSignatures(job.jobId).sort()).toEqual([firstSignature, secondSignature].sort());
  });

  it("blocks duplicate signatures across different items", () => {
    const job = createTestJob(2, 2);
    const prepared = prepareNextMintBatch({
      jobId: job.jobId,
      idempotencyKey: `idempotency-${randomUUID()}`
    });
    const [firstItem, secondItem] = prepared.items;
    const duplicateSignature = `sig-${randomUUID()}`;

    submitMintBatch({
      jobId: job.jobId,
      batchNo: prepared.batch.batchNo,
      submissions: [
        {
          itemId: firstItem.itemId,
          serial: firstItem.serial,
          signature: duplicateSignature
        }
      ]
    });

    try {
      submitMintBatch({
        jobId: job.jobId,
        batchNo: prepared.batch.batchNo,
        submissions: [
          {
            itemId: secondItem.itemId,
            serial: secondItem.serial,
            signature: duplicateSignature
          }
        ]
      });

      throw new Error("Expected duplicate signature validation error.");
    } catch (error) {
      expect(isMintOrchestratorError(error)).toBe(true);

      if (isMintOrchestratorError(error)) {
        expect(error.status).toBe(409);
        expect(error.message).toContain("Signature already used");
      }
    }
  });

  it("enforces permanent job authority for manual admin mutations", () => {
    const ownerPubkey = `admin-owner-${randomUUID()}`;
    const intruderPubkey = `admin-intruder-${randomUUID()}`;
    const job = createMintJob({
      createdBy: ownerPubkey,
      totalItems: 2,
      batchSize: 2,
      startSerial: 1
    });

    try {
      prepareNextMintBatch({
        jobId: job.jobId,
        idempotencyKey: `idempotency-${randomUUID()}`,
        actorPubkey: intruderPubkey
      });

      throw new Error("Expected authority mismatch error when preparing batch.");
    } catch (error) {
      expect(isMintOrchestratorError(error)).toBe(true);

      if (isMintOrchestratorError(error)) {
        expect(error.status).toBe(403);
        expect(error.message).toContain("authority");
      }
    }

    const prepared = prepareNextMintBatch({
      jobId: job.jobId,
      idempotencyKey: `idempotency-${randomUUID()}`,
      actorPubkey: ownerPubkey
    });
    const signature = `sig-${randomUUID()}`;
    const firstItem = prepared.items[0];

    try {
      submitMintBatch({
        jobId: job.jobId,
        batchNo: prepared.batch.batchNo,
        actorPubkey: intruderPubkey,
        submissions: [
          {
            itemId: firstItem.itemId,
            serial: firstItem.serial,
            signature
          }
        ]
      });

      throw new Error("Expected authority mismatch error when submitting batch.");
    } catch (error) {
      expect(isMintOrchestratorError(error)).toBe(true);

      if (isMintOrchestratorError(error)) {
        expect(error.status).toBe(403);
        expect(error.message).toContain("authority");
      }
    }

    submitMintBatch({
      jobId: job.jobId,
      batchNo: prepared.batch.batchNo,
      actorPubkey: ownerPubkey,
      submissions: [
        {
          itemId: firstItem.itemId,
          serial: firstItem.serial,
          signature
        }
      ]
    });

    try {
      reconcileMintJobSignatures({
        jobId: job.jobId,
        actorPubkey: intruderPubkey,
        resolutions: [
          {
            signature,
            confirmed: true,
            failed: false,
            errorMessage: null
          }
        ]
      });

      throw new Error("Expected authority mismatch error when reconciling signatures.");
    } catch (error) {
      expect(isMintOrchestratorError(error)).toBe(true);

      if (isMintOrchestratorError(error)) {
        expect(error.status).toBe(403);
        expect(error.message).toContain("authority");
      }
    }
  });
});
