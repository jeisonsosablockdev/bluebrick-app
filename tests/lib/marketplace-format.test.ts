import { describe, expect, it } from "vitest";

import { formatMarketplaceSoldPercent } from "@/lib/marketplace-format";

describe("lib/marketplace-format", () => {
  it("formats marketplace sold percentages consistently", () => {
    expect(formatMarketplaceSoldPercent(25)).toBe("25%");
    expect(formatMarketplaceSoldPercent(12.5)).toBe("12.50%");
    expect(formatMarketplaceSoldPercent(12.0)).toBe("12%");
  });
});
