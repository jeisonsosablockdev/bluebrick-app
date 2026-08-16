import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getComplianceCasesQueue: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/profile/application/case-service", () => ({
  ComplianceCaseServiceError: class ComplianceCaseServiceError extends Error {
    code: string;
    status: number;
    details?: Record<string, unknown>;

    constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
      super(message);
      this.code = code;
      this.status = status;
      this.details = details;
    }
  },
  getComplianceCasesQueue: routeMocks.getComplianceCasesQueue
}));

import { GET } from "@/app/api/admin/compliance/cases/route";

function createRequest(query = ""): NextRequest {
  return new NextRequest(`https://example.com/api/admin/compliance/cases${query}`, {
    method: "GET"
  });
}

describe("GET /api/admin/compliance/cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin1111111111111111111111111111111111111"
    });
    routeMocks.getComplianceCasesQueue.mockResolvedValue({
      items: [],
      nextCursor: null
    });
  });

  it("returns 403 for non-admin users", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "User11111111111111111111111111111111111111"
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns queue payload for admin", async () => {
    routeMocks.getComplianceCasesQueue.mockResolvedValueOnce({
      items: [
        {
          walletPublicKey: "Wallet11111111111111111111111111111111111",
          username: "case-a",
          kycStatus: "pending",
          amlStatus: "pending",
          amlRiskScore: 40,
          complianceStatus: "pending_review",
          isSuspended: false,
          complianceStatusUpdatedAt: "2026-03-26T00:00:00.000Z"
        }
      ],
      nextCursor: "cursor_1"
    });

    const response = await GET(createRequest("?status=pending_review&limit=20"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.nextCursor).toBe("cursor_1");
    expect(routeMocks.getComplianceCasesQueue).toHaveBeenCalledWith({
      status: "pending_review",
      cursor: undefined,
      limit: 20
    });
  });
});
