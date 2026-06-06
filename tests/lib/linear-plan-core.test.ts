import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const {
  buildFeatureBranchName,
  buildProblemArtifactPath,
  buildSliceBranchName,
  buildSpecBranchName,
  buildSolutionArtifactPath,
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
      "# Human Brief",
      "",
      "## Objective",
      "{{GOAL}}",
      "",
      "## Scope",
      "{{SCOPE_ITEMS}}",
      "",
      "## Non-goals",
      "{{NON_GOAL_ITEMS}}",
      "",
      "## Acceptance Criteria",
      "{{ACCEPTANCE_CRITERIA_ITEMS}}",
      "",
      "## Risks",
      "{{RISK_ITEMS}}",
      "",
      "## Open Questions",
      "{{OPEN_QUESTIONS_ITEMS}}",
      "",
      "# Technical Protocol for Agents",
      "",
      "## Linear",
      "- Issue: `{{ISSUE_ID}}`",
      "- Owner / branch handle: `{{OWNER}}`",
      "",
      "## Artifact Pair",
      "- Problem artifact: `{{PROBLEM_ARTIFACT}}`",
      "- Solution artifact: `{{SOLUTION_ARTIFACT}}`",
      "",
      "## Parent Work Branch",
      "`{{FEATURE_BRANCH}}`",
      "",
      "## SPEC Plan",
      "- First SPEC: `{{FIRST_SPEC_BRANCH}}`",
      "- Branch pattern: `{{SPEC_BRANCH_PATTERN}}`",
      "",
      "| SPEC | Status | Branch | Objective | Scope tecnico | Validation | PR |",
      "| --- | --- | --- | --- | --- | --- | --- |",
      "{{SPEC_ROWS}}",
      "",
      "## Order of Execution",
      "{{EXECUTION_ORDER}}",
      "",
      "## Test Plan First",
      "{{TEST_PLAN_FIRST_ITEMS}}",
      "",
      "## Completion Gate",
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

  it("builds parent work and SPEC branches from the same parent slug", () => {
    expect(
      buildFeatureBranchName({
        type: "feature",
        scope: "shared",
        slug: "fix-ui-elements",
        issueId: "BRI-38",
        owner: "czambrano"
      })
    ).toBe("feature/czambrano-BRI-38-fix-ui-elements");
    expect(
      buildSpecBranchName({
        owner: "czambrano",
        issueId: "BRI-38",
        specSlug: "landing-compliance-audit"
      })
    ).toBe("SPEC/czambrano-BRI-38-landing-compliance-audit");
    expect(
      buildSliceBranchName({
        owner: "czambrano",
        issueId: "BRI-38",
        sliceSlug: "landing-compliance-audit"
      })
    ).toBe("SPEC/czambrano-BRI-38-landing-compliance-audit");
  });

  it("supports issue-type-driven branch and artifact families beyond feature", () => {
    expect(
      buildFeatureBranchName({
        type: "bugfix",
        scope: "shared",
        slug: "login-redirect-fix",
        issueId: "BRI-171",
        owner: "czambrano"
      })
    ).toBe("bugfix/czambrano-BRI-171-login-redirect-fix");
    expect(
      buildFeatureBranchName({
        type: "hotfix",
        scope: "shared",
        slug: "session-cookie-restore",
        issueId: "BRI-172",
        owner: "czambrano"
      })
    ).toBe("hotfix/czambrano-BRI-172-session-cookie-restore");
    expect(
      buildFeatureBranchName({
        type: "epic",
        scope: "shared",
        slug: "admin-collections-console",
        issueId: "EPIC-011",
        owner: "czambrano"
      })
    ).toBe("epic/czambrano-EPIC-011-admin-collections-console");
    expect(
      buildProblemArtifactPath({ type: "bugfix", slug: "login-redirect-fix" })
    ).toBe("docs/fixes/fix-login-redirect-fix.md");
    expect(
      buildSolutionArtifactPath({ type: "hotfix", slug: "session-cookie-restore" })
    ).toBe("docs/fixes/fix-session-cookie-restore-implementation.md");
    expect(
      buildProblemArtifactPath({ type: "epic", slug: "admin-collections-console" })
    ).toBe("docs/features/feature-admin-collections-console.md");
  });

  it("renders a full issue body and command summary from the template", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "linear-plan-test-"));
    await createTemplateFile(rootDir);

    const result = await createLinearPlan({
      rootDir,
      issueId: "BRI-38",
      type: "feature",
      scope: "shared",
      slug: "fix-ui-elements",
      title: "Landing Page Rewrite (UI + Copy Compliance BRIDS)",
      goal: "Rewrite the BRIDS landing page with compliant UI and copy.",
      scopeItems: [
        "Landing UI cleanup and copy alignment",
        "Branch and documentation governance for the feature"
      ],
      nonGoals: ["No auth, blockchain, or backend behavior changes"],
      acceptanceCriteria: [
        "Copy stays neutral and compliant",
        "The landing remains responsive"
      ],
      risks: ["Copy drift from the approved compliance annex"],
      openQuestions: ["Which sections need the strongest wording changes?"],
      owner: "czambrano",
      slices: [
        "S01|landing-compliance-audit|Audit landing content and structure|docs/features, app|npm run validate",
        "S02|hero-copy-ui-cleanup|Rewrite hero copy and CTA surfaces|app, components|npm run validate",
        "S03|supporting-sections-compliance|Normalize supporting sections and disclaimers|app, components|npm run validate"
      ]
    });

    expect(result.body).toContain("Issue: `BRI-38`");
    expect(result.body).toContain("Problem artifact: `docs/features/feature-fix-ui-elements.md`");
    expect(result.body).toContain("Solution artifact: `docs/features/feature-fix-ui-elements-implementation.md`");
    expect(result.body).toContain("feature/czambrano-BRI-38-fix-ui-elements");
    expect(result.body).toContain("SPEC/czambrano-BRI-38-landing-compliance-audit");
    expect(result.body).toContain("SPEC/czambrano-BRI-38-hero-copy-ui-cleanup");
    expect(result.body).toContain("SPEC/czambrano-BRI-38-supporting-sections-compliance");
    expect(result.body).toContain("1. S01 - Audit landing content and structure");
    expect(result.body).toContain("## SPEC Plan");
    expect(result.commandSummary).toContain("git checkout -b feature/czambrano-BRI-38-fix-ui-elements");
    expect(result.commandSummary).toContain("git checkout -b SPEC/czambrano-BRI-38-hero-copy-ui-cleanup");

    const templateCopy = await readFile(
      path.join(rootDir, "docs", "templates", "linear-single-issue-slices.template.md"),
      "utf8"
    );
    expect(templateCopy).toContain("{{SPEC_ROWS}}");
  });

  it("requires the first SPEC to be S01 so documentation owns the plan first", async () => {
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
    ).rejects.toThrow("The first SPEC must be S01");
  });
});
