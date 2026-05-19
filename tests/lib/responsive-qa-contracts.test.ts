import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("responsive QA contracts", () => {
  it("treats ambiguous evidence and missing route-state proof as blocking", () => {
    const source = readFileSync(
      path.join(repoRoot, ".codex", "workflows", "responsive-qa.md"),
      "utf8"
    );

    expect(source).toContain("ambiguous or unreadable capture blocks completion");
    expect(source).toContain("Route-state artifact index");
    expect(source).toContain("global page overflow");
  });

  it("keeps testing policy aligned with blocking responsive evidence rules", () => {
    const source = readFileSync(
      path.join(repoRoot, ".codex", "policies", "testing-policy.md"),
      "utf8"
    );

    expect(source).toContain("ambiguous evidence is a blocking failure");
    expect(source).toContain("global overflow");
  });
});
