#!/usr/bin/env node
const { runCli } = require("./rfc-new-core");

runCli(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

