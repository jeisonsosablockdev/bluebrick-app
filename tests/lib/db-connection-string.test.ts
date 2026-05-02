import { describe, expect, it } from "vitest";

import { normalizeDatabaseUrlForPg } from "@/lib/db/connection-string";

describe("lib/db/connection-string", () => {
  it("upgrades legacy sslmode aliases to verify-full by default", () => {
    const result = normalizeDatabaseUrlForPg(
      "postgresql://user:pass@example.com/db?channel_binding=require&sslmode=require"
    );

    expect(result).toContain("sslmode=verify-full");
    expect(result).toContain("channel_binding=require");
  });

  it("preserves verify-full when already explicit", () => {
    const result = normalizeDatabaseUrlForPg(
      "postgresql://user:pass@example.com/db?sslmode=verify-full"
    );

    expect(result).toContain("sslmode=verify-full");
  });

  it("preserves libpq compatibility opt-in", () => {
    const result = normalizeDatabaseUrlForPg(
      "postgresql://user:pass@example.com/db?uselibpqcompat=true&sslmode=require"
    );

    expect(result).toContain("uselibpqcompat=true");
    expect(result).toContain("sslmode=require");
  });
});
