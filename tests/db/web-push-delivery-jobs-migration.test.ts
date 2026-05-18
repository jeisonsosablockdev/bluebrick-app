import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "028_web_push_delivery_jobs.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("web push delivery jobs migration", () => {
  it("creates job and attempt tables with idempotent delivery tracking", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists web_push_delivery_jobs");
    expect(sql).toContain("dedupe_key text not null unique");
    expect(sql).toContain("status text not null default 'queued' check");
    expect(sql).toContain("total_subscriptions integer not null default 0");
    expect(sql).toContain("create table if not exists web_push_delivery_attempts");
    expect(sql).toContain("unique (job_id, subscription_id)");
    expect(sql).toContain("status text not null check");
  });
});
