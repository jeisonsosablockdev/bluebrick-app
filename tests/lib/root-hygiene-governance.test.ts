import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("root hygiene governance (SPEC-02)", () => {
  it("enforces no orphan markdown or metadata files in repository root", () => {
    const orphanPrBodyUpper = path.join(repoRoot, "PR_BODY.md");
    const orphanPrBodyLower = path.join(repoRoot, "pr-body.md");
    const orphanLinearMetadata = path.join(repoRoot, "linear_metadata.json");

    expect(existsSync(orphanPrBodyUpper), "PR_BODY.md should not pollute root").toBe(false);
    expect(existsSync(orphanPrBodyLower), "pr-body.md should not pollute root").toBe(false);
    expect(existsSync(orphanLinearMetadata), "linear_metadata.json should not pollute root").toBe(false);
  });
});
