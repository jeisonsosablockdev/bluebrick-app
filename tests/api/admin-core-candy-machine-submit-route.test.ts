import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  submitCoreCandyMachineSignedTransactions: vi.fn(),
  isCoreCandyMachineAdminInputError: vi.fn(),
  isCoreCandyMachineSubmitRecoverableError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/nft-minting/application/core-candy-machine-admin", () => ({
  submitCoreCandyMachineSignedTransactions: routeMocks.submitCoreCandyMachineSignedTransactions,
  isCoreCandyMachineAdminInputError: routeMocks.isCoreCandyMachineAdminInputError,
  isCoreCandyMachineSubmitRecoverableError: routeMocks.isCoreCandyMachineSubmitRecoverableError
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
    routeMocks.isCoreCandyMachineSubmitRecoverableError.mockReturnValue(false);
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

  it("returns recoverable blockhash error metadata", async () => {
    const recoverableError = new Error("Transaction blockhash expired before submission.");
    Object.assign(recoverableError, { status: 409, code: "BLOCKHASH_EXPIRED" });

    routeMocks.submitCoreCandyMachineSignedTransactions.mockRejectedValue(recoverableError);
    routeMocks.isCoreCandyMachineSubmitRecoverableError.mockReturnValue(true);

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

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Transaction blockhash expired before submission.");
    expect(payload.code).toBe("BLOCKHASH_EXPIRED");
    expect(payload.recoverable).toBe(true);
  });

  it("returns recoverable confirmation-timeout error metadata", async () => {
    const recoverableError = new Error("Timed out waiting for signature confirmation: abc123");
    Object.assign(recoverableError, { status: 409, code: "CONFIRMATION_TIMEOUT" });

    routeMocks.submitCoreCandyMachineSignedTransactions.mockRejectedValue(recoverableError);
    routeMocks.isCoreCandyMachineSubmitRecoverableError.mockReturnValue(true);

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

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Timed out waiting for signature confirmation: abc123");
    expect(payload.code).toBe("CONFIRMATION_TIMEOUT");
    expect(payload.recoverable).toBe(true);
  });

  it("forwards deployId for deploy trace correlation", async () => {
    routeMocks.submitCoreCandyMachineSignedTransactions.mockResolvedValue([]);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        deployId: "deploy-trace-1",
        signedTransactions: [
          {
            kind: "create-collection",
            serial: null,
            expectedAddress: null,
            transactionBase64: "AQID"
          }
        ]
      })
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(routeMocks.submitCoreCandyMachineSignedTransactions).toHaveBeenCalledWith({
      expectedPayerPublicKey: "11111111111111111111111111111111",
      deployId: "deploy-trace-1",
      signedTransactions: [
        {
          kind: "create-collection",
          serial: null,
          expectedAddress: null,
          transactionBase64: "AQID"
        }
      ]
    });
  });
});
