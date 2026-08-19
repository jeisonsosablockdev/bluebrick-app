import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("db/migrations/032_marketplace_entry_postal_code.sql", () => {
  it("adds first-class postal code storage to marketplace_entries", () => {
    const sql = readFileSync(
      join(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations", "032_marketplace_entry_postal_code.sql"),
      "utf8"
    ).toLowerCase();

    expect(sql).toContain("alter table marketplace_entries");
    expect(sql).toContain("add column if not exists postal_code text");
    expect(sql).toContain("comment on column marketplace_entries.postal_code");
  });
});
