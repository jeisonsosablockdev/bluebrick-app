import { describe, expect, it } from "vitest";

import { readBoundedIntegerEnv } from "@/lib/runtime-config";

describe("runtime config", () => {
  it("reads bounded integer env values", () => {
    expect(readBoundedIntegerEnv({
      env: { SAMPLE_LIMIT: "7" },
      name: "SAMPLE_LIMIT",
      fallback: 3,
      min: 1,
      max: 10
    })).toBe(7);
  });

  it("caps values above the maximum", () => {
    expect(readBoundedIntegerEnv({
      env: { SAMPLE_LIMIT: "99" },
      name: "SAMPLE_LIMIT",
      fallback: 3,
      min: 1,
      max: 10
    })).toBe(10);
  });

  it("uses fallback for missing, fractional, or below-minimum values", () => {
    const base = {
      fallback: 3,
      min: 1,
      max: 10
    };

    expect(readBoundedIntegerEnv({
      ...base,
      env: {},
      name: "SAMPLE_LIMIT"
    })).toBe(3);
    expect(readBoundedIntegerEnv({
      ...base,
      env: { SAMPLE_LIMIT: "4.5" },
      name: "SAMPLE_LIMIT"
    })).toBe(3);
    expect(readBoundedIntegerEnv({
      ...base,
      env: { SAMPLE_LIMIT: "0" },
      name: "SAMPLE_LIMIT"
    })).toBe(3);
  });
});
