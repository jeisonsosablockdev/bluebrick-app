import { beforeEach, describe, expect, it, vi } from "vitest";

type ImportJobRow = {
  id: string;
  actor_pubkey: string;
  draft_id: string | null;
  idempotency_key: string | null;
  source_file_name: string;
  source_mime_type: string;
  source_size_bytes: string;
  state: "queued" | "processing" | "completed" | "completed_with_errors" | "failed" | "delayed";
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  warnings_count: number;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  error_report_url: string | null;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  finished_at: Date | null;
  last_transition_at: Date;
};

const JOB_ID = "de9f5ea9-3fc0-4f6c-89df-f87b26af8f4a";

let selectedRow: ImportJobRow;

function buildImportJobRow(input: Partial<ImportJobRow> = {}): ImportJobRow {
  const now = new Date("2026-03-26T20:00:00.000Z");

  return {
    id: JOB_ID,
    actor_pubkey: "AdminPubkey111111111111111111111111111111111111",
    draft_id: null,
    idempotency_key: null,
    source_file_name: "import.csv",
    source_mime_type: "text/csv",
    source_size_bytes: "1024",
    state: "queued",
    total_rows: 10,
    processed_rows: 0,
    failed_rows: 0,
    warnings_count: 0,
    attempt_count: 0,
    max_attempts: 3,
    last_error: null,
    error_report_url: `/api/admin/assets/import-jobs/${JOB_ID}/errors`,
    created_at: now,
    updated_at: now,
    started_at: null,
    finished_at: null,
    last_transition_at: now,
    ...input
  };
}

const queryMock = vi.fn(async (sql: string, params: unknown[] = []) => {
  if (sql.includes("SELECT *") && sql.includes("FROM asset_import_jobs")) {
    return { rows: [selectedRow], rowCount: 1 };
  }

  if (sql.includes("UPDATE asset_import_jobs")) {
    const nextState = params[1] as ImportJobRow["state"];
    const nextAttempt = params[2] as number;

    return {
      rows: [
        buildImportJobRow({
          state: nextState,
          attempt_count: nextAttempt,
          max_attempts: selectedRow.max_attempts,
          last_error: String(params[3] ?? "")
        })
      ],
      rowCount: 1
    };
  }

  return { rows: [], rowCount: 1 };
});

vi.mock("@/lib/db/pool", () => ({
  withDbClient: async (
    work: (client: { query: typeof queryMock }) => Promise<unknown>
  ) => work({ query: queryMock })
}));

import { registerImportJobProcessingFailure } from "@/lib/admin/import-jobs";

describe("lib/admin/import-jobs registerImportJobProcessingFailure", () => {
  beforeEach(() => {
    queryMock.mockClear();
    selectedRow = buildImportJobRow();
  });

  it("requeues the job when attempts are still below maxAttempts", async () => {
    selectedRow = buildImportJobRow({
      attempt_count: 1,
      max_attempts: 3,
      state: "queued"
    });

    const result = await registerImportJobProcessingFailure(JOB_ID, "worker transient error", {
      source: "worker"
    });

    expect(result).toEqual({
      failedPermanently: false,
      attemptCount: 2,
      maxAttempts: 3,
      state: "queued"
    });

    const sqlStatements = queryMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO asset_import_job_dlq"))).toBe(false);
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO asset_import_job_errors"))).toBe(false);
  });

  it("moves the job to DLQ and records POISON_PILL once maxAttempts is exhausted", async () => {
    selectedRow = buildImportJobRow({
      attempt_count: 2,
      max_attempts: 3,
      state: "processing"
    });

    const result = await registerImportJobProcessingFailure(JOB_ID, "worker hard failure", {
      source: "worker",
      poison: true
    });

    expect(result).toEqual({
      failedPermanently: true,
      attemptCount: 3,
      maxAttempts: 3,
      state: "failed"
    });

    const sqlStatements = queryMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO asset_import_job_dlq"))).toBe(true);
    expect(sqlStatements.some((sql) => sql.includes("INSERT INTO asset_import_job_errors"))).toBe(true);

    const poisonPillInsert = queryMock.mock.calls.find(([sql]) =>
      String(sql).includes("INSERT INTO asset_import_job_errors")
    );
    expect(poisonPillInsert?.[1]?.[4]).toBe("POISON_PILL");
  });
});
