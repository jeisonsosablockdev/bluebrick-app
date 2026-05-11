import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "020_asset_upload_edit_sessions.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("asset upload edit sessions migration", () => {
  it("adds the temporary edit-session lifecycle columns to asset_upload_contracts", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("alter table asset_upload_contracts");
    expect(sql).toContain("add column if not exists edit_session_id uuid");
    expect(sql).toContain("add column if not exists promoted_at timestamptz");
    expect(sql).toContain("add column if not exists promoted_by text");
    expect(sql).toContain("add column if not exists canceled_at timestamptz");
    expect(sql).toContain("add column if not exists canceled_by text");
  });

  it("documents promotion and cleanup semantics and adds supporting indexes", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("asset_upload_contracts_promoted_requires_finalize_chk");
    expect(sql).toContain("create index if not exists asset_upload_contracts_edit_session_id_idx");
    expect(sql).toContain("create index if not exists asset_upload_contracts_promoted_at_idx");
    expect(sql).toContain("create index if not exists asset_upload_contracts_canceled_at_idx");
    expect(sql).toContain("temporary edit-session identifier");
    expect(sql).toContain("promoted and must be retained");
    expect(sql).toContain("eligible for cleanup");
  });
});
