import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("workflow evals", () => {
  it("keeps the solution artifact decision-complete and anti-improvisation oriented", () => {
    const source = read("docs/fixes/fix-agents-orchestation-implementation.md");

    expect(source).toContain("decision-complete");
    expect(source).toContain("si falta una decisión material, no se implementa todavía");
    expect(source).toContain("clarification-required scenarios");
    expect(source).toContain("following the letter, but not the spirit");
  });

  it("keeps the problem artifact explicit about spirit drift and halt-and-ask gaps", () => {
    const source = read("docs/fixes/fix-agents-orchestation.md");

    expect(source).toContain("following the letter, but not the spirit");
    expect(source).toContain("detenerse y preguntar");
    expect(source).toContain("improvisación");
  });

  it("requires planner and docs agents to pause and ask when material context is missing", () => {
    const planner = read(".codex/agents/planner.toml");
    const docs = read(".codex/agents/docs.toml");

    expect(planner).toContain("pause and ask instead of improvising");
    expect(planner).toContain("Socratic clarification pass");
    expect(docs).toContain("pause and ask instead of improvising");
    expect(docs).toContain("Socratic breakdown");
    expect(docs).toContain("explain-like-socrates");
  });

  it("keeps git helpers aligned with atomicity instead of convenience staging", () => {
    const gitSave = read("scripts/git-save.sh");
    const gitPush = read("scripts/git-push.sh");
    const gitStart = read("scripts/git-start.sh");
    const prOpen = read("scripts/ci/pr-open.sh");
    const prReady = read("scripts/ci/pr-ready.sh");
    const protectedPush = read(".github/workflows/protected-branch-push-provenance.yml");

    expect(gitSave).not.toContain("git add .");
    expect(gitSave).toContain("No hay cambios staged");
    expect(gitSave).toContain("No se permiten commits directos");
    expect(gitPush).toContain("No se permite push directo");
    expect(gitPush).toContain("parent work branch configurada");
    expect(gitStart).toContain("linear:issue-start");
    expect(prReady).toContain("linear:issue-review");
    expect(prOpen).toContain("linear:issue-review");
    expect(protectedPush).toContain("linear:issue-done");
  });

  it("keeps responsive/browser QA fail-closed on ambiguous evidence", () => {
    const responsiveQa = read(".codex/workflows/responsive-qa.md");
    const testingPolicy = read(".codex/policies/testing-policy.md");

    expect(responsiveQa).toContain("ambiguous or unreadable capture blocks completion");
    expect(responsiveQa).toContain("Route-state artifact index");
    expect(testingPolicy).toContain("ambiguous evidence is a blocking failure");
  });

  it("requires clean-code design before delivery slices implement", () => {
    const agents = read("AGENTS.md");
    const planner = read(".codex/agents/planner.toml");
    const docs = read(".codex/agents/docs.toml");
    const docsPolicy = read(".codex/policies/docs-policy.md");
    const refactorCycle = read(".codex/workflows/refactor-cycle.md");
    const architectureGuide = read("docs/guides/codex-orchestration-architecture.md");

    expect(agents).toContain("clean-code design contract");
    expect(planner).toContain("require every delivery slice to define a clean-code design contract");
    expect(docs).toContain("slice map to include a clean-code design contract");
    expect(docsPolicy).toContain("Delivery slices require a clean-code design contract");
    expect(refactorCycle).toContain("No delivery slice proceeds from planning to implementation without a clean-code design contract");
    expect(architectureGuide).toContain("clean-code design contract for each delivery slice before implementation opens");
  });

  it("requires the documentation slice to use explain-like-socrates before delivery slices", () => {
    const agents = read("AGENTS.md");
    const planner = read(".codex/agents/planner.toml");
    const docs = read(".codex/agents/docs.toml");
    const docsPolicy = read(".codex/policies/docs-policy.md");
    const documentationPolicy = read("docs/governance/documentation-policy.md");
    const gitPolicy = read("docs/governance/git-monorepo-policy.md");

    expect(agents).toContain("explain-like-socrates");
    expect(planner).toContain("explain-like-socrates");
    expect(docs).toContain("explain-like-socrates");
    expect(docsPolicy).toContain("explain-like-socrates");
    expect(documentationPolicy).toContain("explain-like-socrates");
    expect(gitPolicy).toContain("explain-like-socrates");
  });

  it("blocks final develop merges until Human Acceptance is approved", () => {
    const agents = read("AGENTS.md");
    const planner = read(".codex/agents/planner.toml");
    const reviewer = read(".codex/agents/reviewer.toml");
    const gitPolicy = read("docs/governance/git-monorepo-policy.md");
    const workflow = read(".github/workflows/pr-governance-develop.yml");
    const prTemplate = read(".github/pull_request_template.md");

    expect(agents).toContain("Human Acceptance");
    expect(planner).toContain("Human Acceptance");
    expect(reviewer).toContain("Human Acceptance");
    expect(gitPolicy).toContain("HUMAN ACCEPTANCE GATE BEFORE DEVELOP");
    expect(gitPolicy).toContain("Status: approved");
    expect(workflow).toContain("humanAcceptanceApproved");
    expect(prTemplate).toContain("## Human Acceptance");
  });
});
