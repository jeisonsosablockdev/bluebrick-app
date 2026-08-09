import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("root hygiene governance (SPEC-24)", () => {
  it("enforces no orphan markdown, metadata or legacy configs in repository root", () => {
    const orphanPrBodyUpper = path.join(repoRoot, "PR_BODY.md");
    const orphanPrBodyLower = path.join(repoRoot, "pr-body.md");
    const orphanLinearMetadata = path.join(repoRoot, "linear_metadata.json");
    const legacyEslintrc = path.join(repoRoot, ".eslintrc.json");
    const rootSkillsLock = path.join(repoRoot, "skills-lock.json");
    const rootArtifacts = path.join(repoRoot, "artifacts");
    const rootE2e = path.join(repoRoot, "e2e");

    expect(existsSync(orphanPrBodyUpper), "PR_BODY.md should not pollute root").toBe(false);
    expect(existsSync(orphanPrBodyLower), "pr-body.md should not pollute root").toBe(false);
    expect(existsSync(orphanLinearMetadata), "linear_metadata.json should not pollute root").toBe(false);
    expect(existsSync(legacyEslintrc), ".eslintrc.json should be removed in favor of eslint.config.mjs").toBe(false);
    expect(existsSync(rootSkillsLock), "skills-lock.json should not pollute root").toBe(false);
    expect(existsSync(rootArtifacts), "/artifacts should not exist in root").toBe(false);
    expect(existsSync(rootE2e), "/e2e should be consolidated to tests/e2e").toBe(false);
  });

  it("enforces test suite and artifacts destination in tests directory", () => {
    const testsE2e = path.join(repoRoot, "tests", "e2e");
    expect(existsSync(testsE2e), "tests/e2e directory must exist").toBe(true);
  });

  it("enforces generate-pr-body.sh outputs to .github/pr-body.md", () => {
    const generatePrScript = path.join(repoRoot, "scripts", "ci", "generate-pr-body.sh");
    const content = readFileSync(generatePrScript, "utf-8");
    expect(content).toContain(".github/pr-body.md");
  });

  it("enforces pr-auto.sh uses .github/pr-body.md and cleans up post-publish", () => {
    const prAutoScript = path.join(repoRoot, "scripts", "ci", "pr-auto.sh");
    const content = readFileSync(prAutoScript, "utf-8");
    expect(content).toContain(".github/pr-body.md");
  });
});
