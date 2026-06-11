import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildGovernanceDriftReport } from "@/scripts/knowledge/governance-drift-core";
import { collectKnowledgeIndex, renderKnowledgeReadme } from "@/scripts/knowledge/knowledge-core";
import { classifyChangedFile, collectCandidateActions } from "@/scripts/knowledge/recent-changes-core";

const tempDirs: string[] = [];

async function createTempRepo(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("knowledge system", () => {
  it("collects inbox and proposal entries and renders the README index", async () => {
    const repoDir = await createTempRepo("knowledge-index-");
    await mkdir(path.join(repoDir, "docs", "knowledge", "inbox", "2026-05"), { recursive: true });
    await mkdir(path.join(repoDir, "docs", "knowledge", "proposals", "guide"), { recursive: true });

    await writeFile(
      path.join(repoDir, "docs", "knowledge", "inbox", "2026-05", "KNOW-2026-05-001.md"),
      [
        "---",
        "id: KNOW-2026-05-001",
        "title: Drift observation",
        "status: observed",
        "scope: shared",
        "source_issue: BRI-143",
        "source_feature: docs/features/example.md",
        "promotion_target: guide",
        "enforcement_candidate: yes",
        "owner: team",
        "created_at: 2026-05-02",
        "updated_at: 2026-05-02",
        "---",
        "",
        "# Signal"
      ].join("\n"),
      "utf8"
    );

    await writeFile(
      path.join(repoDir, "docs", "knowledge", "proposals", "guide", "PROMO-2026-05-001.md"),
      [
        "---",
        "id: PROMO-2026-05-001",
        "title: Promote drift rule",
        "status: triaged",
        "scope: shared",
        "source_issue: BRI-143",
        "source_feature: docs/features/example.md",
        "promotion_target: governance",
        "enforcement_candidate: no",
        "owner: team",
        "created_at: 2026-05-02",
        "updated_at: 2026-05-02",
        "---",
        "",
        "# Candidate"
      ].join("\n"),
      "utf8"
    );

    const index = await collectKnowledgeIndex(repoDir);
    const rendered = renderKnowledgeReadme(index);

    expect(index.observations).toHaveLength(1);
    expect(index.proposals).toHaveLength(1);
    expect(rendered).toContain("KNOW-2026-05-001");
    expect(rendered).toContain("PROMO-2026-05-001");
    expect(rendered).toContain("Promote drift rule");
  });

  it("detects governance drift when AGENTS or status values are misaligned", async () => {
    const repoDir = await createTempRepo("knowledge-drift-");
    await mkdir(path.join(repoDir, "docs", "governance"), { recursive: true });
    await mkdir(path.join(repoDir, "docs", "guides"), { recursive: true });
    await mkdir(path.join(repoDir, "docs", "rfcs", "templates"), { recursive: true });
    await mkdir(path.join(repoDir, ".codex", "agents"), { recursive: true });
    await mkdir(path.join(repoDir, ".github", "workflows"), { recursive: true });
    await mkdir(path.join(repoDir, "scripts", "ci"), { recursive: true });

    await writeFile(path.join(repoDir, "AGENTS.md"), "summary without references\n", "utf8");
    await writeFile(
      path.join(repoDir, ".codex", "agents", "docs.toml"),
      'system_prompt = "docs without Socratic skill"\n',
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "governance", "documentation-policy.md"),
      "Allowed status values:\n- `draft`\n- `approved`\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "governance", "git-monorepo-policy.md"),
      "feature/program-<name>\nfix/app-<name>\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "guides", "gitflow-pr-structure.md"),
      "guide without ssot reference\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "governance", "pr-policy-source-of-truth.json"),
      JSON.stringify({
        requiredPrSections: ["issue"],
        patterns: {}
      }),
      "utf8"
    );
    await writeFile(
      path.join(repoDir, ".github", "pull_request_template.md"),
      "## Summary\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, ".github", "workflows", "pr-governance-develop.yml"),
      "name: missing human acceptance\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "rfcs", "templates", "STORY.template.md"),
      "- Status: `draft` (`draft | approved`)\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "scripts", "ci", "check-required-docs.sh"),
      'case "${metadata_status}" in\n  draft|approved|implemented) ;;\nesac\n',
      "utf8"
    );

    const report = await buildGovernanceDriftReport(repoDir);

    expect(report.checks.some((check) => !check.passed)).toBe(true);
    expect(report.checks.find((check) => check.name.includes("RFC status values"))?.passed).toBe(false);
  });

  it("classifies changed files into reusable knowledge signals", () => {
    expect(classifyChangedFile("docs/governance/documentation-policy.md").bucket).toBe("governance");
    expect(classifyChangedFile("package.json").bucket).toBe("automation");
    expect(classifyChangedFile("docs/features/example.md").bucket).toBe("guide");
    expect(collectCandidateActions(["docs/governance/documentation-policy.md", "scripts/ci/pr-open.sh"])).toContain(
      "Consider a governance drift observation or promotion proposal."
    );
  });
});
