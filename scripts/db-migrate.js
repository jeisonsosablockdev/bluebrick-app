#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db", "migrations");

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for db:migrate.");
  }

  return databaseUrl;
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^[0-9]+_.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function hasMigration(client, id) {
  const result = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1 LIMIT 1", [id]);
  return result.rowCount > 0;
}

async function applyMigration(client, id) {
  const filePath = path.join(MIGRATIONS_DIR, id);
  const sql = await fs.readFile(filePath, "utf8");

  await client.query("BEGIN");

  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
    await client.query("COMMIT");
    console.log(`Applied migration: ${id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const pool = new Pool({ connectionString: requireDatabaseUrl() });
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);
    const files = await listMigrationFiles();

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const file of files) {
      if (await hasMigration(client, file)) {
        console.log(`Skipped migration: ${file}`);
        continue;
      }

      await applyMigration(client, file);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
