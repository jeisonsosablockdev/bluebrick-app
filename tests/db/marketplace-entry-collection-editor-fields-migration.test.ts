import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "019_marketplace_entry_collection_editor_fields.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations", migrationFileName), "utf8");
}

describe("marketplace entry collection editor fields migration", () => {
  it("adds the approved editable collection columns to marketplace_entries", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("alter table marketplace_entries");
    expect(sql).toContain("add column if not exists gallery_images_json jsonb not null default '[]'::jsonb");
    expect(sql).toContain("add column if not exists property_images_json jsonb not null default '[]'::jsonb");
    expect(sql).toContain("add column if not exists fractional_investment_summary text");
    expect(sql).toContain("add column if not exists property_information text");
    expect(sql).toContain("add column if not exists google_maps_place_json jsonb");
    expect(sql).toContain("add column if not exists updated_by text");
  });

  it("documents the new columns without reopening the immutable cover field", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("comment on column marketplace_entries.gallery_images_json");
    expect(sql).toContain("comment on column marketplace_entries.property_images_json");
    expect(sql).toContain("comment on column marketplace_entries.google_maps_place_json");
    expect(sql).toContain("historical snapshot");
    expect(sql).not.toContain("alter column image_url");
    expect(sql).not.toContain("drop column image_url");
  });
});
