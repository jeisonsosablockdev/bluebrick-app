import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = path.join(
  process.cwd(),
  ".github",
  "workflows",
  "pr-validate-initiative-targets.yml"
);
const workflowSource = readFileSync(workflowPath, "utf8");

describe("initiative-target PR workflow", () => {
  it("listens to pull requests that target initiative branches", () => {
    expect(workflowSource).toContain("pull_request:");
    expect(workflowSource).toContain("initiative/**");
    expect(workflowSource).toContain("feature/**-integration");
    expect(workflowSource).toContain("fix/**-integration");
    expect(workflowSource).toContain("security/**-integration");
    expect(workflowSource).toContain("refactor/**-integration");
    expect(workflowSource).toContain("ready_for_review");
  });

  it("runs validate and docs gates for slice PRs", () => {
    expect(workflowSource).toContain("name: Validate (lint + typecheck + docs governance)");
    expect(workflowSource).toContain("run: npm run validate");
    expect(workflowSource).toContain("name: Required Docs Sync Check");
    expect(workflowSource).toContain("run: bash ./scripts/ci/check-required-docs.sh");
  });

  it("uses dedicated concurrency for initiative-target PRs", () => {
    expect(workflowSource).toContain("concurrency:");
    expect(workflowSource).toContain("pr-initiative-targets-${{ github.event.pull_request.number }}");
    expect(workflowSource).toContain("cancel-in-progress: true");
  });
});
