import { readFile } from "node:fs/promises";
import path from "node:path";

type DriftCheck = {
  name: string;
  passed: boolean;
  details: string;
};

export type DriftReport = {
  generatedAt: string;
  checks: DriftCheck[];
};

async function readRepoFile(rootDir: string, relativePath: string): Promise<string> {
  return readFile(path.join(rootDir, relativePath), "utf8");
}

function extractDocumentationPolicyStatuses(source: string): string[] {
  const matches = [...source.matchAll(/`(draft|in-review|approved|implemented|rejected)`/g)];
  return [...new Set(matches.map((match) => match[1]))].sort();
}

function extractTemplateStatuses(source: string): string[] {
  const lines = source
    .split(/\r?\n/)
    .filter((line) => line.startsWith("- Status:") || line.startsWith("- Current status:"));
  const values = lines.flatMap((line) => {
    const match = line.match(/\(([^)]+)\)/);
    if (!match) {
      return [];
    }

    return match[1]
      .replaceAll("`", "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
  });

  return [...new Set(values)].sort();
}

function extractCheckerStatuses(source: string): string[] {
  const match = source.match(/case "\$\{metadata_status\}" in\s+([^)]+)\)\s+;;/s);
  if (!match) {
    return [];
  }

  return match[1]
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort();
}

function sameSet(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function buildGovernanceDriftReport(rootDir: string): Promise<DriftReport> {
  const [
    agentsSource,
    docsAgentSource,
    documentationPolicySource,
    gitMonorepoPolicySource,
    gitflowGuideSource,
    prPolicySource,
    prTemplateSource,
    developWorkflowSource,
    storyTemplateSource,
    docsCheckerSource
  ] = await Promise.all([
    readRepoFile(rootDir, "AGENTS.md"),
    readRepoFile(rootDir, ".codex/agents/docs.toml"),
    readRepoFile(rootDir, "docs/governance/documentation-policy.md"),
    readRepoFile(rootDir, "docs/governance/git-monorepo-policy.md"),
    readRepoFile(rootDir, "docs/guides/gitflow-pr-structure.md"),
    readRepoFile(rootDir, "docs/governance/pr-policy-source-of-truth.json"),
    readRepoFile(rootDir, ".github/pull_request_template.md"),
    readRepoFile(rootDir, ".github/workflows/pr-governance-develop.yml"),
    readRepoFile(rootDir, "docs/rfcs/templates/STORY.template.md"),
    readRepoFile(rootDir, "scripts/ci/check-required-docs.sh")
  ]);

  const policyStatuses = extractDocumentationPolicyStatuses(documentationPolicySource);
  const templateStatuses = extractTemplateStatuses(storyTemplateSource);
  const checkerStatuses = extractCheckerStatuses(docsCheckerSource);
  const prPolicy = JSON.parse(prPolicySource) as {
    requiredPrSections?: string[];
    patterns?: { humanAcceptanceApproved?: string };
  };

  const checks: DriftCheck[] = [
    {
      name: "AGENTS summary points to canonical documentation policy",
      passed: agentsSource.includes("docs/governance/documentation-policy.md"),
      details: "AGENTS.md should point to canonical documentation policy instead of redefining it."
    },
    {
      name: "AGENTS summary points to docs enforcement source",
      passed: agentsSource.includes("scripts/ci/check-required-docs.sh"),
      details: "AGENTS.md should point to the executable docs gate."
    },
    {
      name: "AGENTS summary points to PR policy SSOT",
      passed: agentsSource.includes("docs/governance/pr-policy-source-of-truth.json"),
      details: "AGENTS.md should point to the PR policy source of truth."
    },
    {
      name: "Documentation policy declares canonical precedence",
      passed:
        documentationPolicySource.includes("canonical documentation policy") &&
        documentationPolicySource.includes("check-required-docs.sh"),
      details: "Documentation policy should explain canonical precedence and the enforcement source."
    },
    {
      name: "RFC status values match across policy, template, and checker",
      passed: sameSet(policyStatuses, templateStatuses) && sameSet(policyStatuses, checkerStatuses),
      details: `policy=[${policyStatuses.join(", ")}] template=[${templateStatuses.join(", ")}] checker=[${checkerStatuses.join(", ")}]`
    },
    {
      name: "Shared branch names are documented in monorepo policy",
      passed:
        gitMonorepoPolicySource.includes("feature/shared-<name>") &&
        gitMonorepoPolicySource.includes("fix/shared-<name>") &&
        gitMonorepoPolicySource.includes("bugfix/<developer>-<issue>-<name>") &&
        gitMonorepoPolicySource.includes("hotfix/<developer>-<issue>-<name>") &&
        gitMonorepoPolicySource.includes("epic/<developer>-<issue>-<name>"),
      details:
        "Shared and issue-type-driven branch naming must stay visible in the branch naming convention."
    },
    {
      name: "Gitflow guide still points to PR policy SSOT",
      passed: gitflowGuideSource.includes("docs/governance/pr-policy-source-of-truth.json"),
      details: "The gitflow usage guide should continue pointing to the PR policy SSOT."
    },
    {
      name: "Documentation slices require explain-like-socrates",
      passed:
        agentsSource.includes("explain-like-socrates") &&
        docsAgentSource.includes("explain-like-socrates") &&
        documentationPolicySource.includes("explain-like-socrates") &&
        gitMonorepoPolicySource.includes("explain-like-socrates"),
      details: "The spec/documentation slice must keep the required Socratic skill visible across routing, docs agent, and governance."
    },
    {
      name: "Develop merge remains gated by Human Acceptance",
      passed:
        agentsSource.includes("Human Acceptance") &&
        gitMonorepoPolicySource.includes("HUMAN ACCEPTANCE GATE BEFORE DEVELOP") &&
        Array.isArray(prPolicy.requiredPrSections) &&
        prPolicy.requiredPrSections.includes("human acceptance") &&
        Boolean(prPolicy.patterns?.humanAcceptanceApproved?.includes("status")) &&
        prTemplateSource.includes("## Human Acceptance") &&
        developWorkflowSource.includes("humanAcceptanceApproved"),
      details: "Final PRs to develop should remain blocked until user manual-test approval is recorded."
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    checks
  };
}

export function renderGovernanceDriftReport(report: DriftReport): string {
  const lines = [
    "# Governance Drift Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "| Check | Result | Details |",
    "| --- | --- | --- |",
    ...report.checks.map((check) => `| ${check.name} | ${check.passed ? "pass" : "fail"} | ${check.details} |`)
  ];

  const failingChecks = report.checks.filter((check) => !check.passed);
  lines.push("", `Failing Checks: ${failingChecks.length}`);

  if (failingChecks.length > 0) {
    lines.push("", "## Follow-up", "", ...failingChecks.map((check) => `- ${check.name}: ${check.details}`));
  }

  return `${lines.join("\n").trim()}\n`;
}
