import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  submitAuthorityLifecycleSignedTransactions: vi.fn(),
  isCoreAuthorityLifecycleInputError: vi.fn(),
  isCoreAuthorityLifecycleSubmitRecoverableError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/asset-freeze-control/application/core-authority-lifecycle", () => ({
  submitAuthorityLifecycleSignedTransactions: routeMocks.submitAuthorityLifecycleSignedTransactions,
  isCoreAuthorityLifecycleInputError: routeMocks.isCoreAuthorityLifecycleInputError,
  isCoreAuthorityLifecycleSubmitRecoverableError: routeMocks.isCoreAuthorityLifecycleSubmitRecoverableError
}));

import { POST } from "@/app/api/admin/core-candy-machine/authorities/submit/route";

describe("api/admin/core-candy-machine/authorities/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
    routeMocks.isCoreAuthorityLifecycleInputError.mockReturnValue(false);
    routeMocks.isCoreAuthorityLifecycleSubmitRecoverableError.mockReturnValue(false);
  });

  it("returns 400 when body is invalid", async () => {
    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operationId: "op-1" })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns recoverable blockhash error metadata", async () => {
    const recoverableError = new Error("Transaction blockhash expired before submission.");
    Object.assign(recoverableError, { status: 409, code: "BLOCKHASH_EXPIRED" });

    routeMocks.submitAuthorityLifecycleSignedTransactions.mockRejectedValue(recoverableError);
    routeMocks.isCoreAuthorityLifecycleSubmitRecoverableError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationId: "op-1",
        signedTransactions: [
          {
            kind: "authority-rotate-transfer-delegate",
            operationId: "op-1",
            transactionBase64: "AQID"
          }
        ]
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.code).toBe("BLOCKHASH_EXPIRED");
    expect(payload.recoverable).toBe(true);
  });

  it("returns structured input errors", async () => {
    const inputError = new Error("operationId not found.");
    Object.assign(inputError, { status: 404 });

    routeMocks.submitAuthorityLifecycleSignedTransactions.mockRejectedValue(inputError);
    routeMocks.isCoreAuthorityLifecycleInputError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationId: "missing-op",
        signedTransactions: [
          {
            kind: "authority-rotate-transfer-delegate",
            operationId: "missing-op",
            transactionBase64: "AQID"
          }
        ]
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe("operationId not found.");
  });

  it("returns operation payload when submit succeeds", async () => {
    routeMocks.submitAuthorityLifecycleSignedTransactions.mockResolvedValue({
      operationId: "op-1",
      role: "transfer_delegate",
      operation: "rotate",
      authorityVersion: 2,
      authorityPublicKey: "11111111111111111111111111111111",
      collectionAddress: "11111111111111111111111111111111",
      submittedAt: "2026-04-01T00:00:00.000Z",
      signatures: []
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationId: "op-1",
        signedTransactions: [
          {
            kind: "authority-rotate-transfer-delegate",
            operationId: "op-1",
            transactionBase64: "AQID"
          }
        ]
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.operation.operationId).toBe("op-1");
  });
});
