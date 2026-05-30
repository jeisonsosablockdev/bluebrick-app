import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  cancelEditSessionUploads: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/repository", () => ({
  cancelEditSessionUploads: routeMocks.cancelEditSessionUploads
}));

import { POST } from "@/app/api/admin/assets/uploads/edit-session/cancel/route";

const draftId = "9f7d9f5d-536f-4fe2-bf8b-9155db01a3f6";
const editSessionId = "c6ff91e1-3084-4ce3-9674-4012f86b2e5d";
const actorPubkey = "AdminPubkey111111111111111111111111111111111111";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/assets/uploads/edit-session/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/assets/uploads/edit-session/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: actorPubkey
    });
    routeMocks.cancelEditSessionUploads.mockResolvedValue(3);
  });

  it("requires an admin caller", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "UserPubkey111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({ draftId, editSessionId }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.cancelEditSessionUploads).not.toHaveBeenCalled();
  });

  it("rejects invalid session identifiers", async () => {
    const response = await POST(createRequest({ draftId, editSessionId: "not-a-uuid" }));
    const payload = await response.json();

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("INVALID_CANCEL_REQUEST");
    expect(routeMocks.cancelEditSessionUploads).not.toHaveBeenCalled();
  });

  it("cancels finalized uploads for the abandoned edit session", async () => {
    const response = await POST(createRequest({ draftId, editSessionId }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.canceledUploads).toBe(3);
    expect(routeMocks.cancelEditSessionUploads).toHaveBeenCalledWith({
      draftId,
      editSessionId,
      actorPubkey
    });
  });
});
