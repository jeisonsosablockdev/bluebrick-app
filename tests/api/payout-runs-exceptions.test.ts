import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  rejectPayoutRun: vi.fn(),
  vetoDistributionItem: vi.fn(),
  triggerCircuitBreaker: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/features/staking-distribution/application/payout-settlement-flow", () => ({
  rejectPayoutRun: serviceMocks.rejectPayoutRun,
  vetoDistributionItem: serviceMocks.vetoDistributionItem,
  triggerCircuitBreaker: serviceMocks.triggerCircuitBreaker,
  PayoutSettlementFlowError: class PayoutSettlementFlowError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status = 400) {
      super(message);
      this.name = "PayoutSettlementFlowError";
      this.code = code;
      this.status = status;
    }
  }
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: authMocks.getRequestRole
}));

import { POST as rejectPost } from "@/app/api/admin/payout-runs/[id]/reject/route";
import { POST as vetoPost } from "@/app/api/admin/payout-runs/[id]/veto/route";
import { POST as circuitBreakerPost } from "@/app/api/admin/payout-runs/[id]/circuit-breaker/route";

describe("API Routes: Payout Runs Exceptions (Reject, Veto, Circuit Breaker)", () => {
  const adminActor = "admin-public-key-12345678901234567890";
  const runId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/admin/payout-runs/[id]/reject", () => {
    it("should reject non-admin users with 403", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "user",
        pubkey: "user-key"
      } as any);

      const request = new NextRequest(`http://localhost/api/admin/payout-runs/${runId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Calculations invalid" })
      });
      const response = await rejectPost(request, { params: Promise.resolve({ id: runId }) });

      expect(response.status).toBe(403);
    });

    it("should allow admin to reject run proposal", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: adminActor
      } as any);

      serviceMocks.rejectPayoutRun.mockResolvedValueOnce({ id: runId, status: "blocked" });

      const request = new NextRequest(`http://localhost/api/admin/payout-runs/${runId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Calculations invalid" })
      });
      const response = await rejectPost(request, { params: Promise.resolve({ id: runId }) });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.status).toBe("blocked");
    });
  });

  describe("POST /api/admin/payout-runs/[id]/veto", () => {
    it("should reject non-admin users with 403", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: false,
        role: "guest",
        pubkey: null
      } as any);

      const request = new NextRequest(`http://localhost/api/admin/payout-runs/${runId}/veto`, {
        method: "POST",
        body: JSON.stringify({ itemId: "item-1", reason: "AML flag" })
      });
      const response = await vetoPost(request, { params: Promise.resolve({ id: runId }) });

      expect(response.status).toBe(403);
    });

    it("should return 409 when attempting post-seal item veto", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: adminActor
      } as any);

      const { PayoutSettlementFlowError } = await import(
        "@/features/staking-distribution/application/payout-settlement-flow"
      );
      serviceMocks.vetoDistributionItem.mockRejectedValueOnce(
        new PayoutSettlementFlowError(
          "ERR_SEALED_RUN_VETO_PROHIBITED",
          "Granular item veto is prohibited on sealed runs.",
          409
        )
      );

      const request = new NextRequest(`http://localhost/api/admin/payout-runs/${runId}/veto`, {
        method: "POST",
        body: JSON.stringify({ itemId: "item-1", reason: "AML flag" })
      });
      const response = await vetoPost(request, { params: Promise.resolve({ id: runId }) });

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error.code).toBe("ERR_SEALED_RUN_VETO_PROHIBITED");
    });
  });

  describe("POST /api/admin/payout-runs/[id]/circuit-breaker", () => {
    it("should trigger emergency circuit breaker and return pause payload", async () => {
      authMocks.getRequestRole.mockReturnValueOnce({
        authenticated: true,
        role: "admin",
        pubkey: adminActor
      } as any);

      const mockPayload = {
        runId,
        localPaused: true,
        emergencyPausePayload: {
          runId,
          policyPda: "policy-pda",
          programId: "payout_settlement",
          nonce: 123456,
          expiresAt: 1755800300
        },
        activatedAt: new Date().toISOString()
      };

      serviceMocks.triggerCircuitBreaker.mockResolvedValueOnce(mockPayload);

      const request = new NextRequest(`http://localhost/api/admin/payout-runs/${runId}/circuit-breaker`, {
        method: "POST",
        body: JSON.stringify({ reason: "Exploit vulnerability detected in upstream feed", ttlSeconds: 300 })
      });
      const response = await circuitBreakerPost(request, { params: Promise.resolve({ id: runId }) });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.data.localPaused).toBe(true);
      expect(json.data.emergencyPausePayload.nonce).toBe(123456);
    });
  });
});
