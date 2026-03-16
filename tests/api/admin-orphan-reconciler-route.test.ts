import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  parseReconcileInput: vi.fn(),
  reconcileOrphanedUploads: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/asset-uploads/orphan-reconciler", () => ({
  parseReconcileInput: routeMocks.parseReconcileInput,
  reconcileOrphanedUploads: routeMocks.reconcileOrphanedUploads
}));

import { POST as orphanReconcilerRoute } from "@/app/api/admin/assets/uploads/orphan-reconciler/route";

function createJsonPostRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/assets/uploads/orphan-reconciler", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/assets/uploads/orphan-reconciler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.parseReconcileInput.mockReturnValue({
      dryRun: true,
      temporaryRetentionDays: 7,
      abandonedRetentionDays: 30,
      limit: 200
    });
    routeMocks.reconcileOrphanedUploads.mockResolvedValue({
      dryRun: true,
      temporaryRetentionDays: 7,
      abandonedRetentionDays: 30,
      limit: 200,
      candidates: 3,
      deleted: 0,
      byReason: { temporary: 2, abandoned: 1 },
      sampleUploadIds: ["a", "b"]
    });
  });

  it("returns 401 when unauthenticated", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });
    const response = await orphanReconcilerRoute(createJsonPostRequest({ dryRun: true }));
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({ authenticated: true, role: "operator" });
    const response = await orphanReconcilerRoute(createJsonPostRequest({ dryRun: true }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
  });

  it("returns reconcile summary payload on success", async () => {
    const response = await orphanReconcilerRoute(createJsonPostRequest({ dryRun: true, limit: 100 }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      dryRun: true,
      candidates: 3,
      deleted: 0
    });
  });
});
