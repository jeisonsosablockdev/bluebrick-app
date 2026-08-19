import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("db migrations relocation & governance (SPEC-29)", () => {
  const rootDbDir = path.resolve(process.cwd(), "db");
  const targetMigrationsDir = path.resolve(
    process.cwd(),
    "apps",
    "web",
    "src",
    "features",
    "shared",
    "infrastructure",
    "db",
    "migrations"
  );

  it("ensures root /db directory is completely removed", () => {
    expect(fs.existsSync(rootDbDir)).toBe(false);
  });

  it("verifies migration SQL files exist in apps/web/src/features/shared/infrastructure/db/migrations", () => {
    expect(fs.existsSync(targetMigrationsDir)).toBe(true);
    const files = fs.readdirSync(targetMigrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));
    expect(sqlFiles.length).toBeGreaterThanOrEqual(41);
  });
});
