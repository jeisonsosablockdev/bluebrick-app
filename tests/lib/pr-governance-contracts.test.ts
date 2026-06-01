import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("PR governance contracts", () => {
  it("documents artifact-pair expectations in PR readiness", () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts", "ci", "pr-ready.sh"),
      "utf8"
    );

    expect(source).toContain("artifact pair");
    expect(source).toContain("spec slice");
  });

  it("validates the PR head branch instead of the synthetic merge commit when available", () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts", "ci", "pr-ready.sh"),
      "utf8"
    );

    expect(source).toContain("HEAD_REVISION=\"origin/${HEAD_BRANCH_OVERRIDE}\"");
    expect(source).toContain("git merge-base \"origin/${BASE_REF}\" \"${HEAD_REVISION}\"");
    expect(source).toContain("\"${MERGE_BASE}..${HEAD_REVISION}\"");
  });

  it("keeps docs governance aware of Linear initiative branches", () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts", "ci", "check-required-docs.sh"),
      "utf8"
    );

    expect(source).toContain("requires_initiative_artifact_pair");
    expect(source).toContain("Linear initiative branch detected");
  });

  it("keeps PR open flow aligned with local preflight and labels", () => {
    const source = readFileSync(
      path.join(repoRoot, "scripts", "ci", "pr-open.sh"),
      "utf8"
    );

    expect(source).toContain("governance-only");
    expect(source).toContain("LABEL_ARGS");
  });
});
