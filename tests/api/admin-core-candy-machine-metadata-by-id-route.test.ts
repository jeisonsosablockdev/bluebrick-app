import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getCoreMetadataRecord: vi.fn()
}));

vi.mock("@/features/nft-minting/infrastructure/core-candy-machine-metadata-store", () => ({
  getCoreMetadataRecord: routeMocks.getCoreMetadataRecord
}));

import { GET } from "@/app/api/admin/core-candy-machine/metadata/[metadataId]/route";

describe("api/admin/core-candy-machine/metadata/[metadataId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves metadata IDs with .json suffix", async () => {
    routeMocks.getCoreMetadataRecord.mockReturnValue({
      id: "collection-id",
      kind: "collection",
      createdAt: "2026-03-17T00:00:00.000Z",
      payload: { name: "Collection" }
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata/collection-id.json");
    const response = await GET(request, {
      params: Promise.resolve({ metadataId: "collection-id.json" })
    });
    const payload = await response.json();

    expect(routeMocks.getCoreMetadataRecord).toHaveBeenCalledWith("collection-id");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(payload).toEqual({ name: "Collection" });
  });

  it("returns 404 when metadata record does not exist", async () => {
    routeMocks.getCoreMetadataRecord.mockReturnValue(null);

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/metadata/missing.json");
    const response = await GET(request, {
      params: Promise.resolve({ metadataId: "missing.json" })
    });
    const payload = await response.json();

    expect(routeMocks.getCoreMetadataRecord).toHaveBeenCalledWith("missing");
    expect(response.status).toBe(404);
    expect(payload.error).toBe("Metadata not found.");
  });
});
