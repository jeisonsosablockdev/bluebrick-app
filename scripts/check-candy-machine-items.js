#!/usr/bin/env node

const { PublicKey } = require("@solana/web3.js");

const EXIT_USAGE_ERROR = 2;
const EXIT_QUERY_ERROR = 3;

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

function printUsage() {
  writeStdout(
    [
      "Usage:",
      "  node scripts/check-candy-machine-items.js --candy-machine <ADDRESS> [--expected <NUMBER>] [--rpc <URL>] [--json]",
      "",
      "Examples:",
      "  node scripts/check-candy-machine-items.js --candy-machine 96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3 --expected 400",
      "  node scripts/check-candy-machine-items.js --candy-machine 96BNZVbtC4qyTp8THm3q1dpmcFqmVoDzpVrLuLTJdvU3 --rpc https://api.devnet.solana.com --json",
      "",
      "Env fallback for RPC:",
      "  NEXT_PUBLIC_SOLANA_RPC, SOLANA_RPC_URL",
    ].join("\n"),
  );
}

function parsePositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${optionName} must be a positive integer.`);
  }
  return parsed;
}

function parseArgs(argv) {
  const parsed = {
    candyMachineAddress: "",
    expectedItems: null,
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      parsed.help = true;
      return parsed;
    }

    if (token === "--json") {
      parsed.json = true;
      continue;
    }

    if (token === "--candy-machine" || token === "-c") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--candy-machine requires a value.");
      }
      parsed.candyMachineAddress = value.trim();
      index += 1;
      continue;
    }

    if (token === "--expected" || token === "-e") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--expected requires a value.");
      }
      parsed.expectedItems = parsePositiveInteger(value, "--expected");
      index += 1;
      continue;
    }

    if (token === "--rpc" || token === "-r") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--rpc requires a value.");
      }
      parsed.rpcUrl = value.trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${token}`);
  }

  if (!parsed.candyMachineAddress) {
    throw new Error("--candy-machine is required.");
  }

  return parsed;
}

function asNumber(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function fetchCandyMachineStats(input) {
  const [{ createUmi }, { mplCandyMachine, fetchCandyMachine }, { publicKey }] = await Promise.all([
    import("@metaplex-foundation/umi-bundle-defaults"),
    import("@metaplex-foundation/mpl-core-candy-machine"),
    import("@metaplex-foundation/umi"),
  ]);

  const umi = createUmi(input.rpcUrl).use(mplCandyMachine());
  const account = await fetchCandyMachine(umi, publicKey(input.candyMachineAddress));
  const itemsLoaded = asNumber(account.itemsLoaded);
  const itemsAvailable = asNumber(account.data?.itemsAvailable);
  const itemsRedeemed = asNumber(account.itemsRedeemed);
  const itemsRemaining = Math.max(0, itemsAvailable - itemsLoaded);
  const progressPercent = itemsAvailable > 0 ? Number(((itemsLoaded / itemsAvailable) * 100).toFixed(2)) : 0;

  return {
    rpcUrl: input.rpcUrl,
    candyMachineAddress: String(account.publicKey),
    authority: String(account.authority),
    collectionMint: String(account.collectionMint),
    itemsLoaded,
    itemsAvailable,
    itemsRedeemed,
    itemsRemaining,
    progressPercent,
    expectedItems: input.expectedItems,
    matchesExpected: input.expectedItems === null ? null : itemsLoaded === input.expectedItems,
  };
}

function printHuman(stats) {
  writeStdout(`RPC: ${stats.rpcUrl}`);
  writeStdout(`Candy Machine: ${stats.candyMachineAddress}`);
  writeStdout(`Authority: ${stats.authority}`);
  writeStdout(`Collection: ${stats.collectionMint}`);
  writeStdout(`Items loaded: ${stats.itemsLoaded}/${stats.itemsAvailable} (${stats.progressPercent}%)`);
  writeStdout(`Items redeemed: ${stats.itemsRedeemed}`);
  writeStdout(`Items remaining: ${stats.itemsRemaining}`);

  if (stats.expectedItems !== null) {
    const status = stats.matchesExpected ? "OK" : "MISMATCH";
    writeStdout(`Expected loaded items: ${stats.expectedItems} -> ${status}`);
  }
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    writeStderr(error instanceof Error ? error.message : "Invalid arguments.");
    printUsage();
    process.exit(EXIT_USAGE_ERROR);
  }

  if (args.help) {
    printUsage();
    return;
  }

  try {
    args.candyMachineAddress = new PublicKey(args.candyMachineAddress).toBase58();
  } catch {
    writeStderr("Invalid --candy-machine value. It must be a valid Solana public key.");
    process.exit(EXIT_USAGE_ERROR);
  }

  let stats;
  try {
    stats = await fetchCandyMachineStats(args);
  } catch (error) {
    writeStderr(error instanceof Error ? error.message : "Could not query candy machine.");
    process.exit(EXIT_QUERY_ERROR);
  }

  if (args.json) {
    writeStdout(JSON.stringify(stats, null, 2));
  } else {
    printHuman(stats);
  }

  if (stats.expectedItems !== null && !stats.matchesExpected) {
    process.exit(1);
  }
}

main();
