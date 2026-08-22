/**
 * Next.js AI Agents & Governance Test Suite (TDD)
 *
 * Validates that:
 * 1. Subagents and governance policies require reading bundled docs (`node_modules/next/dist/docs/01-app/`).
 * 2. Next.js official skills (next-dev-loop, next-cache-components-optimizer) are present, well-formed, and locked.
 * 3. Frontend workflow mandates runtime verification with next-dev-loop and next-devtools-mcp.
 * 4. MCP configuration (.mcp.json) and knowledge guide are valid and idempotent.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function read(relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return readFileSync(fullPath, "utf8");
}

describe("Next.js AI Agents & Governance Workflow (TDD)", () => {
  describe("Bundled Documentation Governance", () => {
    it("mandates consulting bundled Next.js docs in AGENTS.md", () => {
      const agentsMd = read("AGENTS.md");
      expect(agentsMd).toContain("node_modules/next/dist/docs/");
      expect(agentsMd).toContain("next-devtools-mcp");
    });

    it("requires frontend subagent to consult bundled docs before implementing", () => {
      const frontendAgent = read(".agents/agents/frontend.yaml");
      expect(frontendAgent).toContain("node_modules/next/dist/docs/01-app");
      expect(frontendAgent).toContain("next-dev-loop");
    });
  });

  describe("Next.js AI Skills Integrity", () => {
    it("ensures next-dev-loop skill is installed with valid structure", () => {
      const skillPath = ".agents/skills/next-dev-loop/SKILL.md";
      expect(existsSync(path.join(repoRoot, skillPath))).toBe(true);

      const skillContent = read(skillPath);
      expect(skillContent).toMatch(/^---\s*\nname:\s*next-dev-loop/m);
      expect(skillContent).toContain("/_next/mcp");
      expect(skillContent).toContain("agent-browser");
      expect(skillContent).toContain("get_compilation_issues");
    });

    it("ensures next-cache-components-optimizer skill is installed with valid structure", () => {
      const skillPath = ".agents/skills/next-cache-components-optimizer/SKILL.md";
      expect(existsSync(path.join(repoRoot, skillPath))).toBe(true);

      const skillContent = read(skillPath);
      expect(skillContent).toMatch(/^---\s*\nname:\s*next-cache-components-optimizer/m);
      expect(skillContent).toContain("instant()");
      expect(skillContent).toContain("Suspense");
      expect(skillContent).toContain("cacheComponents");
    });

    it("registers new skills in .agents/skills-lock.json", () => {
      const lockContent = read(".agents/skills-lock.json");
      const lock = JSON.parse(lockContent);

      expect(lock.skills).toBeDefined();
      expect(lock.skills["next-dev-loop"]).toBeDefined();
      expect(lock.skills["next-dev-loop"].source).toBe("vercel/next.js");
      expect(lock.skills["next-cache-components-optimizer"]).toBeDefined();
      expect(lock.skills["next-cache-components-optimizer"].source).toBe("vercel/next.js");
    });
  });

  describe("Frontend Cycle Workflow Integration", () => {
    it("mandates next-dev-loop and live MCP checks in frontend-cycle.md", () => {
      const workflow = read(".agents/workflows/frontend-cycle.md");
      expect(workflow).toContain("next-dev-loop");
      expect(workflow).toContain("next-devtools-mcp");
      expect(workflow).toContain("compile_route");
      expect(workflow).toContain("get_errors");
    });
  });

  describe("MCP Configuration & Knowledge Guides", () => {
    it("provides valid .mcp.json with next-devtools-mcp configured", () => {
      const mcpJsonPath = ".mcp.json";
      expect(existsSync(path.join(repoRoot, mcpJsonPath))).toBe(true);

      const mcpJson = JSON.parse(read(mcpJsonPath));
      expect(mcpJson.mcpServers).toBeDefined();
      expect(mcpJson.mcpServers["next-devtools"]).toBeDefined();
      expect(mcpJson.mcpServers["next-devtools"].command).toBe("npx");
      expect(mcpJson.mcpServers["next-devtools"].args).toContain("next-devtools-mcp@latest");
    });

    it("maintains canonical next-devtools-mcp guide in knowledge/guides/", () => {
      const guidePath = "knowledge/guides/next-devtools-mcp.md";
      expect(existsSync(path.join(repoRoot, guidePath))).toBe(true);

      const guide = read(guidePath);
      expect(guide).toContain("# Next.js DevTools MCP");
      expect(guide).toContain("get_errors");
      expect(guide).toContain("compile_route");
      expect(guide).toContain("pnpm dev:turbo");
    });
  });
});
