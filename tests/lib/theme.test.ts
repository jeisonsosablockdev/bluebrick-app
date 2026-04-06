import { describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY, sanitizeThemeMode } from "@/lib/theme";

describe("theme utilities", () => {
  it("exposes a stable storage key", () => {
    expect(THEME_STORAGE_KEY).toBe("brids-ui-theme");
  });

  it("returns light for light values", () => {
    expect(sanitizeThemeMode("light")).toBe("light");
    expect(sanitizeThemeMode("LIGHT")).toBe("light");
  });

  it("returns dark for dark values", () => {
    expect(sanitizeThemeMode("dark")).toBe("dark");
    expect(sanitizeThemeMode("DaRk")).toBe("dark");
  });

  it("falls back to dark for unsupported values", () => {
    expect(sanitizeThemeMode("system")).toBe("dark");
    expect(sanitizeThemeMode("")).toBe("dark");
    expect(sanitizeThemeMode(null)).toBe("dark");
  });
});
