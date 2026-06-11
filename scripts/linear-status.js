#!/usr/bin/env node
const {
  normalizeIssueKey,
  normalizeStateCommand,
  updateLinearIssueStatus
} = require("./linear-status-core");

function usage() {
  return [
    "Usage:",
    "  node ./scripts/linear-status.js --state <start|review|done> [--issue <BRI-149>] [--branch <branch>] [--cwd <path>]",
    "",
    "Examples:",
    "  node ./scripts/linear-status.js --state start",
    "  node ./scripts/linear-status.js --state review --issue BRI-149",
    "  node ./scripts/linear-status.js --state done --issue EPIC-011",
    "",
    "Environment:",
    "  LINEAR_API_KEY         Required to call the Linear GraphQL API",
    "  LINEAR_AUTOSTATUS=0    Disable automatic updates without changing the command",
    "  LINEAR_GRAPHQL_ENDPOINT  Override the Linear GraphQL endpoint for testing"
  ].join("\n");
}

function parseArgs(argv) {
  const args = {
    state: "",
    issue: "",
    branch: "",
    cwd: process.cwd(),
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--state" || token === "--issue" || token === "--branch" || token === "--cwd") {
      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${token}.`);
      }

      if (token === "--state") args.state = next;
      if (token === "--issue") args.issue = next;
      if (token === "--branch") args.branch = next;
      if (token === "--cwd") args.cwd = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

async function runCli(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(usage());
    return;
  }

  if (!args.state) {
    throw new Error("Missing required --state argument.");
  }

  if (args.issue) {
    normalizeIssueKey(args.issue);
  }

  normalizeStateCommand(args.state);

  await updateLinearIssueStatus({
    issueKey: args.issue,
    branchName: args.branch,
    stateCommand: args.state,
    cwd: args.cwd
  });
}

if (require.main === module) {
  runCli(process.argv.slice(2)).catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  runCli,
  usage
};
