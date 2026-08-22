import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  listPendingOverridesForCompliance: vi.fn(),
  requestPayoutOverride: vi.fn(),
  approvePayoutOverrideWithMultisig: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/features/staking-distribution/application/payout-override-service", () => ({
  listPendingOverridesForCompliance: serviceMocks.listPendingOverridesForCompliance,
  requestPayoutOverride: serviceMocks.requestPayoutOverride,
  approvePayoutOverrideWithMultisig: serviceMocks.approvePayoutOverrideWithMultisig,
  PayoutOverrideServiceError: class PayoutOverrideServiceError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status = 400) {
      super(`${code}: ${message}`);
      this.name = "PayoutOverrideServiceError";
      this.code = code;
      this.status = status;
    }
  }
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: authMocks.getRequestRole
}));

import { GET, POST } from "@/app/api/admin/compliance/overrides/route";
import { POST as approvePost } from "@/app/api/admin/compliance/overrides/[id]/approve/route";

describe("API: /api/admin/compliance/overrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validOriginal = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";
  const validRequested = "AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi";

  describe("GET /api/admin/compliance/overrides", () => {
    it("should reject unauthenticated requests with 403", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: false,
        role: "guest",
        pubkey: null
      } as any);

      const request = new NextRequest("http://localhost/api/admin/compliance/overrides");
      const response = await GET(request);
      expect(response.status).toBe(403);
    });

    it("should return pending overrides for admin", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: "admin-pubkey"
      } as any);

      serviceMocks.listPendingOverridesForCompliance.mockResolvedValueOnce([
        {
          id: "OVR-1",
          original_wallet: validOriginal,
          requested_wallet: validRequested,
          effective_wallet: validOriginal,
          case_number: "CASE-001",
          status: "PENDING",
          version: 1,
          reason: "Test",
          requested_by: "admin",
          approved_by: null,
          approval_tx_signature: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      const request = new NextRequest("http://localhost/api/admin/compliance/overrides");
      const response = await GET(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.length).toBe(1);
    });
  });

  describe("POST /api/admin/compliance/overrides", () => {
    it("should reject invalid body schemas with 400", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: "admin-pubkey"
      } as any);

      const request = new NextRequest("http://localhost/api/admin/compliance/overrides", {
        method: "POST",
        body: JSON.stringify({
          originalWallet: "too-short",
          caseNumber: ""
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should create override when body is valid", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: "admin-pubkey"
      } as any);

      serviceMocks.requestPayoutOverride.mockResolvedValueOnce({
        id: "OVR-1",
        original_wallet: validOriginal,
        requested_wallet: validRequested,
        effective_wallet: validOriginal,
        case_number: "CASE-001",
        status: "PENDING",
        version: 1,
        reason: "Valid",
        requested_by: "admin-pubkey",
        approved_by: null,
        approval_tx_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const request = new NextRequest("http://localhost/api/admin/compliance/overrides", {
        method: "POST",
        body: JSON.stringify({
          originalWallet: validOriginal,
          requestedWallet: validRequested,
          caseNumber: "CASE-001",
          reason: "Valid Reason"
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.ok).toBe(true);
    });
  });

  describe("POST /api/admin/compliance/overrides/[id]/approve", () => {
    it("should execute approval when authorized", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: "admin-pubkey"
      } as any);

      serviceMocks.approvePayoutOverrideWithMultisig.mockResolvedValueOnce({
        id: "OVR-1",
        original_wallet: validOriginal,
        requested_wallet: validRequested,
        effective_wallet: validRequested,
        case_number: "CASE-001",
        status: "APPROVED",
        version: 2,
        reason: "Valid",
        requested_by: "admin-pubkey",
        approved_by: "admin-pubkey",
        approval_tx_signature: "5wHu8vXy4KaN9...sig123",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const request = new NextRequest("http://localhost/api/admin/compliance/overrides/OVR-1/approve", {
        method: "POST",
        body: JSON.stringify({
          expectedVersion: 1,
          approvalTxSignature: "5wHu8vXy4KaN9zPtQm1L9kXy4KaN9zPtQm1L9kXy4KaN9"
        })
      });

      const response = await approvePost(request, { params: Promise.resolve({ id: "OVR-1" }) });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe("APPROVED");
    });
  });
});
