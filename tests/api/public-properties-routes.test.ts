import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listMarketplacePropertiesMock,
  listMarketplacePropertyCitiesMock,
  getMarketplacePropertyDetailOrThrowRpcMock
} = vi.hoisted(() => ({
  listMarketplacePropertiesMock: vi.fn(),
  listMarketplacePropertyCitiesMock: vi.fn(),
  getMarketplacePropertyDetailOrThrowRpcMock: vi.fn()
}));

vi.mock("@/lib/property-marketplace-server", () => ({
  listMarketplaceProperties: listMarketplacePropertiesMock,
  listMarketplacePropertyCities: listMarketplacePropertyCitiesMock,
  getMarketplacePropertyDetailOrThrowRpc: getMarketplacePropertyDetailOrThrowRpcMock
}));

import { GET as getProperties } from "@/app/properties/route";
import { GET as getPropertyById } from "@/app/properties/[id]/route";

describe("public property routes cache policy", () => {
  beforeEach(() => {
    listMarketplacePropertiesMock.mockReset();
    listMarketplacePropertyCitiesMock.mockReset();
    getMarketplacePropertyDetailOrThrowRpcMock.mockReset();
  });

  it("serves marketplace list with shared-cache headers", async () => {
    listMarketplacePropertiesMock.mockResolvedValue([
      {
        id: "prop-1",
        title: "Sample property"
      }
    ]);
    listMarketplacePropertyCitiesMock.mockResolvedValue(["Bogota"]);

    const response = await getProperties(new NextRequest("https://example.com/properties?city=Bogota"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=300, stale-while-revalidate=600");
    expect(payload.meta.total).toBe(1);
    expect(payload.meta.availableCities).toEqual(["Bogota"]);
  });

  it("serves property detail with shorter shared-cache headers", async () => {
    getMarketplacePropertyDetailOrThrowRpcMock.mockResolvedValue({
      id: "prop-1",
      title: "Sample property"
    });

    const response = await getPropertyById(new NextRequest("https://example.com/properties/prop-1"), {
      params: Promise.resolve({ id: "prop-1" })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=300");
    expect(payload.data.id).toBe("prop-1");
  });
});
