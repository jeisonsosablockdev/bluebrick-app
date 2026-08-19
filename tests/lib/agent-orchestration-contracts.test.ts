import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("agent orchestration contracts", () => {
  it("keeps AGENTS.md aligned with artifact-first and SPEC-first", () => {
    const source = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");

    expect(source).toContain("knowledge/features/feature-<slug>.md");
    expect(source).toContain("knowledge/fixes/fix-<slug>.md");
    expect(source).toContain("first SPEC");
    expect(source).toContain("task:init");
    expect(source).toContain("Definition of Done");
  });

  it("requires planner and docs agents to use artifact-first preconditions", () => {
    const planner = readFileSync(path.join(repoRoot, ".agents", "agents", "planner.yaml"), "utf8");
    const docs = readFileSync(path.join(repoRoot, ".agents", "agents", "docs.yaml"), "utf8");

    expect(planner).toContain("parent Linear issue");
    expect(planner).toContain("first SPEC");
    expect(planner).toContain("Human Acceptance");
    expect(docs).toContain("problem artifact");
    expect(docs).toContain("solution artifact");
    expect(docs).toContain("explain-like-socrates");
  });

  it("requires docs and testing policies to mention clarification and tests-first contracts", () => {
    const docsPolicy = readFileSync(
      path.join(repoRoot, "knowledge", "governance", "documentation-policy.md"),
      "utf8"
    );
    const testingPolicy = readFileSync(
      path.join(repoRoot, "knowledge", "governance", "security-quality-policy.md"),
      "utf8"
    );

    expect(docsPolicy).toContain("artifact");
    expect(docsPolicy).toContain("SPEC");
    expect(testingPolicy).toContain("Devnet");
  });
});
