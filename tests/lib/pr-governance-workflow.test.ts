import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "pr-governance-develop.yml");
const workflowSource = readFileSync(workflowPath, "utf8");

describe("PR governance workflow", () => {
  it("cancels superseded runs by PR number and event category", () => {
    expect(workflowSource).toContain("concurrency:");
    expect(workflowSource).toContain("pr-governance-develop-${{ github.event.pull_request.number }}");
    expect(workflowSource).toContain("&& 'full' || 'policy' }}");
    expect(workflowSource).toContain("cancel-in-progress: true");
  });

  it("keeps heavy validation on opened/synchronize events but skips policy on opened", () => {
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["opened","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["labeled","unlabeled","edited","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).not.toContain(
      `if: \${{ contains(fromJson('["opened","labeled","unlabeled","edited","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
  });

  it("re-fetches the current PR state from the GitHub API before enforcing policy", () => {
    expect(workflowSource).toContain("github.rest.pulls.get");
    expect(workflowSource).toContain("const labels = (pr.labels || [])");
    expect(workflowSource).toContain("pull_number: prNumber");
  });
});
