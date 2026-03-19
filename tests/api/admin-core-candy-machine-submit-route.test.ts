import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  submitCoreCandyMachineSignedTransactions: vi.fn(),
  isCoreCandyMachineAdminInputError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/core-candy-machine-admin", () => ({
  submitCoreCandyMachineSignedTransactions: routeMocks.submitCoreCandyMachineSignedTransactions,
  isCoreCandyMachineAdminInputError: routeMocks.isCoreCandyMachineAdminInputError
}));

import { POST } from "@/app/api/admin/core-candy-machine/submit/route";

describe("api/admin/core-candy-machine/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
    routeMocks.isCoreCandyMachineAdminInputError.mockReturnValue(false);
  });

  it("returns underlying non-input error message", async () => {
    routeMocks.submitCoreCandyMachineSignedTransactions.mockRejectedValue(
      new Error("Timed out waiting for signature confirmation: abc123")
    );

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signedTransactions: [
          {
            kind: "add-config-lines",
            serial: null,
            expectedAddress: null,
            transactionBase64: "AQID"
          }
        ]
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Timed out waiting for signature confirmation: abc123");
  });

  it("keeps returning input error status and message", async () => {
    const inputError = new Error("signedTransactions must be a non-empty array.");
    Object.assign(inputError, { status: 400 });

    routeMocks.submitCoreCandyMachineSignedTransactions.mockRejectedValue(inputError);
    routeMocks.isCoreCandyMachineAdminInputError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        signedTransactions: []
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("signedTransactions must be a non-empty array.");
  });
});
