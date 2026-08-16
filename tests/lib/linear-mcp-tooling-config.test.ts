import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Linear MCP tooling config", () => {
  it("registers the Linear MCP bridge in .mcp.json", () => {
    const config = JSON.parse(readRepoFile(".mcp.json")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
    };

    expect(config.mcpServers?.linear).toEqual({
      command: "node",
      args: ["--import", "tsx", "./scripts/linear-mcp-server.ts"]
    });
    expect(config.mcpServers?.linear?.env).toBeUndefined();
  });

  it("documents the bridge usage and required environment", () => {
    const readme = readRepoFile("README.md");
    const guide = readRepoFile("knowledge/guides/linear-mcp-bridge.md");
    const server = readRepoFile("scripts/linear-mcp-server.ts");

    expect(readme).toContain("Linear MCP Bridge");
    expect(readme).toContain("LINEAR_API_KEY");
    expect(server).toContain("linear_fetch_issue");
    expect(server).toContain("linear_update_issue");
    expect(server).toContain("linear_search_issues");
  });
});
