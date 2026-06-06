import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
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

function runBash(
  scriptPath: string,
  args: string[],
  cwd: string,
  input = "",
  extraEnv: Record<string, string> = {}
): string {
  try {
    return execFileSync("bash", [scriptPath, ...args], {
      cwd,
      encoding: "utf8",
      input,
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

async function createBootstrapRepo(): Promise<string> {
  const originDir = await createTempDir("task-init-origin-");
  const workDir = await createTempDir("task-init-work-");

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
        name: "temp-task-init-repo",
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
  await writeFile(
    path.join(workDir, "package-lock.json"),
    JSON.stringify(
      {
        name: "temp-task-init-repo",
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
  runGit(["commit", "-m", "docs(shared): seed task bootstrap fixtures"], workDir);
  runGit(["remote", "add", "origin", originDir], workDir);
  runGit(["push", "-u", "origin", "develop"], workDir);

  return workDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("task:init", () => {
  it("asks for a Socratic breakdown before creating a parent work branch", async () => {
    const repoDir = await createBootstrapRepo();
    const scriptPath = path.join(repoDir, "scripts", "task-init.sh");
    const input = [
      "Build a bootstrap flow that clarifies vague briefs",
      "The assistant should ask the missing questions and branch correctly",
      "feature",
      "shared",
      "task-bootstrap",
      "parent",
      "BRI-149",
      "czambrano",
      "y"
    ].join("\n") + "\n";

    const output = runBash(scriptPath, ["--ask", "--no-fetch"], repoDir, input);

    expect(output).toContain("Before we branch, let us make the shape of the work plain.");
    expect(output).toContain("Preflight complete.");
    expect(output).toContain("Breakdown");
    expect(output).toContain("Socratic pass complete.");
    expect(output).toContain("Canonical docs: docs/features/feature-task-bootstrap.md");
    expect(output).toContain("Multi-SPEC reminder");
    expect(runGit(["branch", "--show-current"], repoDir)).toBe(
      "feature/czambrano-BRI-149-task-bootstrap"
    );
  });
});
