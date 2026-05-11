#!/usr/bin/env node
const { hasDatabaseUrlConfigured, runMigrations } = require("./db-migrate.js");

async function main() {
  if (!hasDatabaseUrlConfigured()) {
    console.log("Skipping db:migrate bootstrap because DATABASE_URL is not configured.");
    return;
  }

  await runMigrations();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
