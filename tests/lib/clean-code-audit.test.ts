import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = process.cwd();

const REFACTOR_FILES = [
  "lib/purchase-anti-bot.ts",
  "lib/property-marketplace-server.ts",
  "lib/solana-kit/compat/squads.ts",
  "app/api/admin/mint-orchestrator/jobs/[jobId]/reconcile/route.ts",
  "components/marketplace/PurchaseCta.tsx",
  "scripts/check-candy-machine-items.js"
];

describe("SPEC 6 - Clean Code & Refactoring Audit", () => {
  it("@spec BRI-12-REQ-6 ensures no empty files or 0-byte orphan files exist in refactored surfaces", () => {
    for (const relativePath of REFACTOR_FILES) {
      const fullPath = join(REPO_ROOT, relativePath);
      const stat = statSync(fullPath);
      expect(stat.size, `${relativePath} must not be empty or 0-byte`).toBeGreaterThan(10);
    }
  });

  it("@spec BRI-12-REQ-6 ensures refactored files do not contain leftover debug statements or empty export blocks", () => {
    for (const relativePath of REFACTOR_FILES) {
      const content = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      expect(content, `${relativePath} must not contain debugger statements`).not.toContain("debugger;");
      expect(content, `${relativePath} must not contain empty exports`).not.toContain("export {};");
    }
  });
});
