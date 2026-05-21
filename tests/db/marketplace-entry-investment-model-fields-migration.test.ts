import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "030_marketplace_entry_investment_model_fields.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("marketplace entry investment model fields migration", () => {
  it("adds project, economics, and governance json columns", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("alter table marketplace_entries");
    expect(sql).toContain("add column if not exists project_json jsonb");
    expect(sql).toContain("add column if not exists economics_json jsonb");
    expect(sql).toContain("add column if not exists governance_json jsonb");
  });

  it("documents the new json columns", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("comment on column marketplace_entries.project_json");
    expect(sql).toContain("comment on column marketplace_entries.economics_json");
    expect(sql).toContain("comment on column marketplace_entries.governance_json");
  });
});
