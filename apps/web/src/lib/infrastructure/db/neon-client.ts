/**
 * @file apps/web/src/lib/infrastructure/db/neon-client.ts
 * @description Layer 4: Infrastructure - Serverless Neon PostgreSQL database client connector.
 * Provides resilient query execution for Vercel Serverless environment.
 */

import { Pool, type QueryResult, type QueryResultRow } from "pg";

export interface DatabaseExecutor {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryText: string,
    values?: I
  ): Promise<QueryResult<R>>;
}

let poolInstance: Pool | null = null;

/**
 * Resolves the active PostgreSQL database pool instance.
 */
export function getDatabasePool(): Pool {
  // Step 1: Return existing pool instance if already initialized
  if (poolInstance) {
    return poolInstance;
  }

  // Step 2: Extract DATABASE_URL from environment
  const connectionString = process.env.DATABASE_URL;

  // Step 3: Initialize connection pool with SSL configured for Neon Serverless
  poolInstance = new Pool({
    connectionString: connectionString || undefined,
    ssl: connectionString && !connectionString.includes("localhost")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return poolInstance;
}

/**
 * Helper to execute parameterized SQL queries safely.
 */
export async function executeQuery<R extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<R>> {
  // Step 1: Obtain DB executor
  const db = getDatabasePool();

  // Step 2: Execute query with parameters
  return db.query<R>(text, params);
}
