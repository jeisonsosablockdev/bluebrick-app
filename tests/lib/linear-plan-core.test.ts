import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const {
  buildIntegrationBranchName,
  buildSliceBranchName,
  createLinearPlan,
  normalizeIssueId,
  normalizeSliceId
} = require("../../scripts/linear-plan-core.js");

async function createTemplateFile(rootDir: string) {
  const templateDir = path.join(rootDir, "docs", "templates");
  await mkdir(templateDir, { recursive: true });

  await writeFile(
    path.join(templateDir, "linear-single-issue-slices.template.md"),
    [
      "# Objective",
      "{{GOAL}}",
      "",
      "# Scope",
      "{{SCOPE_ITEMS}}",
      "",
      "# Non-goals",
      "{{NON_GOAL_ITEMS}}",
      "",
      "# Linear",
      "- Issue: `{{ISSUE_ID}}`",
      "- Owner: `{{OWNER}}`",
      "",
      "# Artifact Pair",
      "- Problem artifact: `{{PROBLEM_ARTIFACT}}`",
      "- Solution artifact: `{{SOLUTION_ARTIFACT}}`",
      "",
      "# Integration Branch",
      "`{{INTEGRATION_BRANCH}}`",
      "",
      "# Documentation Slice",
      "- Branch: `{{DOCUMENTATION_SLICE_BRANCH}}`",
      "- Objective: `{{DOCUMENTATION_SLICE_OBJECTIVE}}`",
      "",
      "# Slice Plan",
      "| Slice | Status | Branch | Objective | Scope tecnico | Validation | PR |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "{{SLICE_ROWS}}",
      "",
      "# Order of Execution",
      "{{EXECUTION_ORDER}}",
      "",
      "# Risks",
      "{{RISK_ITEMS}}",
      "",
      "# Test Plan First",
      "{{TEST_PLAN_FIRST_ITEMS}}",
      "",
      "# Completion Gate",
      "{{COMPLETION_GATE_ITEMS}}"
    ].join("\n"),
    "utf8"
  );
}

describe("scripts/linear-plan-core", () => {
  it("normalizes issue and slice ids predictably", () => {
    expect(normalizeIssueId("149")).toBe("BRI-149");
    expect(normalizeIssueId("bri-149")).toBe("BRI-149");
    expect(normalizeSliceId("1")).toBe("S01");
    expect(normalizeSliceId("s3")).toBe("S03");
  });

  it("builds integration and slice branches from the same parent slug", () => {
    expect(
      buildIntegrationBranchName({
        type: "feature",
        scope: "shared",
        slug: "single-issue-slice-planning",
        issueId: "BRI-149"
      })
    ).toBe("feature/shared-single-issue-slice-planning-bri-149-integration");

    expect(
      buildSliceBranchName({
        type: "feature",
        scope: "shared",
        slug: "single-issue-slice-planning",
        issueId: "BRI-149",
        sliceId: "S02",
        sliceSlug: "tooling-and-ci"
      })
    ).toBe("feature/shared-single-issue-slice-planning-bri-149-s02-tooling-and-ci");
  });

  it("renders a full issue body and command summary from the template", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "linear-plan-test-"));
    await createTemplateFile(rootDir);

    const result = await createLinearPlan({
      rootDir,
      issueId: "BRI-149",
      type: "feature",
      scope: "shared",
      slug: "single-issue-slice-planning",
      title: "Single-issue slice planning with integration branches",
      goal: "Institutionalize single-issue slice planning without Linear subissue noise.",
      scopeItems: [
        "Governance summaries and canonical git policy",
        "Guides, template, and helper tooling"
      ],
      nonGoals: ["No product UI or blockchain behavior changes"],
      risks: ["Over-documenting the flow without enough automation"],
      owner: "qa-user",
      slices: [
        "S01|Formalize governance policy|AGENTS.md, docs/governance/git-monorepo-policy.md|npm run validate:docs-governance",
        "S02|tooling-and-ci|Add generator and integration-target CI|scripts/linear-plan-core.js, .github/workflows, tests/lib|npm run validate"
      ]
    });

    expect(result.body).toContain("Issue: `BRI-149`");
    expect(result.body).toContain("Problem artifact: `docs/features/feature-single-issue-slice-planning.md`");
    expect(result.body).toContain("Solution artifact: `docs/features/feature-single-issue-slice-planning-implementation.md`");
    expect(result.body).toContain("feature/shared-single-issue-slice-planning-bri-149-integration");
    expect(result.body).toContain("feature/shared-single-issue-slice-planning-bri-149-s01-formalize-governance-policy");
    expect(result.body).toContain("feature/shared-single-issue-slice-planning-bri-149-s01-formalize-governance-policy");
    expect(result.body).toContain("feature/shared-single-issue-slice-planning-bri-149-s02-tooling-and-ci");
    expect(result.body).toContain("1. S01 - Formalize governance policy");
    expect(result.body).toContain("# Documentation Slice");
    expect(result.commandSummary).toContain("git checkout -b feature/shared-single-issue-slice-planning-bri-149-integration");
    expect(result.commandSummary).toContain("git checkout -b feature/shared-single-issue-slice-planning-bri-149-s02-tooling-and-ci");

    const templateCopy = await readFile(
      path.join(rootDir, "docs", "templates", "linear-single-issue-slices.template.md"),
      "utf8"
    );
    expect(templateCopy).toContain("{{SLICE_ROWS}}");
  });

  it("requires the first slice to be S01 so documentation owns the plan first", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "linear-plan-test-"));
    await createTemplateFile(rootDir);

    await expect(
      createLinearPlan({
        rootDir,
        issueId: "BRI-149",
        type: "fix",
        scope: "shared",
        slug: "agent-governance",
        title: "Agent governance enforcement",
        goal: "Harden workflow orchestration.",
        scopeItems: ["Governance docs and tooling"],
        nonGoals: ["No product behavior changes"],
        risks: ["Overfitting the workflow"],
        owner: "qa-user",
        slices: [
          "S02|tooling|Update generator and branch helpers|scripts|npm run validate"
        ]
      })
    ).rejects.toThrow("The first slice must be S01");
  });
});
