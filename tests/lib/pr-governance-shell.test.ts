import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const shellLibPath = path.join(repoRoot, "scripts/ci/pr-governance-lib.sh");
const docsScriptPath = path.join(repoRoot, "scripts/ci/check-required-docs.sh");

const tempDirs: string[] = [];

function runBash(command: string, cwd = repoRoot): string {
  try {
    return execFileSync("bash", ["-lc", command], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: process.env.PATH
      }
    }).trim();
  } catch (error) {
    const failure = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message: string;
    };
    const stdout = failure.stdout ? String(failure.stdout) : "";
    const stderr = failure.stderr ? String(failure.stderr) : "";
    throw new Error(`${failure.message}\n${stdout}${stderr}`.trim());
  }
}

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Codex",
      GIT_AUTHOR_EMAIL: "codex@example.com",
      GIT_COMMITTER_NAME: "Codex",
      GIT_COMMITTER_EMAIL: "codex@example.com"
    }
  }).trim();
}

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function copyScriptIntoRepo(repoDir: string): Promise<void> {
  const scriptDir = path.join(repoDir, "scripts", "ci");
  await mkdir(scriptDir, { recursive: true });

  await writeFile(
    path.join(scriptDir, "pr-governance-lib.sh"),
    await readFile(shellLibPath, "utf8"),
    "utf8"
  );
  await writeFile(
    path.join(scriptDir, "check-required-docs.sh"),
    await readFile(docsScriptPath, "utf8"),
    "utf8"
  );
}

