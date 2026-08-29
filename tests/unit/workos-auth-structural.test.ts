/**
 * @file tests/unit/workos-auth-structural.test.ts
 * @description Layer 2 & QA: Structural verification test for SPEC-4 (WorkOS AuthKit & Session Management).
 * @spec BBC-6-SPEC-4
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SPEC-4: WorkOS AuthKit Structural Contract (@spec BBC-6-SPEC-4)", () => {
  const rootDir = process.cwd();

  const requiredAuthFiles = [
    "apps/web/src/proxy.ts",
    "apps/web/src/lib/auth/workos-session.ts",
    "apps/web/src/lib/pipelines/user-sync-pipeline.ts",
  ];

  it.each(requiredAuthFiles)("should physically exist on disk: %s", (relativeFilePath) => {
    const fullPath = path.resolve(rootDir, relativeFilePath);
    const exists = fs.existsSync(fullPath);
    expect(exists, `Expected auth file ${relativeFilePath} to exist`).toBe(true);
  });

  it("should NOT contain deprecated middleware.ts to prevent Next.js 16 E900 collision error", () => {
    const middlewarePath = path.resolve(rootDir, "apps/web/src/middleware.ts");
    const exists = fs.existsSync(middlewarePath);
    expect(exists, "Deprecated middleware.ts must be deleted in favor of proxy.ts").toBe(false);
  });
});
