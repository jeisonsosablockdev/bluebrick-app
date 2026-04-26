import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "pr-governance-develop.yml");
const workflowSource = readFileSync(workflowPath, "utf8");

describe("PR governance workflow", () => {
  it("cancels superseded runs by PR number and event category", () => {
    expect(workflowSource).toContain("concurrency:");
    expect(workflowSource).toContain("pr-governance-develop-${{ github.event.pull_request.number }}");
    expect(workflowSource).toContain("&& 'full' || 'policy-lite' }}");
    expect(workflowSource).toContain("cancel-in-progress: true");
  });

  it("keeps heavy validation on opened/synchronize events and defers opened metadata enforcement explicitly", () => {
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["opened","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["opened","edited","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).toContain(
      `if: \${{ github.event.action == 'opened' }}`
    );
    expect(workflowSource).toContain(
      `if: \${{ github.event.action != 'opened' }}`
    );
    expect(workflowSource).toContain("PR governance policy deferred on opened.");
    expect(workflowSource).not.toContain("      - labeled");
    expect(workflowSource).not.toContain("      - unlabeled");
  });

  it("re-fetches the current PR state from the GitHub API before enforcing policy", () => {
    expect(workflowSource).toContain("github.rest.pulls.get");
    expect(workflowSource).toContain("const labels = (pr.labels || [])");
    expect(workflowSource).toContain("pull_number: prNumber");
  });
});
