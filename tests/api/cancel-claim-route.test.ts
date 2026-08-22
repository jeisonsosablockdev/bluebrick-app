import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  cancelClaimQuote: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn()
}));

vi.mock("@/features/staking-distribution/application/claim-flow", () => ({
  cancelClaimQuote: serviceMocks.cancelClaimQuote,
  ClaimFlowError: class ClaimFlowError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = "ClaimFlowError";
      this.code = code;
    }
  }
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: authMocks.getRequestRole
}));

import { POST } from "@/app/api/claims/[claimId]/cancel/route";

describe("API: POST /api/claims/[claimId]/cancel", () => {
  const userWallet = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthenticated request with 401", async () => {
    authMocks.getRequestRole.mockReturnValueOnce({
      authenticated: false,
      role: "guest",
      pubkey: null
    } as any);

    const request = new NextRequest("http://localhost/api/claims/claim-123/cancel", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ claimId: "claim-123" }) });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 when user does not own the claim", async () => {
    authMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: userWallet
    } as any);

    const { ClaimFlowError } = await import("@/features/staking-distribution/application/claim-flow");
    serviceMocks.cancelClaimQuote.mockRejectedValueOnce(
      new ClaimFlowError("FORBIDDEN_OWNERSHIP", "You do not own this claim request.")
    );

    const request = new NextRequest("http://localhost/api/claims/claim-123/cancel", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ claimId: "claim-123" }) });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN_OWNERSHIP");
  });

  it("should return 400 when claim cannot be cancelled (e.g. already executed)", async () => {
    authMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: userWallet
    } as any);

    const { ClaimFlowError } = await import("@/features/staking-distribution/application/claim-flow");
    serviceMocks.cancelClaimQuote.mockRejectedValueOnce(
      new ClaimFlowError("INVALID_CLAIM_STATUS", "Cannot cancel claim in status 'executed'.")
    );

    const request = new NextRequest("http://localhost/api/claims/claim-123/cancel", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ claimId: "claim-123" }) });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("INVALID_CLAIM_STATUS");
  });

  it("should return 200 and canceled claim when authorized and valid", async () => {
    authMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: userWallet
    } as any);

    const mockCanceledClaim = {
      id: "claim-123",
      runId: "run-1",
      walletPublicKey: userWallet,
      payoutWallet: userWallet,
      status: "canceled"
    };

    serviceMocks.cancelClaimQuote.mockResolvedValueOnce(mockCanceledClaim);

    const request = new NextRequest("http://localhost/api/claims/claim-123/cancel", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ claimId: "claim-123" }) });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("canceled");
    expect(serviceMocks.cancelClaimQuote).toHaveBeenCalledWith({
      claimId: "claim-123",
      userWallet
    });
  });
});
