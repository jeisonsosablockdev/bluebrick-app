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

function runBash(scriptPath: string, args: string[], cwd: string): string {
  try {
    return execFileSync("bash", [scriptPath, ...args], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env
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

async function createPreflightRepo(): Promise<string> {
  const originDir = await createTempDir("preflight-origin-");
  const workDir = await createTempDir("preflight-work-");

  runGit(["init", "--bare", originDir], repoRoot);
  runGit(["init", "-b", "develop"], workDir);

  await cp(path.join(repoRoot, "scripts"), path.join(workDir, "scripts"), { recursive: true });

  await writeFile(
    path.join(workDir, "AGENTS.md"),
    [
      "# Test Agents",
      "",
      "## Entry Rules",
      "- Start with `planner`.",
      "- Require the governing artifact before implementation.",
      "",
      "## Definition of Done",
      "- `npm run validate`",
      "- Final reviewer pass with no blocking issues",
      ""
    ].join("\n"),
    "utf8"
  );

  await writeFile(
    path.join(workDir, "package.json"),
    JSON.stringify(
      {
        name: "temp-preflight-repo",
        private: true
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(
    path.join(workDir, "package-lock.json"),
    JSON.stringify(
      {
        name: "temp-preflight-repo",
        lockfileVersion: 3,
        packages: {}
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(path.join(workDir, "README.md"), "# Temp Repo\n", "utf8");

  runGit(["add", "."], workDir);
  runGit(["commit", "-m", "docs(shared): seed preflight fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);

  runGit(["checkout", "-b", "fix/shared-merged-cleanup"], workDir);
  await writeFile(path.join(workDir, "README.md"), "# Merged Branch\n", "utf8");
  runGit(["add", "README.md"], workDir);
  runGit(["commit", "-m", "fix(shared): create merged branch fixture"], workDir);
  runGit(["checkout", "develop"], workDir);
  runGit(["merge", "--ff-only", "fix/shared-merged-cleanup"], workDir);

  runGit(["checkout", "-b", "feature/shared-preflight-start"], workDir);
  await writeFile(path.join(workDir, "notes.txt"), "local-only branch fixture\n", "utf8");
  runGit(["add", "notes.txt"], workDir);
  runGit(["commit", "-m", "feat(shared): create current feature branch"], workDir);

  runGit(["checkout", "-b", "chore/local-only-scratch"], workDir);
  runGit(["checkout", "feature/shared-preflight-start"], workDir);

  await writeFile(
    path.join(workDir, "package.json"),
    JSON.stringify(
      {
        name: "temp-preflight-repo",
        private: true,
        scripts: {
          preflight: "start"
        }
      },
      null,
      2
    ),
    "utf8"
  );

  return workDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("preflight:start", () => {
  it("reports branch hygiene, package drift, and AGENTS guidance for feature branches", async () => {
    const repoDir = await createPreflightRepo();

    const output = runBash(path.join(repoDir, "scripts", "ci", "preflight-start.sh"), [], repoDir);

    expect(output).toContain("Current branch: feature/shared-preflight-start");
    expect(output).toContain("Automatic remote cleanup is disabled.");
    expect(output).toContain("Local develop is ahead 1 and behind 0 versus origin/develop.");
    expect(output).toContain("Warning: package.json changed without package-lock.json in the branch/worktree.");
    expect(output).toContain("Start with `planner`.");
    expect(output).toContain("fix/shared-merged-cleanup");
    expect(output).toContain("chore/local-only-scratch");
    expect(output).toContain("/knowledge/features/*.md");
    expect(output).toContain("6) Recommended Next Steps");
    expect(output).toContain("delete them manually only after confirming they are no longer needed");
    expect(output).toContain("Review AGENTS.md before implementation");
  });

  it("fails closed on a clean develop branch unless bootstrap mode is explicit", async () => {
    const repoDir = await createPreflightRepo();

    runGit(["restore", "package.json"], repoDir);
    runGit(["checkout", "develop"], repoDir);

    expect(() =>
      runBash(path.join(repoDir, "scripts", "ci", "preflight-start.sh"), ["--fetch"], repoDir)
    ).toThrow("Bootstrap guard");
  });

  it("can complete on a clean develop branch when called in bootstrap mode", async () => {
    const repoDir = await createPreflightRepo();

    runGit(["restore", "package.json"], repoDir);
    runGit(["checkout", "develop"], repoDir);
    const output = runBash(
      path.join(repoDir, "scripts", "ci", "preflight-start.sh"),
      ["--fetch", "--bootstrap"],
      repoDir
    );

    expect(output).toContain("Current branch: develop");
    expect(output).toContain("Working tree is clean.");
    expect(output).toContain("Remote refs refreshed from origin.");
    expect(output).toContain("No obvious package.json/package-lock.json drift detected");
    expect(output).toContain("use ./scripts/task-init.sh");
    expect(output).toContain("Preflight complete.");
  });
});
