import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "021_marketplace_entry_location_form_fields.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("marketplace entry location form fields migration", () => {
  it("adds canonical location storage fields to marketplace_entries", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("alter table marketplace_entries");
    expect(sql).toContain("add column if not exists state_province text");
    expect(sql).toContain("add column if not exists geo_lat double precision");
    expect(sql).toContain("add column if not exists geo_lng double precision");
  });

  it("documents the new location fields without mutating immutable marketplace columns", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("comment on column marketplace_entries.state_province");
    expect(sql).toContain("comment on column marketplace_entries.geo_lat");
    expect(sql).toContain("comment on column marketplace_entries.geo_lng");
    expect(sql).not.toContain("alter column image_url");
    expect(sql).not.toContain("drop column image_url");
  });
});