async function createDocsRepo(): Promise<string> {
  const originDir = await createTempDir("pr-governance-origin-");
  const workDir = await createTempDir("pr-governance-work-");

  runGit(["init", "--bare", originDir], repoRoot);
  runGit(["init", "-b", "develop"], workDir);

  await copyScriptIntoRepo(workDir);

  await mkdir(path.join(workDir, "docs", "rfcs", "EPIC-011-admin-collections-console"), {
    recursive: true
  });
  await mkdir(path.join(workDir, "lib"), { recursive: true });

  await writeFile(
    path.join(workDir, "docs", "rfcs", "EPIC-011-admin-collections-console", "README.md"),
    [
      "# EPIC-011-admin-collections-console",
      "",
      "## Story Index",
      "| Story ID | Title | RFC File | Status | PR | Notes |",
      "| --- | --- | --- | --- | --- | --- |",
      "| STORY-011-02 | Admin collections read model | `STORY-011-02-admin-collections-read-model.md` | `approved` | `TBD` | Notes |",
      ""
    ].join("\n"),
    "utf8"
  );

  await writeFile(
    path.join(
      workDir,
      "docs",
      "rfcs",
      "EPIC-011-admin-collections-console",
      "STORY-011-02-admin-collections-read-model.md"
    ),
    [
      "# STORY-011-02-admin-collections-read-model",
      "",
      "## Metadata",
      "- Status: `approved`",
      "",
      "## Context",
      "Context",
      "",
      "## Proposal",
      "Proposal",
      "",
      "## Critique",
      "Critique",
      "",
      "## Resolution",
      "Resolution",
      "",
      "## Decision",
      "Decision",
      "",
      "## Status",
      "- Current status: `approved`",
      "",
      "## Traceability",
      "- Related issue(s): `TBD`",
      "- Related PR(s): `TBD`",
      "- Final commit hash(es): `TBD`",
      ""
    ].join("\n"),
    "utf8"
  );

  await writeFile(path.join(workDir, "lib", "example.ts"), "export const value = 1;\n", "utf8");

  runGit(["add", "."], workDir);
  runGit(["commit", "-m", "docs(shared): seed governance fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);
  runGit(["checkout", "-b", "epic-011-story-011-02-query-ownership-contract-bri-80"], workDir);

  return workDir;
}

async function createFeatureBranchRepo(branchName: string): Promise<string> {
  const originDir = await createTempDir("pr-governance-origin-");
  const workDir = await createTempDir("pr-governance-work-");

  runGit(["init", "--bare", originDir], repoRoot);
  runGit(["init", "-b", "develop"], workDir);

  await copyScriptIntoRepo(workDir);
  await mkdir(path.join(workDir, "docs", "features"), { recursive: true });

  await writeFile(path.join(workDir, "README.md"), "# Temp Repo\n", "utf8");

  runGit(["add", "."], workDir);
  runGit(["commit", "-m", "docs(shared): seed feature-note fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);
  runGit(["checkout", "-b", branchName], workDir);

  return workDir;
}

async function createAppDocsRepo(): Promise<string> {
  const originDir = await createTempDir("pr-governance-origin-");
  const workDir = await createTempDir("pr-governance-work-");

  runGit(["init", "--bare", originDir], repoRoot);
  runGit(["init", "-b", "develop"], workDir);

  await copyScriptIntoRepo(workDir);
  await mkdir(path.join(workDir, "app", "api", "admin", "collections"), { recursive: true });
  await mkdir(path.join(workDir, "docs"), { recursive: true });

  await writeFile(path.join(workDir, "app", "api", "admin", "collections", "route.ts"), "// seed\n", "utf8");
  await writeFile(path.join(workDir, "docs", "auth-flow.md"), "# Auth Flow\n", "utf8");
  await writeFile(path.join(workDir, "docs", "session-model.md"), "# Session Model\n", "utf8");

  runGit(["add", "."], workDir);
  runGit(["commit", "-m", "docs(shared): seed app governance fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);
  runGit(["checkout", "-b", "chore/app-docs-gate-fixture"], workDir);

  return workDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("PR governance shell helpers", () => {
  it("accepts long-form epic/story branch names", () => {
    const output = runBash(
      `source "${shellLibPath}"; extract_story_context_from_branch "epic-011-story-011-02-query-ownership-contract-bri-80"; printf '%s:%s' "$detected_story_epic" "$detected_story_id"`
    );

    expect(output).toBe("011:02");
  });

  it("accepts short-form epic/story branch names", () => {
    const output = runBash(
      `source "${shellLibPath}"; extract_story_context_from_branch "epic-011-story-02-query-ownership-contract-bri-80"; printf '%s:%s' "$detected_story_epic" "$detected_story_id"`
    );

    expect(output).toBe("011:02");
  });

  it("rejects inconsistent repeated epic identifiers", () => {
    const output = runBash(
      `source "${shellLibPath}"; if extract_story_context_from_branch "epic-011-story-010-02-bad"; then echo ok; else echo invalid; fi`
    );

    expect(output).toBe("invalid");
  });

  it("normalizes markdown table cells before status comparison", () => {
    const output = runBash(`source "${shellLibPath}"; normalize_markdown_table_cell ' \`approved\` '`);

    expect(output).toBe("approved");
  });

  it("maps validate modes to the expected local command", () => {
    const full = runBash(`source "${shellLibPath}"; resolve_pr_ready_validate_command full`);
    const governanceOnly = runBash(
      `source "${shellLibPath}"; resolve_pr_ready_validate_command governance-only`
    );
    const skip = runBash(`source "${shellLibPath}"; resolve_pr_ready_validate_command skip`);

    expect(full).toBe("npm run validate");
    expect(governanceOnly).toBe("npm run validate:docs-governance");
    expect(skip).toBe("");
  });

  it("passes docs governance for uncommitted RFC updates on a long-form story branch", async () => {
    const repoDir = await createDocsRepo();

    await writeFile(
      path.join(repoDir, "lib", "example.ts"),
      "export const value = 2;\n",
      "utf8"
    );
    await writeFile(
      path.join(
        repoDir,
        "docs",
        "rfcs",
        "EPIC-011-admin-collections-console",
        "README.md"
      ),
      [
        "# EPIC-011-admin-collections-console",
        "",
        "## Story Index",
        "| Story ID | Title | RFC File | Status | PR | Notes |",
        "| --- | --- | --- | --- | --- | --- |",
        "| STORY-011-02 | Admin collections read model | `STORY-011-02-admin-collections-read-model.md` | `approved` | `TBD` | Updated notes |",
        ""
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      path.join(
        repoDir,
        "docs",
        "rfcs",
        "EPIC-011-admin-collections-console",
        "STORY-011-02-admin-collections-read-model.md"
      ),
      [
        "# STORY-011-02-admin-collections-read-model",
        "",
        "## Metadata",
        "- Status: `approved`",
        "",
        "## Context",
        "Updated context",
        "",
        "## Proposal",
        "Proposal",
        "",
        "## Critique",
        "Critique",
        "",
        "## Resolution",
        "Resolution",
        "",
        "## Decision",
        "Decision",
        "",
        "## Status",
        "- Current status: `approved`",
        "",
        "## Traceability",
        "- Related issue(s): `TBD`",
        "- Related PR(s): `TBD`",
        "- Final commit hash(es): `TBD`",
        ""
      ].join("\n"),
      "utf8"
    );

    const output = runBash("bash ./scripts/ci/check-required-docs.sh", repoDir);

    expect(output).toContain(
      "Epic/story branch detected (epic-011-story-011-02-query-ownership-contract-bri-80) -> validating RFC sync for STORY-011-02."
    );
    expect(output).toContain("RFC epic Story Index validation passed for STORY-011-02");
    expect(output).toContain("Required docs check passed.");
  });

  it("includes untracked files in local feature-note enforcement", async () => {
    const repoDir = await createFeatureBranchRepo("fix/shared-pr-governance-flow-flexibility");

    await mkdir(path.join(repoDir, "tests", "lib"), { recursive: true });
    await writeFile(
      path.join(repoDir, "tests", "lib", "untracked-governance.test.ts"),
      "export const testCase = true;\n",
      "utf8"
    );

    expect(() => runBash("bash ./scripts/ci/check-required-docs.sh", repoDir)).toThrowError(
      /Missing feature note update/
    );

    await writeFile(
      path.join(repoDir, "docs", "features", "feature-untracked-note.md"),
      "# Feature Note\n",
      "utf8"
    );

    const output = runBash("bash ./scripts/ci/check-required-docs.sh", repoDir);

    expect(output).toContain("Feature/fix/refactor scope detected -> validating feature note");
    expect(output).toContain("Required docs check passed.");
  });

  it("passes app doc enforcement when required docs are updated in the working tree", async () => {
    const repoDir = await createAppDocsRepo();

    await writeFile(
      path.join(repoDir, "app", "api", "admin", "collections", "route.ts"),
      "export const GET = () => Response.json({ ok: true });\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "auth-flow.md"),
      "# Auth Flow\n\n## Admin Collections\nUpdated.\n",
      "utf8"
    );
    await writeFile(
      path.join(repoDir, "docs", "session-model.md"),
      "# Session Model\n\n## Admin Collections\nUpdated.\n",
      "utf8"
    );

    const output = runBash("bash ./scripts/ci/check-required-docs.sh", repoDir);

    expect(output).toContain("App scope detected -> validating required frontend/auth docs.");
    expect(output).toContain("Required docs check passed.");
  });
});
