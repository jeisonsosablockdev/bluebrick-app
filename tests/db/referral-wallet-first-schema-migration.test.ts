import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "023_referral_wallet_first_schema.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations", migrationFileName), "utf8");
}

describe("referral wallet-first schema migration", () => {
  it("aligns referral identity to wallet_public_key instead of users(id)", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).not.toContain("references users(id)");
    expect(sql).toContain("referrer_wallet_public_key text not null references user_profiles(wallet_public_key)");
    expect(sql).toContain("invitee_wallet_public_key text not null references user_profiles(wallet_public_key)");
    expect(sql).toContain("approved_by_actor_id text");
  });

  it("anchors reward eligibility to existing purchase and webhook tables", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("purchase_attempt_id text not null references purchase_attempts(id)");
    expect(sql).toContain("purchase_webhook_event_id text references purchase_webhook_events(id)");
    expect(sql).toContain("one reward-event record per eligible nft purchase, sourced from purchase_attempts confirmed via purchase_webhook_events");
    expect(sql).toContain("create unique index if not exists referral_reward_events_attempt_mint_uidx");
  });

  it("preserves the active-attribution and payout invariants required by the RFC", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create unique index if not exists referral_attributions_active_invitee_wallet_uidx");
    expect(sql).toContain("where status in ('bound_pending_kyc', 'kyc_verified')");
    expect(sql).toContain("holding_period_days integer not null default 7");
    expect(sql).toContain("eligibility_window_days integer not null default 30");
    expect(sql).toContain("create table if not exists referral_payout_items");
    expect(sql).toContain("constraint uq_referral_payout_items_reward_event unique (reward_event_id)");
  });
});
