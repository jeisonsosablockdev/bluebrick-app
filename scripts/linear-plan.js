#!/usr/bin/env node
const { runCli } = require("./linear-plan-core");

runCli(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
