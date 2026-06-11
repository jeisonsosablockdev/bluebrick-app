import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "034_distribution_preparation.sql";

function readMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8").toLowerCase();
}

describe("distribution preparation migration", () => {
  it("creates immutable distribution run storage scoped by collection and property", () => {
    const sql = readMigrationSql();

    expect(sql).toContain("create table if not exists distribution_runs");
    expect(sql).toContain("collection_address text not null");
    expect(sql).toContain("property_id text not null references marketplace_entries(id) on delete restrict");
    expect(sql).toContain("period_timezone text not null default 'america/bogota'");
    expect(sql).toContain("status text not null check (status in ('draft', 'blocked', 'finalized', 'failed'))");
    expect(sql).toContain("create unique index if not exists distribution_runs_scope_policy_uidx");
  });

  it("creates distribution items and append-only audit records", () => {
    const sql = readMigrationSql();

    expect(sql).toContain("create table if not exists distribution_items");
    expect(sql).toContain("amount_minor bigint not null check (amount_minor >= 0)");
    expect(sql).toContain("rounding_remainder_rank integer");
    expect(sql).toContain("create table if not exists distribution_audit_events");
    expect(sql).toContain("event_payload jsonb not null default '{}'::jsonb");
  });
});
