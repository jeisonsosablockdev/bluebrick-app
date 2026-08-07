import { describe, it, expect } from "vitest";
import { fetchUserFreezeAssets } from "@/features/asset-freeze-control";

describe("Asset Freeze Control Feature Slice", () => {
  it("exports domain types and infrastructure repository functions", () => {
    expect(typeof fetchUserFreezeAssets).toBe("function");
  });
});
