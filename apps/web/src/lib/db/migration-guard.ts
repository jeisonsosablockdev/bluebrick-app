import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import type { Pool } from "pg";

function getMigrationsDir(): string {
  const canonicalPath = path.resolve(
    process.cwd(),
    "apps",
    "web",
    "src",
    "features",
    "shared",
    "infrastructure",
    "db",
    "migrations"
  );

  if (fs.existsSync(canonicalPath)) {
    return canonicalPath;
  }

  return path.resolve(process.cwd(), "db", "migrations");
}

function getRelativeMigrationsPath(): string {
  const canonicalPath = path.resolve(
    process.cwd(),
    "apps",
    "web",
    "src",
    "features",
    "shared",
    "infrastructure",
    "db",
    "migrations"
  );

  if (fs.existsSync(canonicalPath)) {
    return path.join("apps", "web", "src", "features", "shared", "infrastructure", "db", "migrations");
  }

  return path.join("db", "migrations");
}

declare global {
  var __dbMigrationGuardPromise: Promise<void> | undefined;
}

function shouldEnforceDatabaseMigrationGuard(): boolean {
  if (!process.env.DATABASE_URL?.trim()) {
    return false;
  }

  if (process.env.DB_MIGRATION_RUNTIME_GUARD === "0") {
    return false;
  }

  return process.env.NODE_ENV !== "production" || process.env.CI === "true";
}

async function listTrackedMigrationFiles(): Promise<string[]> {
  const migrationsDir = getMigrationsDir();
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const allFiles = entries
    .filter((entry) => entry.isFile() && /^[0-9]+_.*\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (process.env.DB_MIGRATE_INCLUDE_UNTRACKED === "1") {
    return allFiles;
  }

  const trackedFiles = getTrackedMigrationFiles();
  if (!trackedFiles) {
    return allFiles;
  }

  return allFiles.filter((file) => trackedFiles.has(file));
}

function getTrackedMigrationFiles(): Set<string> | null {
  try {
    const relativePath = getRelativeMigrationsPath();
    const output = execFileSync("git", ["ls-files", "--", relativePath], {
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

function buildPendingMigrationMessage(pendingFiles: string[]): string {
  const pendingList = pendingFiles.map((file) => `- ${file}`).join("\n");
  return `Pending tracked database migrations detected. Run npm run db:migrate and restart the dev server before using DB-backed flows.\n${pendingList}`;
}

async function queryPendingMigrations(pool: Pool): Promise<string[]> {
  const files = await listTrackedMigrationFiles();

  if (files.length === 0) {
    return [];
  }

  const client = await pool.connect();

  try {
    const tableResult = await client.query("SELECT to_regclass('public.schema_migrations') AS table_name");
    if (!tableResult.rows[0]?.table_name) {
      return files;
    }

    const result = await client.query("SELECT id FROM schema_migrations ORDER BY id ASC");
    const appliedMigrationIds = new Set(result.rows.map((row) => String(row.id)));

    return files.filter((file) => !appliedMigrationIds.has(file));
  } finally {
    client.release();
  }
}

export async function assertDatabaseMigrationsApplied(pool: Pool): Promise<void> {
  if (!shouldEnforceDatabaseMigrationGuard()) {
    return;
  }

  if (!global.__dbMigrationGuardPromise) {
    global.__dbMigrationGuardPromise = (async () => {
      const pendingFiles = await queryPendingMigrations(pool);

      if (pendingFiles.length > 0) {
        throw new Error(buildPendingMigrationMessage(pendingFiles));
      }
    })().catch((error) => {
      global.__dbMigrationGuardPromise = undefined;
      throw error;
    });
  }

  await global.__dbMigrationGuardPromise;
}

export function resetDatabaseMigrationGuardForTests(): void {
  global.__dbMigrationGuardPromise = undefined;
}
