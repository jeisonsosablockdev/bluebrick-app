import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "027_web_push_subscriptions.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations", migrationFileName), "utf8");
}

describe("web push subscriptions migration", () => {
  it("creates a multi-endpoint subscription table with lifecycle fields", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists web_push_subscriptions");
    expect(sql).toContain("endpoint text not null unique");
    expect(sql).toContain("platform_family text not null check");
    expect(sql).toContain("app_mode text not null check");
    expect(sql).toContain("status text not null default 'active' check");
    expect(sql).toContain("subscribed_at timestamptz not null default now()");
    expect(sql).toContain("last_seen_at timestamptz not null default now()");
    expect(sql).toContain("revoked_at timestamptz");
  });

  it("binds each endpoint to an account-wallet pair instead of trusting a loose user id", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create unique index if not exists account_wallet_identities_account_wallet_uidx");
    expect(sql).toContain("foreign key (account_id, wallet_public_key)");
    expect(sql).toContain("references account_wallet_identities(account_id, wallet_public_key)");
  });
});
