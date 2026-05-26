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

  it("keeps heavy validation on the guarded PR events without reintroducing label-triggered bypass paths", () => {
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["opened","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).toContain(
      `if: \${{ contains(fromJson('["opened","edited","synchronize","reopened","ready_for_review"]'), github.event.action) }}`
    );
    expect(workflowSource).toContain("      - opened");
    expect(workflowSource).toContain("      - synchronize");
    expect(workflowSource).toContain("      - edited");
    expect(workflowSource).toContain("      - reopened");
    expect(workflowSource).toContain("      - ready_for_review");
    expect(workflowSource).toContain("Exactly one scope label is required.");
    expect(workflowSource).toContain("Exactly one type label is required.");
    expect(workflowSource).toContain("Exactly one risk label is required.");
    expect(workflowSource).not.toContain("      - labeled");
    expect(workflowSource).not.toContain("      - unlabeled");
  });

  it("re-fetches the current PR state from the GitHub API before enforcing policy", () => {
    expect(workflowSource).toContain("github.rest.pulls.get");
    expect(workflowSource).toContain("const labels = (pr.labels || [])");
    expect(workflowSource).toContain("pull_number: prNumber");
  });
});
