import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  createMarketplacePropertyEntryPersistent: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/property-marketplace-server", () => ({
  createMarketplacePropertyEntryPersistent: routeMocks.createMarketplacePropertyEntryPersistent
}));

import { POST } from "@/app/api/admin/marketplace/entries/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/admin/marketplace/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/admin/marketplace/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111111111111111111111111111111111111"
    });
    routeMocks.createMarketplacePropertyEntryPersistent.mockReturnValue({
      id: "asset-001",
      title: "Asset 001",
      listingStatus: "funding"
    });
  });

  it("returns 403 when caller is not admin", async () => {
    routeMocks.getRequestRole.mockReturnValueOnce({
      authenticated: true,
      role: "user",
      pubkey: "UserPubkey111111111111111111111111111111111111"
    });

    const response = await POST(createRequest({}));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("FORBIDDEN");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).not.toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(
      createRequest({
        entryId: "asset-001"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_MARKETPLACE_ENTRY");
  });

  it("returns 200 when marketplace entry is created", async () => {
    routeMocks.createMarketplacePropertyEntryPersistent.mockReturnValueOnce({
      id: "asset-001",
      title: "Central Tower",
      listingStatus: "funding"
    });

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        highlights: ["Project stage: construction"],
        investmentNotes: "Ready for marketplace listing",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        documents: [{ label: "Brochure", url: "https://cdn.example.com/brochure.pdf" }],
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111",
        snapshotId: "snapshot-001"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.id).toBe("asset-001");
    expect(routeMocks.createMarketplacePropertyEntryPersistent).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when entry already exists", async () => {
    routeMocks.createMarketplacePropertyEntryPersistent.mockImplementationOnce(() => {
      throw new Error("A marketplace entry with this id already exists.");
    });

    const response = await POST(
      createRequest({
        entryId: "asset-001",
        title: "Central Tower",
        city: "Bogota",
        country: "CO",
        address: "Calle 10 #12-34",
        imageUrl: "https://cdn.example.com/cover.jpg",
        shortDescription: "Tokenized building",
        supplyTotal: 1200,
        nftPriceUsd: 150,
        annualRoiPct: 12.5,
        collectionAddress: "CoLLeCt1on111111111111111111111111111111111",
        candyMachineAddress: "CanDyMach1ne1111111111111111111111111111111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("MARKETPLACE_ENTRY_CONFLICT");
  });
});
