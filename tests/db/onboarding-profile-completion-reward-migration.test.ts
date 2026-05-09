import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "024_onboarding_profile_completion_rewards.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8");
}

describe("onboarding reward schema migration", () => {
  it("creates configurable reward programs and one wallet-bound row per campaign", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("create table if not exists onboarding_reward_programs");
    expect(sql).toContain("code text not null unique");
    expect(sql).toContain("kyc_review_grace_hours integer not null");
    expect(sql).toContain("create table if not exists user_onboarding_rewards");
    expect(sql).toContain("constraint uq_user_onboarding_rewards_wallet_program unique (wallet_public_key, program_id)");
  });

  it("persists reward lifecycle timestamps and one-time order bindings", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("profile_completed_at timestamptz");
    expect(sql).toContain("kyc_submitted_at timestamptz");
    expect(sql).toContain("kyc_review_grace_deadline_at timestamptz");
    expect(sql).toContain("reserved_order_id text references orders(id)");
    expect(sql).toContain("consumed_order_id text references orders(id)");
    expect(sql).toContain("status in ('pending_profile', 'pending_kyc', 'pending_review', 'earned', 'reserved', 'consumed', 'expired')");
  });

  it("extends orders with subtotal, discount and applied reward linkage", () => {
    const sql = getMigrationSql().toLowerCase();

    expect(sql).toContain("add column if not exists subtotal_amount_usd");
    expect(sql).toContain("add column if not exists discount_amount_usd");
    expect(sql).toContain("add column if not exists applied_onboarding_reward_id");
    expect(sql).toContain("chk_orders_discount_lte_subtotal");
  });
});
