import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationFileName = "043_distribution_payout_overrides.sql";

function getMigrationSql(): string {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      "apps",
      "web",
      "src",
      "features",
      "shared",
      "infrastructure",
      "db",
      "migrations",
      migrationFileName
    ),
    "utf8"
  );
}

describe("distribution_payout_overrides database migration (043)", () => {
  it("creates the distribution_payout_overrides table with required columns and constraints", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists distribution_payout_overrides");
    expect(sql).toContain("original_wallet varchar(64) not null");
    expect(sql).toContain("requested_wallet varchar(64) not null");
    expect(sql).toContain("effective_wallet varchar(64) not null");
    expect(sql).toContain("case_number varchar(64) not null");
    expect(sql).toContain("status varchar(32) not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired'))");
    expect(sql).toContain("version integer not null default 1");
    expect(sql).toContain("reason text not null");
    expect(sql).toContain("approval_tx_signature varchar(128)");
    expect(sql).toContain("constraint chk_override_wallets_distinct check (original_wallet <> requested_wallet)");
  });

  it("creates required indexes for efficient lookup and audit compliance", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create index if not exists idx_payout_overrides_case_number");
    expect(sql).toContain("create index if not exists idx_payout_overrides_original_wallet");
    expect(sql).toContain("create index if not exists idx_payout_overrides_status");
    expect(sql).toContain("create index if not exists idx_payout_overrides_lookup");
  });
});
