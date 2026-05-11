import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { classifyChangedFile, collectCandidateActions } from "./recent-changes-core.ts";

type CliOptions = {
  base: string;
  output: string | null;
};

function parseCliOptions(argv: string[]): CliOptions {
  let base = "develop";
  let output: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--base") {
      base = argv[index + 1] ?? base;
      index += 1;
      continue;
    }

    if (token === "--output") {
      output = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { base, output };
}

function runGit(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8"
  }).trim();
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function defaultOutputPath(rootDir: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return path.join(rootDir, "docs", "knowledge", "reports", `recent-changes-${dateStamp}.md`);
}

const options = parseCliOptions(process.argv.slice(2));
const rootDir = process.cwd();
const branch = runGit(["branch", "--show-current"], rootDir);
const mergeBase = runGit(["merge-base", `origin/${options.base}`, "HEAD"], rootDir);
const changedFiles = [
  ...splitLines(runGit(["diff", "--name-only", `${mergeBase}..HEAD`], rootDir)),
  ...splitLines(runGit(["diff", "--name-only", "HEAD"], rootDir)),
  ...splitLines(runGit(["ls-files", "--others", "--exclude-standard"], rootDir))
].filter((filePath, index, collection) => collection.indexOf(filePath) === index);
const recentCommits = splitLines(runGit(["log", "--format=%h %s", `${mergeBase}..HEAD`], rootDir));
const actions = collectCandidateActions(changedFiles);

const lines = [
  "# Recent Changes Scan",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Base Branch: ${options.base}`,
  `Current Branch: ${branch}`,
  `Merge Base: ${mergeBase}`,
  "",
  "## Commits",
  "",
  ...(recentCommits.length > 0 ? recentCommits.map((commit) => `- ${commit}`) : ["- No branch commits yet."]),
  "",
  "## Changed Files",
  "",
  ...(changedFiles.length > 0
    ? changedFiles.map((filePath) => {
        const summary = classifyChangedFile(filePath);
        return `- \`${filePath}\` -> ${summary.bucket}: ${summary.reason}`;
      })
    : ["- No changed files relative to base branch."]),
  "",
  "## Candidate Actions",
  "",
  ...actions.map((action) => `- ${action}`)
];

const outputPath = options.output ? path.resolve(rootDir, options.output) : defaultOutputPath(rootDir);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${lines.join("\n").trim()}\n`, "utf8");
process.stdout.write(`Wrote ${path.relative(rootDir, outputPath)}\n`);
