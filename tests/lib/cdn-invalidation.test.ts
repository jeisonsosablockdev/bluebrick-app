import { describe, expect, it } from "vitest";

import { normalizeInvalidationPaths } from "@/lib/asset-uploads/cdn-invalidation";

describe("lib/asset-uploads/cdn-invalidation", () => {
  it("normalizes full CDN URLs into distinct purge paths", () => {
    const result = normalizeInvalidationPaths([
      "https://cdn.example.com/assets/a.png?cache=old",
      "https://cdn.example.com/assets/a.png#hash",
      "https://cdn.example.com/assets/b.png"
    ]);

    expect(result).toEqual(["/assets/a.png", "/assets/b.png"]);
  });

  it("accepts absolute paths and drops invalid values", () => {
    const result = normalizeInvalidationPaths([
      "/assets/c.png",
      "   ",
      "javascript:alert(1)",
      "not-a-url"
    ]);

    expect(result).toEqual(["/assets/c.png"]);
  });
});
