import process from "node:process";

import { runCollectionBootstrapDryRunCli } from "../lib/admin/collection-bootstrap-dry-run-cli.ts";

const result = await runCollectionBootstrapDryRunCli(process.argv.slice(2));

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exitCode = result.exitCode;
