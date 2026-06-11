import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("agent orchestration contracts", () => {
  it("keeps AGENTS.md aligned with artifact-first and spec-slice-first", () => {
    const source = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");

    expect(source).toContain("docs/features/feature-<slug>.md");
    expect(source).toContain("docs/fixes/fix-<slug>.md");
    expect(source).toContain("spec slice");
    expect(source).toContain("npm run task:init");
  });

  it("requires planner and docs agents to use artifact-first preconditions", () => {
    const planner = readFileSync(path.join(repoRoot, ".codex", "agents", "planner.toml"), "utf8");
    const docs = readFileSync(path.join(repoRoot, ".codex", "agents", "docs.toml"), "utf8");

    expect(planner).toContain("parent Linear issue");
    expect(planner).toContain("spec slice");
    expect(planner).toContain("Socratic clarification pass");
    expect(planner).toContain("Human Acceptance");
    expect(docs).toContain("problem artifact");
    expect(docs).toContain("solution artifact");
    expect(docs).toContain("Socratic breakdown");
    expect(docs).toContain("explain-like-socrates");
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
    expect(docsPolicy).toContain("spec slice");
    expect(docsPolicy).toContain("explain-like-socrates");
    expect(docsPolicy).toContain("Human Acceptance");
    expect(testingPolicy).toContain("test-plan-first");
  });
});
