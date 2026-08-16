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

describe("parent-work-target PR workflow", () => {
  it("listens to pull requests that target parent work branches", () => {
    expect(workflowSource).toContain("pull_request:");
    expect(workflowSource).toContain("feature/**");
    expect(workflowSource).toContain("fix/**");
    expect(workflowSource).toContain("security/**");
    expect(workflowSource).toContain("nft/**");
    expect(workflowSource).toContain("refactor/**");
    expect(workflowSource).toContain("ready_for_review");
  });

  it("runs validate and docs gates for parent work branch PRs", () => {
    expect(workflowSource).toContain("name: Validate (lint + typecheck + docs governance)");
    expect(workflowSource).toContain("run: pnpm validate");
    expect(workflowSource).toContain("name: Required Docs Sync Check");
    expect(workflowSource).toContain("run: bash ./scripts/ci/check-required-docs.sh");
  });

  it("uses dedicated concurrency for parent work branch PRs", () => {
    expect(workflowSource).toContain("concurrency:");
    expect(workflowSource).toContain("pr-parent-work-targets-${{ github.event.pull_request.number }}");
    expect(workflowSource).toContain("cancel-in-progress: true");
  });
});
