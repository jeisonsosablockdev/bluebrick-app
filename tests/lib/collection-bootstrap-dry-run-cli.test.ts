import { describe, expect, it } from "vitest";

import {
  getCollectionBootstrapDryRunHelpText,
  parseCollectionBootstrapDryRunArgs,
  runCollectionBootstrapDryRunCli
} from "@/lib/admin/collection-bootstrap-dry-run-cli";

describe("lib/admin/collection-bootstrap-dry-run-cli", () => {
  it("parses scoped filters and output options", () => {
    expect(
      parseCollectionBootstrapDryRunArgs([
        "--actor-pubkey",
        "Admin111",
        "--entry-id",
        "entry-1",
        "--entry-id",
        "entry-2",
        "--output-file",
        "./tmp/manifest.json",
        "--compact"
      ])
    ).toEqual({
      actorPubkey: "Admin111",
      entryIds: ["entry-1", "entry-2"],
      outputFile: "./tmp/manifest.json",
      pretty: false,
      help: false
    });
  });

  it("returns help text without executing the dry-run", async () => {
    const result = await runCollectionBootstrapDryRunCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(getCollectionBootstrapDryRunHelpText());
    expect(result.stderr).toBe("");
    expect(result.manifest).toBeNull();
  });
});
