import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "031_stake_profile_persistence.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations", migrationFileName), "utf8");
}

describe("stake profile persistence migration", () => {
  it("creates the attempt table used to correlate signed actions with webhook observations", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists stake_action_attempts");
    expect(sql).toContain("idempotency_key text not null unique");
    expect(sql).toContain("tx_signature text unique");
    expect(sql).toContain("status text not null check (status in ('prepared', 'submitted', 'validated', 'reconcile_pending', 'rejected', 'failed'))");
  });

  it("creates the derived profile projection for validated stake events", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists user_profile_stake_events");
    expect(sql).toContain("webhook_event_id text references webhook_events(id)");
    expect(sql).toContain("canonical_timezone text not null default 'america/bogota'");
    expect(sql).toContain("validation_status text not null check (validation_status in ('pending', 'validated', 'reconcile_pending', 'rejected'))");
    expect(sql).toContain("create unique index if not exists user_profile_stake_events_signature_asset_action_uidx");
  });
});

