#!/usr/bin/env node
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { Pool } = require("pg");

const MIGRATIONS_DIR = path.resolve(process.cwd(), "apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations");
const explicitEnvKeys = new Set(Object.keys(process.env));

function parseEnvValue(rawValue) {
  const value = rawValue.trim();

  if (value.length === 0) {
    return "";
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    const unquoted = value.slice(1, -1);
    return value.startsWith('"') ? unquoted.replace(/\\n/g, "\n") : unquoted;
  }

  return value;
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);

  if (!fsSync.existsSync(filePath)) {
    return;
  }

  const content = fsSync.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (explicitEnvKeys.has(key)) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue);
  }
}

function loadLocalEnv() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

function hasDatabaseUrlConfigured() {
  loadLocalEnv();
  return Boolean(process.env.DATABASE_URL?.trim());
}

function requireDatabaseUrl() {
  if (!hasDatabaseUrlConfigured()) {
    throw new Error("DATABASE_URL is required for db:migrate.");
  }

  return process.env.DATABASE_URL.trim();
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
  const allFiles = entries
    .filter((entry) => entry.isFile() && /^[0-9]+_.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (process.env.DB_MIGRATE_INCLUDE_UNTRACKED === "1") {
    return {
      files: allFiles,
      skippedUntracked: []
    };
  }

  const trackedFiles = getTrackedMigrationFiles();
  if (!trackedFiles) {
    return {
      files: allFiles,
      skippedUntracked: []
    };
  }

  return filterTrackedMigrationFiles(allFiles, trackedFiles);
}

function getTrackedMigrationFiles() {
  try {
    const output = execFileSync("git", ["ls-files", "--", path.join("apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations")], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });

    return new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((filePath) => path.basename(filePath))
    );
  } catch {
    return null;
  }
}

function filterTrackedMigrationFiles(allFiles, trackedFiles) {
  const files = allFiles.filter((file) => trackedFiles.has(file));
  const skippedUntracked = allFiles.filter((file) => !trackedFiles.has(file));

  return {
    files,
    skippedUntracked
  };
}

async function hasMigrationTable(client) {
  const result = await client.query("SELECT to_regclass('public.schema_migrations') AS table_name");
  return Boolean(result.rows[0]?.table_name);
}

async function listAppliedMigrationIds(client) {
  if (!(await hasMigrationTable(client))) {
    return new Set();
  }

  const result = await client.query("SELECT id FROM schema_migrations ORDER BY id ASC");
  return new Set(result.rows.map((row) => String(row.id)));
}

function diffPendingMigrationFiles(files, appliedMigrationIds) {
  return files.filter((file) => !appliedMigrationIds.has(file));
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

async function getMigrationStatus(client) {
  const { files, skippedUntracked } = await listMigrationFiles();
  const appliedMigrationIds = await listAppliedMigrationIds(client);
  const pendingFiles = diffPendingMigrationFiles(files, appliedMigrationIds);

  return {
    files,
    skippedUntracked,
    appliedMigrationIds,
    pendingFiles
  };
}

function logSkippedUntrackedMigrations(skippedUntracked) {
  for (const file of skippedUntracked) {
    console.log(`Ignored untracked migration: ${file}`);
  }
}

async function runMigrations() {
  const pool = new Pool({ connectionString: requireDatabaseUrl() });
  const client = await pool.connect();

  try {
    await ensureMigrationTable(client);
    const { files, skippedUntracked, appliedMigrationIds } = await getMigrationStatus(client);

    if (files.length === 0) {
      console.log("No migration files found.");
      return {
        files,
        skippedUntracked,
        appliedMigrationIds,
        pendingFiles: []
      };
    }

    logSkippedUntrackedMigrations(skippedUntracked);

    for (const file of files) {
      if (appliedMigrationIds.has(file)) {
        console.log(`Skipped migration: ${file}`);
        continue;
      }

      await applyMigration(client, file);
      appliedMigrationIds.add(file);
    }

    return {
      files,
      skippedUntracked,
      appliedMigrationIds,
      pendingFiles: []
    };
  } finally {
    client.release();
    await pool.end();
  }
}

async function checkPendingMigrations() {
  const pool = new Pool({ connectionString: requireDatabaseUrl() });
  const client = await pool.connect();

  try {
    const status = await getMigrationStatus(client);

    if (status.files.length === 0) {
      console.log("No migration files found.");
      return status;
    }

    logSkippedUntrackedMigrations(status.skippedUntracked);

    if (status.pendingFiles.length > 0) {
      const pendingList = status.pendingFiles.map((file) => `- ${file}`).join("\n");
      throw new Error(
        `Pending tracked migrations detected. Run npm run db:migrate before continuing.\n${pendingList}`
      );
    }

    console.log(`Database migrations are current (${status.files.length} tracked files).`);
    return status;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const checkOnly = process.argv.slice(2).includes("--check");

  if (checkOnly) {
    await checkPendingMigrations();
    return;
  }

  await runMigrations();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

module.exports = {
  checkPendingMigrations,
  diffPendingMigrationFiles,
  filterTrackedMigrationFiles,
  getMigrationStatus,
  getTrackedMigrationFiles,
  hasDatabaseUrlConfigured,
  listMigrationFiles,
  parseEnvValue,
  requireDatabaseUrl,
  runMigrations
};
