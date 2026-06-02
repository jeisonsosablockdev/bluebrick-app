import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  markCoreCandyMachineTransactionConfirmed,
  markCoreCandyMachineTransactionFailed,
  markCoreCandyMachineTransactionSigned,
  markCoreCandyMachineTransactionSubmitted,
  upsertCoreCandyMachinePreparedManifest
} from "@/lib/core-candy-machine-transaction-manifest-repository";

const queryMock = vi.fn(async (_sql: string, _params?: unknown[]) => ({ rows: [], rowCount: 1 }));

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (work: (client: { query: typeof queryMock }) => Promise<unknown>) => work({ query: queryMock })
}));

describe("core candy machine transaction manifest repository", () => {
  beforeEach(() => {
    queryMock.mockClear();
  });

  it("upserts prepared transactions idempotently by flow id and transaction index", async () => {
    await upsertCoreCandyMachinePreparedManifest({
      flowId: "flow-1",
      draftId: "draft-1",
      createdBy: "Admin111",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      transactions: [
        {
          txIndex: 0,
          txKind: "create-collection",
          serial: null,
          expectedAddress: "Collection111",
          transactionBase64: "prepared-create-collection"
        },
        {
          txIndex: 1,
          txKind: "add-owner-freeze-plugin",
          serial: 1,
          expectedAddress: "Asset111",
          transactionBase64: "prepared-owner-freeze"
        }
      ]
    });

    const insertSql = String(queryMock.mock.calls.find((call) => String(call[0]).includes("INSERT INTO core_candy_machine_transaction_manifest"))?.[0]);

    expect(insertSql).toContain("ON CONFLICT (flow_id, tx_index) DO UPDATE");
    expect(queryMock.mock.calls.filter((call) => String(call[0]).includes("INSERT INTO core_candy_machine_transaction_manifest"))).toHaveLength(2);
    expect(queryMock.mock.calls[1]?.[1]).toEqual(expect.arrayContaining([
      "flow-1",
      "draft-1",
      "Admin111",
      "Collection111",
      "Candy111",
      0,
      "create-collection",
      null,
      "Collection111"
    ]));
    expect(queryMock.mock.calls[2]?.[1]).toEqual(expect.arrayContaining([
      "add-owner-freeze-plugin",
      1,
      "Asset111"
    ]));
  });

  it("updates signed, submitted and confirmed states without changing transaction order", async () => {
    await markCoreCandyMachineTransactionSigned({
      flowId: "flow-1",
      txIndex: 1,
      signedTransactionBase64: "signed-owner-freeze"
    });
    await markCoreCandyMachineTransactionSubmitted({
      flowId: "flow-1",
      txIndex: 1,
      signature: "sig-owner-freeze"
    });
    await markCoreCandyMachineTransactionConfirmed({
      signature: "sig-owner-freeze",
      slot: 123
    });

    const sqlStatements = queryMock.mock.calls.map((call) => String(call[0]));

    expect(sqlStatements.some((sql) => sql.includes("status = 'signed'"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("status = 'submitted'"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("status = 'confirmed'"))).toBe(true);
    expect(queryMock.mock.calls[0]?.[1]).toEqual(expect.arrayContaining(["flow-1", 1]));
    expect(queryMock.mock.calls[1]?.[1]).toEqual(expect.arrayContaining(["flow-1", 1, "sig-owner-freeze"]));
    expect(queryMock.mock.calls[2]?.[1]).toEqual(expect.arrayContaining(["sig-owner-freeze", 123]));
  });

  it("records failed transactions with structured errors", async () => {
    await markCoreCandyMachineTransactionFailed({
      flowId: "flow-1",
      txIndex: 3,
      error: {
        code: "RPC_ERROR",
        message: "transaction failed"
      }
    });

    const sql = String(queryMock.mock.calls[0]?.[0]);
    const params = queryMock.mock.calls[0]?.[1] as unknown[];

    expect(sql).toContain("status = 'failed'");
    expect(params).toEqual(expect.arrayContaining(["flow-1", 3]));
    expect(params).toContain(JSON.stringify({ code: "RPC_ERROR", message: "transaction failed" }));
  });

  it("rejects unknown transaction kinds before touching the database", async () => {
    await expect(upsertCoreCandyMachinePreparedManifest({
      flowId: "flow-1",
      draftId: "draft-1",
      createdBy: "Admin111",
      collectionAddress: "Collection111",
      candyMachineAddress: "Candy111",
      transactions: [
        {
          txIndex: 0,
          txKind: "legacy-kind" as "mint",
          serial: null,
          expectedAddress: null,
          transactionBase64: "prepared"
        }
      ]
    })).rejects.toThrow("txKind is invalid.");

    expect(queryMock).not.toHaveBeenCalled();
  });
});
