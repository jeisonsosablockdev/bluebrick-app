type ChangeBucket = "governance" | "automation" | "guide" | "docs" | "code";

export type ChangeSummary = {
  bucket: ChangeBucket;
  reason: string;
};

export function classifyChangedFile(filePath: string): ChangeSummary {
  if (
    filePath === "AGENTS.md" ||
    filePath.startsWith("docs/governance/") ||
    filePath.startsWith("scripts/ci/") ||
    filePath === ".github/workflows/pr-governance-develop.yml"
  ) {
    return {
      bucket: "governance",
      reason: "Touches canonical policy or executable governance."
    };
  }

  if (filePath === "package.json" || filePath.startsWith("scripts/")) {
    return {
      bucket: "automation",
      reason: "Touches developer-facing commands or automation."
    };
  }

  if (filePath.startsWith("docs/guides/") || filePath.startsWith("docs/features/")) {
    return {
      bucket: "guide",
      reason: "Touches reusable guidance or delivery evidence."
    };
  }

  if (filePath.startsWith("docs/")) {
    return {
      bucket: "docs",
      reason: "Touches repository documentation."
    };
  }

  return {
    bucket: "code",
    reason: "Touches implementation code or tests."
  };
}

export function collectCandidateActions(filePaths: string[]): string[] {
  const buckets = new Set(filePaths.map((filePath) => classifyChangedFile(filePath).bucket));
  const actions: string[] = [];

  if (buckets.has("governance")) {
    actions.push("Consider a governance drift observation or promotion proposal.");
  }

  if (buckets.has("automation")) {
    actions.push("Consider an automation candidate if the workflow is reusable across branches.");
  }

  if (buckets.has("guide")) {
    actions.push("Consider a guide candidate if the pattern is reusable outside the current slice.");
  }

  if (buckets.has("code") && buckets.has("docs")) {
    actions.push("Confirm the feature note captures any reusable workflow insight, not just feature behavior.");
  }

  if (actions.length === 0) {
    actions.push("No reusable knowledge signal detected from the changed files alone.");
  }

  return actions;
}
