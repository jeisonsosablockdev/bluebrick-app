import { cp, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const tempDirs: string[] = [];

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

function runBash(scriptPath: string, args: string[], cwd: string, extraEnv: Record<string, string> = {}): string {
  try {
    return execFileSync("bash", [scriptPath, ...args], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        ...extraEnv
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

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function createWorkflowRepo(): Promise<string> {
  const originDir = await createTempDir("git-workflow-origin-");
  const workDir = await createTempDir("git-workflow-work-");

  runGit(["init", "--bare", originDir], repoRoot);
  runGit(["init", "-b", "develop"], workDir);

  await cp(path.join(repoRoot, "scripts"), path.join(workDir, "scripts"), { recursive: true });

  await mkdir(path.join(workDir, "docs", "features"), { recursive: true });
  await writeFile(
    path.join(workDir, "package.json"),
    JSON.stringify(
      {
        name: "temp-git-workflow-repo",
        private: true,
        scripts: {
          test: "echo test-ok",
          validate: "echo validate-ok"
        }
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(path.join(workDir, "README.md"), "# Temp Repo\n", "utf8");

  runGit(["add", "."], workDir);
  runGit(["commit", "-m", "docs(shared): seed git workflow fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);

  return workDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("git workflow scripts", () => {
  it("keeps the legacy feature shortcut for app/program/shared branches", async () => {
    const repoDir = await createWorkflowRepo();
    const output = runBash(path.join(repoDir, "scripts", "git-start.sh"), ["app", "initial-ui"], repoDir);

    expect(output).toContain("Rama creada: feature/app-initial-ui");
    expect(runGit(["branch", "--show-current"], repoDir)).toBe("feature/app-initial-ui");
  });

  it("creates canonical initiative and slice branches from typed arguments", async () => {
    const repoDir = await createWorkflowRepo();
    const gitStartPath = path.join(repoDir, "scripts", "git-start.sh");

    runBash(gitStartPath, ["feature", "shared", "slice-planning", "--mode", "initiative", "--issue", "BRI-149"], repoDir);
    expect(runGit(["branch", "--show-current"], repoDir)).toBe(
      "initiative/bri-149-slice-planning"
    );

    runGit(["checkout", "develop"], repoDir);
    const sliceOutput = runBash(
      gitStartPath,
      [
        "feature",
        "shared",
        "slice-planning",
        "--mode",
        "slice",
        "--issue",
        "BRI-149",
        "--slice-id",
        "S01",
        "--slice-slug",
        "governance-policy"
      ],
      repoDir
    );

    expect(sliceOutput).toContain(
      "Siguiente PR objetivo: initiative/bri-149-slice-planning"
    );
    expect(sliceOutput).toContain("spec slice");
    expect(runGit(["branch", "--show-current"], repoDir)).toBe(
      "feature/shared-slice-planning-bri-149-s01-governance-policy"
    );
  });

  it("prints artifact-first guidance for fix initiative branches", async () => {
    const repoDir = await createWorkflowRepo();

    const output = runBash(
      path.join(repoDir, "scripts", "git-start.sh"),
      ["fix", "shared", "agent-enforcement", "--mode", "initiative", "--issue", "BRI-157"],
      repoDir
    );

    expect(output).toContain("spec slice");
    expect(output).toContain("docs/fixes/fix-<slug>.md");
    expect(output).toContain("docs/fixes/fix-<slug>-implementation.md");
  });

  it("rejects ambiguous two-argument calls for typed branch families", async () => {
    const repoDir = await createWorkflowRepo();

    expect(() =>
      runBash(path.join(repoDir, "scripts", "git-start.sh"), ["security", "headers"], repoDir)
    ).toThrow("Argumentos inválidos");
  });

  it("commits refactor branches with the correct conventional type and inferred shared scope", async () => {
    const repoDir = await createWorkflowRepo();

    runGit(["checkout", "-b", "refactor/shared-branch-alignment"], repoDir);
    await writeFile(path.join(repoDir, "README.md"), "# Drift fix\n", "utf8");
    runGit(["add", "README.md"], repoDir);

    runBash(
      path.join(repoDir, "scripts", "git-save.sh"),
      ["--message", "align branch scripts"],
      repoDir,
      { SKIP_TEST_GATES: "1" }
    );

    expect(runGit(["log", "-1", "--format=%s"], repoDir)).toBe(
      "refactor(shared): align branch scripts"
    );
  });

  it("requires explicit staging before creating a commit", async () => {
    const repoDir = await createWorkflowRepo();

    runGit(["checkout", "-b", "fix/shared-stage-contract"], repoDir);
    await writeFile(path.join(repoDir, "README.md"), "# Unstaged change\n", "utf8");

    expect(() =>
      runBash(
        path.join(repoDir, "scripts", "git-save.sh"),
        ["--message", "enforce explicit staging"],
        repoDir,
        { SKIP_TEST_GATES: "1" }
      )
    ).toThrow("No hay cambios staged");
  });

  it("blocks direct commits on protected branches", async () => {
    const repoDir = await createWorkflowRepo();

    await writeFile(path.join(repoDir, "README.md"), "# Protected branch change\n", "utf8");
    runGit(["add", "README.md"], repoDir);

    expect(() =>
      runBash(
        path.join(repoDir, "scripts", "git-save.sh"),
        ["--scope", "shared", "--message", "attempt protected commit"],
        repoDir,
        { SKIP_TEST_GATES: "1" }
      )
    ).toThrow("No se permiten commits directos en develop");
  });

  it("guides slice pushes toward the Linear initiative branch", async () => {
    const repoDir = await createWorkflowRepo();

    runGit(
      ["checkout", "-b", "feature/shared-slice-planning-bri-149-s01-governance-policy"],
      repoDir
    );

    const output = runBash(path.join(repoDir, "scripts", "git-push.sh"), [], repoDir);

    expect(output).toContain(
      "abrir PR desde 'feature/shared-slice-planning-bri-149-s01-governance-policy' hacia 'initiative/bri-149-slice-planning'"
    );
  });

  it("blocks direct pushes on protected branches", async () => {
    const repoDir = await createWorkflowRepo();

    expect(() => runBash(path.join(repoDir, "scripts", "git-push.sh"), [], repoDir)).toThrow(
      "No se permite push directo a develop"
    );
  });
});
