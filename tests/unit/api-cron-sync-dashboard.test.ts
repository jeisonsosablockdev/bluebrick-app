/**
 * ============================================================================
 * @file tests/unit/api-cron-sync-dashboard.test.ts
 * @description Layer 1 & QA: Unit Test Suite for Vercel Cron Dashboard Sync Route
 * ============================================================================
 * Purpose: Verifies HTTP security invariants, authorization header checks,
 * dependency wiring, and status codes for /api/cron/sync-dashboard.
 *
 * Invariants Tested:
 *  - 401 Unauthorized when Authorization header is missing.
 *  - 401 Unauthorized when Bearer token does not match CRON_SECRET.
 *  - 200 OK when Bearer token matches CRON_SECRET and sync executes successfully.
 *  - 500 Internal Server Error when DashboardSyncService throws an exception.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-018-CRON-ROUTE
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/sync-dashboard/route";

// Mock the AI Ingestion dependencies
const mockExecuteSync = vi.fn();

vi.mock("@/features/ai-ingestion", async () => {
  const actual = await vi.importActual<any>("@/features/ai-ingestion");
  return {
    ...actual,
    GoogleServiceAccountAdapter: vi.fn(function () {
      return {
        getAccessToken: vi.fn(),
      };
    }),
    StreamingSpreadsheetAdapter: vi.fn(function () {
      return {
        parseDashboardWorkbook: vi.fn(),
      };
    }),
    DashboardSyncService: vi.fn(function () {
      return {
        executeSync: mockExecuteSync,
      };
    }),
  };
});

vi.mock("@/lib/infrastructure/db/neon-client", () => ({
  getDatabasePool: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
}));

describe("BBC-018: Vercel Cron Dashboard Sync Route (@spec BBC-018-CRON-ROUTE)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret-token-123" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 when Authorization header is completely missing", async () => {
    // Arrange: Request without headers
    const req = new NextRequest("http://localhost:3000/api/cron/sync-dashboard");

    // Act: Call GET handler
    const res = await GET(req);
    const body = await res.json();

    // Assert: Verify 401 status and unauthorized error
    expect(res.status).toBe(401);
    expect(body.error).toContain("Unauthorized");
    expect(mockExecuteSync).not.toHaveBeenCalled();
  });

  it("should return 401 when Bearer token does not match CRON_SECRET", async () => {
    // Arrange: Request with incorrect bearer token
    const req = new NextRequest("http://localhost:3000/api/cron/sync-dashboard", {
      headers: {
        authorization: "Bearer wrong-invalid-secret",
      },
    });

    // Act: Call GET handler
    const res = await GET(req);
    const body = await res.json();

    // Assert: Verify 401 status
    expect(res.status).toBe(401);
    expect(body.error).toContain("Unauthorized");
    expect(mockExecuteSync).not.toHaveBeenCalled();
  });

  it("should return 200 with result payload when Bearer token is valid", async () => {
    // Arrange: Mock successful sync result
    const expectedResult = {
      success: true,
      fileId: "1MToOPlgJnmrLk8kDYooyQeCrTqT3HtGl",
      timestamp: new Date().toISOString(),
      counts: {
        proyectos: 10,
        inversionistas: 13,
        inversiones: 19,
        fases: 98,
        oportunidades: 1,
        transacciones: 1,
        resumenes: 13,
      },
      metrics: {
        totalDurationMs: 1250,
        downloadLatencyMs: 300,
        parseLatencyMs: 250,
        dbTransactionLatencyMs: 700,
        totalEntitiesSynced: 155,
      },
    };
    mockExecuteSync.mockResolvedValueOnce(expectedResult);

    const req = new NextRequest("http://localhost:3000/api/cron/sync-dashboard", {
      headers: {
        authorization: "Bearer test-secret-token-123",
      },
    });

    // Act: Call GET handler
    const res = await GET(req);
    const body = await res.json();

    // Assert: Verify 200 status and returned data
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.counts.proyectos).toBe(10);
    expect(body.metrics.totalEntitiesSynced).toBe(155);
    expect(mockExecuteSync).toHaveBeenCalledTimes(1);
  });

  it("should return 500 when DashboardSyncService throws an unhandled error", async () => {
    // Arrange: Mock error from syncService
    mockExecuteSync.mockRejectedValueOnce(new Error("Neon PostgreSQL connection timeout"));

    const req = new NextRequest("http://localhost:3000/api/cron/sync-dashboard", {
      headers: {
        authorization: "Bearer test-secret-token-123",
      },
    });

    // Act: Call GET handler
    const res = await GET(req);
    const body = await res.json();

    // Assert: Verify 500 status and clean error message
    expect(res.status).toBe(500);
    expect(body.error).toContain("Internal Server Error");
    expect(body.message).toContain("Neon PostgreSQL connection timeout");
  });
});
