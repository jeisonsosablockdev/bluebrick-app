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
  });

  it("keeps git helpers aligned with atomicity instead of convenience staging", () => {
    const gitSave = read("scripts/git-save.sh");
    const gitPush = read("scripts/git-push.sh");

    expect(gitSave).not.toContain("git add .");
    expect(gitSave).toContain("No hay cambios staged");
    expect(gitSave).toContain("No se permiten commits directos");
    expect(gitPush).toContain("No se permite push directo");
    expect(gitPush).toContain("initiative/${BASH_REMATCH[2]}-${BASH_REMATCH[1]}");
  });

  it("keeps responsive/browser QA fail-closed on ambiguous evidence", () => {
    const responsiveQa = read(".codex/workflows/responsive-qa.md");
    const testingPolicy = read(".codex/policies/testing-policy.md");

    expect(responsiveQa).toContain("ambiguous or unreadable capture blocks completion");
    expect(responsiveQa).toContain("Route-state artifact index");
    expect(testingPolicy).toContain("ambiguous evidence is a blocking failure");
  });
});
