import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "029_admin_push_campaigns.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("admin push campaigns migration", () => {
  it("creates the campaign audit table with status and audience guardrails", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists admin_push_campaigns");
    expect(sql).toContain("message_class text not null check");
    expect(sql).toContain("audience_hash text not null");
    expect(sql).toContain("status text not null check");
    expect(sql).toContain("reason_codes text[] not null");
    expect(sql).toContain("queued_job_count integer not null default 0");
  });
});
