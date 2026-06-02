import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationFileName = "033_core_candy_machine_transaction_manifest.sql";

function getMigrationSql(): string {
  return fs.readFileSync(path.join(process.cwd(), "db", "migrations", migrationFileName), "utf8").toLowerCase();
}

describe("core candy machine transaction manifest migration", () => {
  it("creates the manifest table with deterministic idempotency and status tracking", () => {
    const sql = getMigrationSql();

    expect(sql).toContain("create table if not exists core_candy_machine_transaction_manifest");
    expect(sql).toContain("flow_id text not null");
    expect(sql).toContain("tx_index integer not null check (tx_index >= 0)");
    expect(sql).toContain("unique (flow_id, tx_index)");
    expect(sql).toContain("status text not null check (status in ('prepared', 'signed', 'submitted', 'confirmed', 'failed'))");
    expect(sql).toContain("transaction_base64_hash text not null");
    expect(sql).toContain("signed_transaction_base64_hash text");
  });

  it("allows every Core Candy Machine lifecycle transaction kind", () => {
    const sql = getMigrationSql();

    for (const txKind of [
      "create-collection",
      "create-candy-machine",
      "add-config-lines",
      "mint",
      "add-app-data-plugin",
      "write-app-data",
      "add-owner-freeze-plugin"
    ]) {
      expect(sql).toContain(`'${txKind}'`);
    }
  });

  it("adds lookup indexes for flow, collection, signature and status reconciliation", () => {
    const sql = getMigrationSql();

    expect(sql).toContain("core_cm_tx_manifest_flow_idx");
    expect(sql).toContain("core_cm_tx_manifest_collection_idx");
    expect(sql).toContain("core_cm_tx_manifest_status_idx");
    expect(sql).toContain("core_cm_tx_manifest_signature_uidx");
  });
});
