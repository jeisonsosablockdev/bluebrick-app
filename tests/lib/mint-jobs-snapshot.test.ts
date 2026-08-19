import { beforeEach, describe, expect, it, vi } from "vitest";

import { syncMintOrchestratorSnapshot } from "@/lib/mint-jobs/snapshot";

const queryMock = vi.fn(async (sql: string) => {
  if (sql.includes("RETURNING id")) {
    return { rows: [{ id: "persisted-item-id" }], rowCount: 1 };
  }

  return { rows: [], rowCount: 1 };
});

vi.mock("@/features/shared/infrastructure/db/pool", () => {
  return {
    withDbClient: async (work: (client: { query: typeof queryMock }) => Promise<void>) => {
      await work({ query: queryMock });
    }
  };
});

describe("lib/mint-jobs/snapshot", () => {
  beforeEach(() => {
    queryMock.mockClear();
  });

  it("persists job, batches, items and signatures using relational snapshot sync", async () => {
    await syncMintOrchestratorSnapshot({
      jobId: "job-1",
      status: "partial",
      totalItems: 1,
      collectionAddress: "Collection111",
      lastError: null,
      batches: [
        {
          batchNo: 1,
          idempotencyKey: "idem-1",
          status: "submitted",
          itemIds: ["item-1"],
          signatures: ["sig-1"],
          lastError: null
        }
      ],
      items: [
        {
          itemId: "item-1",
          serial: 1,
          status: "submitted",
          batchNo: 1,
          signature: "sig-1",
          expectedAddress: "Asset111",
          lastError: null
        }
      ]
    });

    const sqlStatements = queryMock.mock.calls.map((call) => String(call[0]));

    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO mint_jobs"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO mint_job_batches"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO mint_job_items"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO mint_item_signatures"))).toBe(true);
  });
});
