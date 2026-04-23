import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  listAdminCollectionReadModels: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/admin/collections-read-model", () => ({
  listAdminCollectionReadModels: routeMocks.listAdminCollectionReadModels
}));

import { GET } from "@/app/api/admin/collections/route";

function createRequest(url = "https://example.com/api/admin/collections"): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/admin/collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "Admin111"
    });
    routeMocks.listAdminCollectionReadModels.mockResolvedValue([
      {
        entryId: "entry-1",
        title: "Ocean View Residences",
        coverImageUrl: "https://cdn.example.com/cover.jpg",
        collectionAddress: "Collection111",
        candyMachineAddress: "Candy111",
        updatedAt: "2026-04-23T07:00:00.000Z",
        validationState: "linked",
        editableSections: ["summary", "propertyInformation", "gallery", "documents"]
      },
      {
        entryId: "entry-2",
        title: "Harbor Point",
        coverImageUrl: "https://cdn.example.com/harbor.jpg",
        collectionAddress: "Collection222",
        candyMachineAddress: "Candy222",
        updatedAt: "2026-04-23T06:00:00.000Z",
        validationState: "inconsistent",
        editableSections: []
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
    expect(routeMocks.listAdminCollectionReadModels).not.toHaveBeenCalled();
  });

  it("returns 200 with the admin collections payload", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data).toHaveLength(2);
    expect(payload.data[0].entryId).toBe("entry-1");
    expect(routeMocks.listAdminCollectionReadModels).toHaveBeenCalledWith("Admin111");
  });

  it("returns 500 when the read model fails", async () => {
    routeMocks.listAdminCollectionReadModels.mockRejectedValueOnce(new Error("boom"));

    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ADMIN_COLLECTIONS_LIST_FAILED");
  });
});
