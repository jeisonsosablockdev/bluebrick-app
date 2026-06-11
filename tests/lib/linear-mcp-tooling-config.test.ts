import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Linear MCP tooling config", () => {
  it("registers the Linear MCP bridge for Codex project scope", () => {
    const config = JSON.parse(readRepoFile(".mcp.json")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
    };

    expect(config.mcpServers?.linear).toEqual({
      command: "npx",
      args: ["tsx", "./scripts/linear-mcp-server.ts"]
    });
    expect(config.mcpServers?.linear?.env).toBeUndefined();
  });

  it("registers the Linear MCP bridge for Cursor workspace scope", () => {
    const config = JSON.parse(readRepoFile(".cursor/mcp.json")) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
    };

    expect(config.mcpServers?.linear).toEqual({
      command: "npx",
      args: ["tsx", "./scripts/linear-mcp-server.ts"]
    });
  });

  it("documents the bridge usage and required environment", () => {
    const readme = readRepoFile("README.md");
    const guide = readRepoFile("docs/guides/linear-mcp-bridge.md");
    const server = readRepoFile("scripts/linear-mcp-server.ts");

    expect(readme).toContain("Linear MCP Bridge");
    expect(readme).toContain("LINEAR_API_KEY");
    expect(guide).toContain("linear_get_issue");
    expect(guide).toContain("linear_create_issue");
    expect(guide).toContain("linear_update_issue");
    expect(guide).toContain("npm run mcp:linear");
    expect(server).toContain("linear_create_issue");
    expect(server).toContain("linear_update_issue");
    expect(server).toContain("linear_list_teams");
  });
});
