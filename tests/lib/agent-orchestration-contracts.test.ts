import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("agent orchestration contracts", () => {
  it("keeps AGENTS.md aligned with artifact-first and documentation-slice-first", () => {
    const source = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");

    expect(source).toContain("docs/features/feature-<slug>.md");
    expect(source).toContain("docs/fixes/fix-<slug>.md");
    expect(source).toContain("documentation slice");
  });

  it("requires planner and docs agents to use artifact-first preconditions", () => {
    const planner = readFileSync(path.join(repoRoot, ".codex", "agents", "planner.toml"), "utf8");
    const docs = readFileSync(path.join(repoRoot, ".codex", "agents", "docs.toml"), "utf8");

    expect(planner).toContain("parent Linear issue");
    expect(planner).toContain("documentation slice");
    expect(docs).toContain("problem artifact");
    expect(docs).toContain("solution artifact");
  });

  it("requires docs and testing policies to mention clarification and tests-first contracts", () => {
    const docsPolicy = readFileSync(
      path.join(repoRoot, ".codex", "policies", "docs-policy.md"),
      "utf8"
    );
    const testingPolicy = readFileSync(
      path.join(repoRoot, ".codex", "policies", "testing-policy.md"),
      "utf8"
    );

    expect(docsPolicy).toContain("dual artifact");
    expect(docsPolicy).toContain("documentation slice");
    expect(testingPolicy).toContain("test-plan-first");
  });
});
