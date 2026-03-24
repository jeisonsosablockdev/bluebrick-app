#!/usr/bin/env node

const { Pool } = require("pg");

function printUsage() {
  process.stdout.write(
    [
      "Usage:",
      "  node scripts/purchase-trace.js --flow-id <FLOW_ID> [--json]",
      "",
      "Examples:",
      "  node scripts/purchase-trace.js --flow-id 0195af5f-95d7-7f28-8fd7-8ad4bc8f6af3",
      "  node scripts/purchase-trace.js --flow-id flow-123 --json"
    ].join("\n")
  );
  process.stdout.write("\n");
}

function parseArgs(argv) {
  let flowId = "";
  let asJson = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      return { help: true, flowId: "", asJson: false };
    }

    if (token === "--json") {
      asJson = true;
      continue;
    }

    if (token === "--flow-id" || token === "-f") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--flow-id requires a value.");
      }
      flowId = next.trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  if (!flowId) {
    throw new Error("--flow-id is required.");
  }

  return {
    help: false,
    flowId,
    asJson
  };
}

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("DATABASE_URL is required.");
  }

  return value;
}

function formatRow(row) {
  return {
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    endpoint: String(row.endpoint),
    phase: String(row.phase),
    statusCode: row.status_code === null ? null : Number(row.status_code),
    errorCode: row.error_code === null ? null : String(row.error_code),
    walletPublicKey: row.wallet_public_key === null ? null : String(row.wallet_public_key),
    propertyId: row.property_id === null ? null : String(row.property_id),
    attemptId: row.attempt_id === null ? null : String(row.attempt_id),
    idempotencyKey: row.idempotency_key === null ? null : String(row.idempotency_key),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {}
  };
}

async function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "Invalid arguments."}\n`);
    printUsage();
    process.exit(2);
  }

  if (args.help) {
    printUsage();
    return;
  }

  const pool = new Pool({
    connectionString: requireDatabaseUrl()
  });

  try {
    const result = await pool.query(
      `SELECT
         flow_id,
         endpoint,
         phase,
         wallet_public_key,
         property_id,
         attempt_id,
         idempotency_key,
         status_code,
         error_code,
         metadata,
         created_at
       FROM purchase_flow_events
       WHERE flow_id = $1
       ORDER BY created_at ASC`,
      [args.flowId]
    );

    const rows = result.rows.map((row) => formatRow(row));
    if (args.asJson) {
      process.stdout.write(`${JSON.stringify({ flowId: args.flowId, events: rows }, null, 2)}\n`);
      return;
    }

    process.stdout.write(`Flow ID: ${args.flowId}\n`);
    process.stdout.write(`Events: ${rows.length}\n`);
    for (const [index, row] of rows.entries()) {
      process.stdout.write(
        `${index + 1}. [${row.createdAt}] ${row.endpoint}/${row.phase} status=${row.statusCode ?? "-"} error=${row.errorCode ?? "-"}\n`
      );
      if (row.attemptId || row.idempotencyKey) {
        process.stdout.write(`   attemptId=${row.attemptId ?? "-"} idempotencyKey=${row.idempotencyKey ?? "-"}\n`);
      }
      if (Object.keys(row.metadata).length > 0) {
        process.stdout.write(`   metadata=${JSON.stringify(row.metadata)}\n`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
