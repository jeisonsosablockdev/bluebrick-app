import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("Mapbox MCP tooling config", () => {
  it("registers the hosted Mapbox DevKit MCP server for Codex without hardcoded tokens", () => {
    const config = readRepoFile(".codex/config.toml");

    expect(config).toContain("[mcp_servers.mapbox-devkit-mcp]");
    expect(config).toContain('url = "https://mcp-devkit.mapbox.com/mcp"');
    expect(config).not.toContain("MAPBOX_ACCESS_TOKEN");
  });

  it("registers the hosted Mapbox DevKit MCP server for Cursor without hardcoded tokens", () => {
    const config = JSON.parse(readRepoFile(".cursor/mcp.json")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
    };

    expect(config.mcpServers?.mapboxDevKit).toEqual({
      command: "npx",
      args: ["mcp-remote", "https://mcp-devkit.mapbox.com/mcp"]
    });
    expect(config.mcpServers?.mapboxDevKit?.env).toBeUndefined();
  });
});
