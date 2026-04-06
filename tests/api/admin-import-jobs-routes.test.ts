import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => {
  class MockImportJobInputError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(message: string, status = 400, code = "INVALID_IMPORT_REQUEST") {
      super(message);
      this.name = "ImportJobInputError";
      this.status = status;
      this.code = code;
    }
  }

  return {
    getRequestRole: vi.fn(),
    assertCreateImportRateLimit: vi.fn(),
    createImportJob: vi.fn(),
    enqueueImportJob: vi.fn(),
    markImportJobDelayed: vi.fn(),
    parseAndSanitizeImportRows: vi.fn(),
    getImportJobForActor: vi.fn(),
    listImportJobErrors: vi.fn(),
    isImportWorkerRequest: vi.fn(),
    processImportJobBatch: vi.fn(),
    registerImportJobProcessingFailure: vi.fn(),
    ImportJobInputError: MockImportJobInputError
  };
});

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/import-jobs", () => ({
  assertCreateImportRateLimit: routeMocks.assertCreateImportRateLimit,
  createImportJob: routeMocks.createImportJob,
  enqueueImportJob: routeMocks.enqueueImportJob,
  ImportJobInputError: routeMocks.ImportJobInputError,
  markImportJobDelayed: routeMocks.markImportJobDelayed,
  parseAndSanitizeImportRows: routeMocks.parseAndSanitizeImportRows,
  getImportJobForActor: routeMocks.getImportJobForActor,
  listImportJobErrors: routeMocks.listImportJobErrors,
  isImportWorkerRequest: routeMocks.isImportWorkerRequest,
  processImportJobBatch: routeMocks.processImportJobBatch,
  registerImportJobProcessingFailure: routeMocks.registerImportJobProcessingFailure
}));

import { POST as createImportJobRoute } from "@/app/api/admin/assets/import-jobs/route";
import { GET as getImportJobErrorsRoute } from "@/app/api/admin/assets/import-jobs/[id]/errors/route";
import { GET as getImportJobRoute } from "@/app/api/admin/assets/import-jobs/[id]/route";
import { POST as processImportJobRoute } from "@/app/api/admin/assets/import-jobs/process/route";

const VALID_UUID = "8fbead23-3231-4cb3-84c5-f7394f5df7ef";

function createJsonPostRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe("api/admin/assets/import-jobs routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });

    routeMocks.assertCreateImportRateLimit.mockResolvedValue(undefined);
    routeMocks.parseAndSanitizeImportRows.mockReturnValue([
      {
        assetName: "Tower",
        slug: "tower",
        internalCode: "TW-1",
        country: "CO",
        city: "Medellin"
      }
    ]);

    routeMocks.createImportJob.mockResolvedValue({
      inserted: true,
      job: {
        id: VALID_UUID,
        state: "queued"
      }
    });

    routeMocks.enqueueImportJob.mockResolvedValue(undefined);
    routeMocks.markImportJobDelayed.mockResolvedValue(undefined);
    routeMocks.getImportJobForActor.mockResolvedValue(null);
    routeMocks.listImportJobErrors.mockResolvedValue([]);
    routeMocks.isImportWorkerRequest.mockReturnValue(false);
    routeMocks.processImportJobBatch.mockResolvedValue({
      job: { state: "processing" },
      processedInBatch: 1,
      failedInBatch: 0,
      needsRequeue: false
    });
    routeMocks.registerImportJobProcessingFailure.mockResolvedValue({
      failedPermanently: false,
      attemptCount: 1,
      maxAttempts: 3,
      state: "queued"
    });
  });

  describe("POST /api/admin/assets/import-jobs", () => {
    it("returns 403 when caller is not admin", async () => {
      routeMocks.getRequestRole.mockReturnValue({ authenticated: false });

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        csvText: "assetName,slug,internalCode,country,city\nA,a,A1,CO,Medellin"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(403);
      expect(payload.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 when csvText is missing in JSON payload", async () => {
      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        fileName: "import.csv",
        mimeType: "text/csv"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error.code).toBe("MISSING_IMPORT_FILE");
    });

    it("creates and enqueues a new import job", async () => {
      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        fileName: "import.csv",
        mimeType: "text/csv",
        csvText: "assetName,slug,internalCode,country,city\nA,a,A1,CO,Medellin",
        draftId: VALID_UUID,
        idempotencyKey: "same-request"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(202);
      expect(payload).toMatchObject({
        importJobId: VALID_UUID,
        state: "queued",
        statusUrl: `/api/admin/assets/import-jobs/${VALID_UUID}`
      });

      expect(routeMocks.assertCreateImportRateLimit).toHaveBeenCalledTimes(1);
      expect(routeMocks.parseAndSanitizeImportRows).toHaveBeenCalledTimes(1);
      expect(routeMocks.createImportJob).toHaveBeenCalledTimes(1);
      expect(routeMocks.enqueueImportJob).toHaveBeenCalledTimes(1);
    });

    it("returns 200 and skips enqueue when idempotency returns existing job", async () => {
      routeMocks.createImportJob.mockResolvedValueOnce({
        inserted: false,
        job: {
          id: VALID_UUID,
          state: "processing"
        }
      });

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        fileName: "import.csv",
        mimeType: "text/csv",
        csvText: "assetName,slug,internalCode,country,city\nA,a,A1,CO,Medellin"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.state).toBe("processing");
      expect(routeMocks.enqueueImportJob).not.toHaveBeenCalled();
    });

    it("returns 429 when rate limit is exceeded", async () => {
      routeMocks.assertCreateImportRateLimit.mockRejectedValueOnce(
        new routeMocks.ImportJobInputError("Rate limit exceeded", 429, "IMPORT_RATE_LIMITED")
      );

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        fileName: "import.csv",
        mimeType: "text/csv",
        csvText: "assetName,slug,internalCode,country,city\nA,a,A1,CO,Medellin"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(429);
      expect(payload.error.code).toBe("IMPORT_RATE_LIMITED");
    });

    it("marks job delayed when enqueue fails", async () => {
      routeMocks.enqueueImportJob.mockRejectedValueOnce(new Error("QStash down"));

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs", {
        fileName: "import.csv",
        mimeType: "text/csv",
        csvText: "assetName,slug,internalCode,country,city\nA,a,A1,CO,Medellin"
      });

      const response = await createImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error.code).toBe("IMPORT_JOB_CREATE_FAILED");
      expect(routeMocks.markImportJobDelayed).toHaveBeenCalledWith(VALID_UUID, "QStash down");
    });
  });

  describe("GET /api/admin/assets/import-jobs/:id", () => {
    it("returns 400 when id is not UUIDv4", async () => {
      const request = new NextRequest("https://example.com/api/admin/assets/import-jobs/not-uuid");
      const response = await getImportJobRoute(request, {
        params: Promise.resolve({ id: "not-uuid" })
      });
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error.code).toBe("INVALID_IMPORT_JOB_ID");
    });

    it("returns delayed=true for stale queued jobs", async () => {
      routeMocks.getImportJobForActor.mockResolvedValueOnce({
        id: VALID_UUID,
        state: "queued",
        lastTransitionAt: new Date(Date.now() - 61_000).toISOString(),
        totalRows: 10,
        processedRows: 2,
        failedRows: 0,
        warningsCount: 0,
        errorReportUrl: `/api/admin/assets/import-jobs/${VALID_UUID}/errors`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        finishedAt: null
      });

      const request = new NextRequest(`https://example.com/api/admin/assets/import-jobs/${VALID_UUID}`);
      const response = await getImportJobRoute(request, {
        params: Promise.resolve({ id: VALID_UUID })
      });
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.importJobId).toBe(VALID_UUID);
      expect(payload.delayed).toBe(true);
    });
  });

  describe("GET /api/admin/assets/import-jobs/:id/errors", () => {
    it("returns 403 when caller is not admin", async () => {
      routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

      const request = new NextRequest(`https://example.com/api/admin/assets/import-jobs/${VALID_UUID}/errors`);
      const response = await getImportJobErrorsRoute(request, {
        params: Promise.resolve({ id: VALID_UUID })
      });
      const payload = await response.json();

      expect(response.status).toBe(403);
      expect(payload.error.code).toBe("FORBIDDEN");
    });

    it("maps errors and clamps limit/offset query params", async () => {
      routeMocks.getImportJobForActor.mockResolvedValueOnce({
        id: VALID_UUID,
        state: "completed_with_errors"
      });
      routeMocks.listImportJobErrors.mockResolvedValueOnce([
        {
          rowNumber: 2,
          columnName: "collectionSymbol",
          errorCode: "COLLECTION_SYMBOL_INVALID",
          errorMessage: "collectionSymbol has invalid format."
        }
      ]);

      const request = new NextRequest(
        `https://example.com/api/admin/assets/import-jobs/${VALID_UUID}/errors?limit=-20&offset=-1`
      );
      const response = await getImportJobErrorsRoute(request, {
        params: Promise.resolve({ id: VALID_UUID })
      });
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.count).toBe(1);
      expect(payload.limit).toBe(1);
      expect(payload.offset).toBe(0);
      expect(payload.errors[0]).toMatchObject({
        row: 2,
        column: "collectionSymbol",
        code: "COLLECTION_SYMBOL_INVALID",
        message: "collectionSymbol has invalid format."
      });

      expect(routeMocks.listImportJobErrors).toHaveBeenCalledWith(VALID_UUID, 1, 0);
    });
  });

  describe("POST /api/admin/assets/import-jobs/process", () => {
    it("returns 403 when caller is not admin and worker token is invalid", async () => {
      routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });
      routeMocks.isImportWorkerRequest.mockReturnValueOnce(false);

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs/process", {
        jobId: VALID_UUID
      });

      const response = await processImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(403);
      expect(payload.error.code).toBe("FORBIDDEN");
    });

    it("accepts worker token auth and re-enqueues when needed", async () => {
      routeMocks.getRequestRole.mockReturnValue({ authenticated: false });
      routeMocks.isImportWorkerRequest.mockReturnValueOnce(true);
      routeMocks.processImportJobBatch.mockResolvedValueOnce({
        job: { state: "processing" },
        processedInBatch: 100,
        failedInBatch: 0,
        needsRequeue: true
      });

      const request = createJsonPostRequest(
        "https://example.com/api/admin/assets/import-jobs/process",
        { jobId: VALID_UUID },
        { "x-import-worker-token": "token" }
      );

      const response = await processImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.ok).toBe(true);
      expect(payload.needsRequeue).toBe(true);
      expect(routeMocks.enqueueImportJob).toHaveBeenCalledWith(VALID_UUID);
    });

    it("returns explicit error for ImportJobInputError", async () => {
      routeMocks.processImportJobBatch.mockRejectedValueOnce(
        new routeMocks.ImportJobInputError("Import job not found.", 404, "IMPORT_JOB_NOT_FOUND")
      );

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs/process", {
        jobId: VALID_UUID
      });

      const response = await processImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(404);
      expect(payload.error.code).toBe("IMPORT_JOB_NOT_FOUND");
      expect(routeMocks.registerImportJobProcessingFailure).toHaveBeenCalledWith(
        VALID_UUID,
        "Import job not found.",
        {
          source: "worker",
          jobId: VALID_UUID
        }
      );
    });

    it("returns ok=false and retries enqueue on transient worker errors", async () => {
      routeMocks.processImportJobBatch.mockRejectedValueOnce(new Error("worker exploded"));
      routeMocks.registerImportJobProcessingFailure.mockResolvedValueOnce({
        failedPermanently: false,
        attemptCount: 2,
        maxAttempts: 3,
        state: "queued"
      });

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs/process", {
        jobId: VALID_UUID
      });

      const response = await processImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.ok).toBe(false);
      expect(payload.importJobId).toBe(VALID_UUID);
      expect(payload.failedPermanently).toBe(false);
      expect(routeMocks.registerImportJobProcessingFailure).toHaveBeenCalledTimes(1);
      expect(routeMocks.enqueueImportJob).toHaveBeenCalledWith(VALID_UUID);
    });

    it("returns ok=false and does not re-enqueue when worker failure is terminal", async () => {
      routeMocks.processImportJobBatch.mockRejectedValueOnce(new Error("worker hard failure"));
      routeMocks.registerImportJobProcessingFailure.mockResolvedValueOnce({
        failedPermanently: true,
        attemptCount: 3,
        maxAttempts: 3,
        state: "failed"
      });

      const request = createJsonPostRequest("https://example.com/api/admin/assets/import-jobs/process", {
        jobId: VALID_UUID
      });

      const response = await processImportJobRoute(request);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.ok).toBe(false);
      expect(payload.failedPermanently).toBe(true);
      expect(routeMocks.registerImportJobProcessingFailure).toHaveBeenCalledTimes(1);
      expect(routeMocks.enqueueImportJob).not.toHaveBeenCalled();
    });
  });
});
