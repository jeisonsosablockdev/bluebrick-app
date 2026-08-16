import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  prepareAuthorityLifecycleOperation: vi.fn(),
  isCoreAuthorityLifecycleInputError: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/asset-freeze-control/application/core-authority-lifecycle", () => ({
  prepareAuthorityLifecycleOperation: routeMocks.prepareAuthorityLifecycleOperation,
  isCoreAuthorityLifecycleInputError: routeMocks.isCoreAuthorityLifecycleInputError
}));

import { POST } from "@/app/api/admin/core-candy-machine/authorities/prepare/route";

describe("api/admin/core-candy-machine/authorities/prepare", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
    routeMocks.isCoreAuthorityLifecycleInputError.mockReturnValue(false);
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "user",
      pubkey: "11111111111111111111111111111111"
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid body", async () => {
    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json"
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("forwards payload and returns prepared operation", async () => {
    routeMocks.prepareAuthorityLifecycleOperation.mockResolvedValue({
      operationId: "op-1",
      role: "transfer_delegate",
      operation: "rotate",
      transactions: []
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionAddress: "5Q5mY8Fr8fS6fB6f9q5zBPRn2w4m4nqjLCY5h9S9kXPS",
        role: "transfer_delegate",
        operation: "rotate",
        newAuthority: "8NfQF6K3XfMiH4r3Q8YjA5q5V6wG6b1W9ZkL8rC9t4u1",
        multisig: {
          proposalId: "proposal-1",
          proposer: "11111111111111111111111111111111",
          executor: "11111111111111111111111111111111",
          approverSigners: ["11111111111111111111111111111111"]
        }
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(routeMocks.prepareAuthorityLifecycleOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        payerPublicKey: "11111111111111111111111111111111",
        role: "transfer_delegate",
        operation: "rotate"
      })
    );
  });

  it("preserves structured input errors", async () => {
    const inputError = new Error("multisig.approverSigners must be a non-empty array.");
    Object.assign(inputError, { status: 400 });

    routeMocks.prepareAuthorityLifecycleOperation.mockRejectedValue(inputError);
    routeMocks.isCoreAuthorityLifecycleInputError.mockReturnValue(true);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/authorities/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collectionAddress: "11111111111111111111111111111111",
        role: "transfer_delegate",
        operation: "rotate",
        multisig: {
          proposalId: "p",
          proposer: "11111111111111111111111111111111",
          executor: "11111111111111111111111111111111",
          approverSigners: []
        }
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("multisig.approverSigners must be a non-empty array.");
  });
});
