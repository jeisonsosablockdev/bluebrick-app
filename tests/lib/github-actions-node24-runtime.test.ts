import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workflowsDir = path.join(process.cwd(), ".github", "workflows");
const prGovernanceWorkflow = readFileSync(
  path.join(workflowsDir, "pr-governance-develop.yml"),
  "utf8"
);
const integrationTargetsWorkflow = readFileSync(
  path.join(workflowsDir, "pr-validate-integration-targets.yml"),
  "utf8"
);
const releaseDrafterWorkflow = readFileSync(
  path.join(workflowsDir, "release-drafter.yml"),
  "utf8"
);

describe("GitHub Actions Node 24 runtime compatibility", () => {
  it("uses Node 24-compatible GitHub-maintained actions in PR governance", () => {
    expect(prGovernanceWorkflow).toContain("uses: actions/checkout@v6");
    expect(prGovernanceWorkflow).toContain("uses: actions/setup-node@v6");
    expect(prGovernanceWorkflow).toContain("uses: actions/github-script@v8");
    expect(integrationTargetsWorkflow).toContain("uses: actions/checkout@v6");
    expect(integrationTargetsWorkflow).toContain("uses: actions/setup-node@v6");

    expect(prGovernanceWorkflow).not.toContain("uses: actions/checkout@v4");
    expect(prGovernanceWorkflow).not.toContain("uses: actions/setup-node@v4");
    expect(prGovernanceWorkflow).not.toContain("uses: actions/github-script@v7");
    expect(integrationTargetsWorkflow).not.toContain("uses: actions/checkout@v4");
    expect(integrationTargetsWorkflow).not.toContain("uses: actions/setup-node@v4");
  });

  it("uses the Node 24-compatible release drafter major", () => {
    expect(releaseDrafterWorkflow).toContain(
      "uses: release-drafter/release-drafter@v7"
    );
    expect(releaseDrafterWorkflow).not.toContain(
      "uses: release-drafter/release-drafter@v6"
    );
  });

  it("keeps release drafter on push-only automation to avoid PR churn", () => {
    expect(releaseDrafterWorkflow).toContain("on:");
    expect(releaseDrafterWorkflow).toContain("  push:");
    expect(releaseDrafterWorkflow).toContain("      - develop");
    expect(releaseDrafterWorkflow).not.toContain("pull_request_target:");
    expect(releaseDrafterWorkflow).toContain("workflow_dispatch:");
  });

  it("does not rely on the Node 24 force flag workaround", () => {
    expect(prGovernanceWorkflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
    expect(integrationTargetsWorkflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
    expect(releaseDrafterWorkflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
  });
});
