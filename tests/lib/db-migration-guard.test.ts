import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

const { execFileSyncMock, readdirMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(),
  readdirMock: vi.fn()
}));

vi.mock("node:fs/promises", () => ({
  readdir: readdirMock
}));

vi.mock("node:child_process", () => ({
  execFileSync: execFileSyncMock
}));

import {
  assertDatabaseMigrationsApplied,
  resetDatabaseMigrationGuardForTests
} from "@/lib/db/migration-guard";

type QueryResult = {
  rows: Array<Record<string, unknown>>;
  rowCount?: number;
};

function createPoolWithQueryResults(results: QueryResult[]) {
  const release = vi.fn();
  const query = vi.fn(async () => results.shift() ?? { rows: [], rowCount: 0 });
  const connect = vi.fn(async () => ({
    query,
    release
  }));

  return {
    connect,
    query,
    release
  };
}

function buildMigrationDirEntry(name: string) {
  return {
    name,
    isFile: () => true
  };
}

describe("lib/db/migration-guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDatabaseMigrationGuardForTests();
    vi.unstubAllEnvs();
    vi.stubEnv("DATABASE_URL", "postgres://example");
    vi.stubEnv("NODE_ENV", "development");
    readdirMock.mockResolvedValue([
      buildMigrationDirEntry("001_initial_schema.sql"),
      buildMigrationDirEntry("002_add_rewards.sql")
    ]);
    execFileSyncMock.mockReturnValue(
      "db/migrations/001_initial_schema.sql\ndb/migrations/002_add_rewards.sql\n"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes when all tracked migrations are already applied", async () => {
    const pool = createPoolWithQueryResults([
      {
        rows: [{ table_name: "schema_migrations" }],
        rowCount: 1
      },
      {
        rows: [{ id: "001_initial_schema.sql" }, { id: "002_add_rewards.sql" }],
        rowCount: 2
      }
    ]);

    await expect(assertDatabaseMigrationsApplied(pool as unknown as Pool)).resolves.toBeUndefined();
    await expect(assertDatabaseMigrationsApplied(pool as unknown as Pool)).resolves.toBeUndefined();

    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.release).toHaveBeenCalledTimes(1);
  });

  it("fails loudly when tracked migrations are still pending", async () => {
    const pool = createPoolWithQueryResults([
      {
        rows: [{ table_name: "schema_migrations" }],
        rowCount: 1
      },
      {
        rows: [{ id: "001_initial_schema.sql" }],
        rowCount: 1
      }
    ]);

    await expect(assertDatabaseMigrationsApplied(pool as unknown as Pool)).rejects.toThrow(
      "Pending tracked database migrations detected"
    );
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.release).toHaveBeenCalledTimes(1);
  });
});
