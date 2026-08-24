/**
 * @file tests/unit/neon-db-structural.test.ts
 * @description Layer 4 & QA: Structural verification test for SPEC-2 (Neon PostgreSQL Layer).
 * @spec BBC-6-SPEC-2
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SPEC-2: Neon PostgreSQL Persistence Structural Contract (@spec BBC-6-SPEC-2)", () => {
  const rootDir = process.cwd();

  const requiredDbFiles = [
    "apps/web/src/features/shared/infrastructure/db/migrations/001_create_investor_schema.sql",
    "apps/web/src/features/shared/infrastructure/db/migrations/002_seed_initial_properties.sql",
    "apps/web/src/lib/types/db.ts",
    "apps/web/src/lib/infrastructure/db/neon-client.ts",
    "apps/web/src/lib/infrastructure/db/repositories/user-repository.ts",
    "apps/web/src/lib/infrastructure/db/repositories/property-repository.ts",
    "apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts",
  ];

  it.each(requiredDbFiles)("should physically exist on disk: %s", (relativeFilePath) => {
    const fullPath = path.resolve(rootDir, relativeFilePath);
    const exists = fs.existsSync(fullPath);
    expect(exists, `Expected database file ${relativeFilePath} to exist`).toBe(true);
  });
});
