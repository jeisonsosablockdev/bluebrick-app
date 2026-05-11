#!/usr/bin/env node
const { checkPendingMigrations, hasDatabaseUrlConfigured, runMigrations } = require("./db-migrate.js");

async function main() {
  if (!hasDatabaseUrlConfigured()) {
    console.log("Skipping validate:db because DATABASE_URL is not configured.");
    return;
  }

  await runMigrations();
  await checkPendingMigrations();
  console.log("Database migration validation passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
