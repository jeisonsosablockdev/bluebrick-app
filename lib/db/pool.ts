import { Pool, type PoolClient } from "pg";

declare global {
  var __dbPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
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
  const client = await getDbPool().connect();

  try {
    return await work(client);
  } finally {
    client.release();
  }
}
