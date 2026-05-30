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
