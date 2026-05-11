import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  listAdminCollectionHealthRows: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/collection-health-read-model", () => ({
  listAdminCollectionHealthRows: routeMocks.listAdminCollectionHealthRows
}));

import { GET } from "@/app/api/admin/health/collections/route";

function createRequest(
  url = "https://example.com/api/admin/health/collections",
  headers?: Record<string, string>
): NextRequest {
  return new NextRequest(url, { method: "GET", headers });
}

describe("GET /api/admin/health/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.listAdminCollectionHealthRows.mockResolvedValue([
      {
        entryId: "entry-review",
        title: "Manual review entry",
        collectionAddress: "CollectionReview",
        candyMachineAddress: "CandyReview",
        healthState: "manual_review_required",
        source: "bootstrap",
        failureReason: "Bootstrap mapping requires manual review: google maps place invalid.",
        lastCheckedAt: "2026-04-28T13:00:00.000Z",
        cta: {
          href: "/admin/collections/entry-review",
          label: "View collection context"
        }
      }
    ]);
  });

  it("returns 403 when caller is not an authenticated admin with a pubkey", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "admin"
    });

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.listAdminCollectionHealthRows).not.toHaveBeenCalled();
  });

  it("returns 200 with the admin health payload", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].entryId).toBe("entry-review");
    expect(routeMocks.listAdminCollectionHealthRows).toHaveBeenCalledWith("Admin111");
  });

  it("returns the E2E fixture payload when the fixture cookie is present", async () => {
    const response = await GET(
      createRequest("https://example.com/api/admin/health/collections", {
        cookie: "brids_admin_collections_fixture=bri-101"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].entryId).toBe("entry-bri-101-review");
    expect(routeMocks.listAdminCollectionHealthRows).not.toHaveBeenCalled();
  });

  it("returns 500 when the health read model fails", async () => {
    routeMocks.listAdminCollectionHealthRows.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ADMIN_COLLECTIONS_HEALTH_FAILED");
  });
});
