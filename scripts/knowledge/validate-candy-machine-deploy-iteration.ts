import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const watchedPaths = [
  "app/api/admin/core-candy-machine/",
  "components/admin/core-candy-machine-panel.tsx",
  "lib/core-candy-machine-admin.ts",
  "lib/core-candy-machine-snapshot-service.ts"
];

const requiredSections = [
  "# Candy Machine Deploy Iteration:",
  "## Iteration Metadata",
  "- Branch:",
  "- Base branch:",
  "- PR:",
  "- Final merged PR:",
  "## Functional Baseline",
  "## Implementation Snapshot",
  "## Flow Diagram",
  "## Transaction Assembly",
  "## Metaplex Core Plugins",
  "## Security Contract",
  "## What Changed In This Iteration",
  "## What Did Not Work",
  "## Manual Test Record"
];

function runGit(args: string[]): string {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getChangedFiles(): string[] {
  const changed = new Set<string>();
  const commands = [
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"],
    ["diff", "--name-only", "--cached", "--diff-filter=ACMRTUXB"],
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", "develop...HEAD"],
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", "origin/develop...HEAD"]
  ];

  for (const args of commands) {
    for (const filePath of splitLines(runGit(args))) {
      changed.add(filePath);
    }
  }

  return [...changed].sort((left, right) => left.localeCompare(right));
}

async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(absolutePath);
      }

      if (entry.isFile() && entry.name.endsWith(".md")) {
        return [absolutePath];
      }

      return [];
    })
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

function isWatchedCandyMachineDeployChange(filePath: string): boolean {
  return watchedPaths.some((watchedPath) => filePath === watchedPath || filePath.startsWith(watchedPath));
}

function isFilledMetadataLine(source: string, label: string): boolean {
  const pattern = new RegExp(`^- ${label}:\\s*(.+)$`, "m");
  const match = source.match(pattern);
  const value = match?.[1]?.trim() ?? "";

  return value.length > 0 && !value.includes("YYYY-MM-DD");
}

function validateIterationSource(source: string, currentBranch: string): string[] {
  const failures: string[] = [];

  for (const requiredSection of requiredSections) {
    if (!source.includes(requiredSection)) {
      failures.push(`missing required section or field: ${requiredSection}`);
    }
  }

  for (const label of ["Branch", "Base branch", "PR", "Final merged PR", "Scope"]) {
    if (!isFilledMetadataLine(source, label)) {
      failures.push(`metadata field is empty or placeholder: ${label}`);
    }
  }

  if (currentBranch && currentBranch !== "HEAD" && !source.includes(`- Branch: \`${currentBranch}\``)) {
    failures.push(`iteration file does not reference current branch: ${currentBranch}`);
  }

  return failures;
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const changedFiles = getChangedFiles();
  const candyMachineDeployChanges = changedFiles.filter(isWatchedCandyMachineDeployChange);

  if (candyMachineDeployChanges.length === 0) {
    console.log("Candy Machine deploy iteration validation skipped: no watched deploy files changed.");
    return;
  }

  const currentBranch = runGit(["branch", "--show-current"]);
  const inboxRoot = path.join(rootDir, "knowledge", "inbox");
  const markdownFiles = await listMarkdownFiles(inboxRoot);
  const iterationFiles = markdownFiles.filter((filePath) =>
    path.basename(filePath).includes("candy-machine-deploy-iteration")
  );

  if (iterationFiles.length === 0) {
    throw new Error(
      [
        "Candy Machine deploy changes require an iteration knowledge file.",
        "Create one from knowledge/templates/CANDY_MACHINE_DEPLOY_ITERATION.template.md.",
        `Changed files: ${candyMachineDeployChanges.join(", ")}`
      ].join("\n")
    );
  }

  const candidates = [];
  for (const filePath of iterationFiles) {
    const source = await readFile(filePath, "utf8");
    if (!currentBranch || currentBranch === "HEAD" || source.includes(`- Branch: \`${currentBranch}\``)) {
      candidates.push({ filePath, source });
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      [
        `Candy Machine deploy changes require an iteration file for branch ${currentBranch}.`,
        "Create one from knowledge/templates/CANDY_MACHINE_DEPLOY_ITERATION.template.md.",
        `Changed files: ${candyMachineDeployChanges.join(", ")}`
      ].join("\n")
    );
  }

  const validationResults = candidates.map((candidate) => ({
    filePath: candidate.filePath,
    failures: validateIterationSource(candidate.source, currentBranch)
  }));
  const validCandidate = validationResults.find((result) => result.failures.length === 0);

  if (!validCandidate) {
    const details = validationResults
      .map((result) => {
        const relativePath = path.relative(rootDir, result.filePath);
        return [`${relativePath}:`, ...result.failures.map((failure) => `  - ${failure}`)].join("\n");
      })
      .join("\n");

    throw new Error(`Candy Machine deploy iteration validation failed.\n${details}`);
  }

  console.log(`Candy Machine deploy iteration validated: ${path.relative(rootDir, validCandidate.filePath)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Candy Machine deploy iteration validation failed.");
  process.exit(1);
});
