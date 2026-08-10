import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  COLLECTION_BOOTSTRAP_DRY_RUN_VERSION,
  runCollectionBootstrapDryRun,
  type CollectionBootstrapDryRunManifest
} from "./collection-bootstrap-dry-run.ts";

export type CollectionBootstrapDryRunCliOptions = {
  actorPubkey: string | null;
  entryIds: string[];
  outputFile: string | null;
  pretty: boolean;
  help: boolean;
};

const HELP_TEXT = `Usage: npm run collection:bootstrap:dry-run -- [options]

Options:
  --actor-pubkey <pubkey>   Limit the dry-run to marketplace entries owned by one admin.
  --entry-id <id>           Limit the dry-run to a specific marketplace entry. Repeatable.
  --output-file <path>      Write the manifest JSON to disk instead of stdout.
  --compact                 Emit compact JSON instead of pretty JSON.
  --help                    Show this help text.
`;

export function parseCollectionBootstrapDryRunArgs(argv: string[]): CollectionBootstrapDryRunCliOptions {
  const entryIds: string[] = [];
  let actorPubkey: string | null = null;
  let outputFile: string | null = null;
  let pretty = true;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    switch (token) {
      case "--actor-pubkey": {
        actorPubkey = argv[index + 1]?.trim() || null;
        index += 1;
        break;
      }
      case "--entry-id": {
        const entryId = argv[index + 1]?.trim();
        if (entryId) {
          entryIds.push(entryId);
        }
        index += 1;
        break;
      }
      case "--output-file": {
        outputFile = argv[index + 1]?.trim() || null;
        index += 1;
        break;
      }
      case "--compact": {
        pretty = false;
        break;
      }
      case "--help":
      case "-h": {
        help = true;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${token}`);
      }
    }
  }

  return {
    actorPubkey,
    entryIds,
    outputFile,
    pretty,
    help
  };
}

export function renderCollectionBootstrapDryRunManifest(
  manifest: CollectionBootstrapDryRunManifest,
  pretty: boolean
): string {
  return JSON.stringify(manifest, null, pretty ? 2 : 0);
}

export function getCollectionBootstrapDryRunHelpText(): string {
  return HELP_TEXT;
}

export async function runCollectionBootstrapDryRunCli(argv: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  manifest: CollectionBootstrapDryRunManifest | null;
}> {
  let options: CollectionBootstrapDryRunCliOptions;

  try {
    options = parseCollectionBootstrapDryRunArgs(argv);
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : "Invalid arguments."}\n`,
      manifest: null
    };
  }

  if (options.help) {
    return {
      exitCode: 0,
      stdout: getCollectionBootstrapDryRunHelpText(),
      stderr: "",
      manifest: null
    };
  }

  try {
    const manifest = await runCollectionBootstrapDryRun({
      actorPubkey: options.actorPubkey ?? undefined,
      entryIds: options.entryIds,
      version: COLLECTION_BOOTSTRAP_DRY_RUN_VERSION
    });
    const rendered = renderCollectionBootstrapDryRunManifest(manifest, options.pretty);

    if (options.outputFile) {
      const absolutePath = path.resolve(options.outputFile);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, `${rendered}\n`, "utf8");

      return {
        exitCode: 0,
        stdout: `${absolutePath}\n`,
        stderr: "",
        manifest
      };
    }

    return {
      exitCode: 0,
      stdout: `${rendered}\n`,
      stderr: "",
      manifest
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: `${error instanceof Error ? error.message : "Dry-run failed."}\n`,
      manifest: null
    };
  }
}
