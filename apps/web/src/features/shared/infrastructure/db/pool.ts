import { Pool, type PoolClient } from "pg";

import { normalizeDatabaseUrlForPg } from "@/lib/db/connection-string";
import { assertDatabaseMigrationsApplied } from "@/lib/db/migration-guard";

declare global {
  var __dbPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return normalizeDatabaseUrlForPg(databaseUrl);
}

export function getDbPool(): Pool {
  if (!global.__dbPool) {
    global.__dbPool = new Pool({
      connectionString: getDatabaseUrl()
    });

    // Avoid unhandled idle-client errors (e.g. transient ECONNRESET) from crashing SSR routes.
    global.__dbPool.on("error", () => {});
  }

  return global.__dbPool;
}

export async function withDbClient<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getDbPool();
  await assertDatabaseMigrationsApplied(pool);
  const client = await pool.connect();

  try {
    return await work(client);
  } finally {
    client.release();
  }
}
