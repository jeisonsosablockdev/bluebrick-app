---
type: Feature Spec
title: Feature Next.js AI Agents and DevTools MCP Implementation
description: Implementation plan and technical specification for Next.js AI Agents, next-devtools-mcp, and Vercel skills integration in brids
tags: [features, agents, mcp, nextjs, tooling, implementation]
timestamp: 2026-08-22T12:34:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-nextjs-ai-agents-integration-implementation.md
---

# Implementation Plan: Next.js AI Agents & DevTools MCP Integration

## Status
- Status: `approved`
- Depends on: `knowledge/features/feature-nextjs-ai-agents-integration.md`
- Mother/integration branch: `feature/jaymusicmachine-nextjs-ai-agents-integration`

## Technical Architecture & Deliverables

### 1. Bundled Documentation Routing
- **Rule**: Agents must read `node_modules/next/dist/docs/01-app/` before implementing App Router logic to ensure full alignment with installed Next.js 16+ features.
- **Enforcement**: Documented in `AGENTS.md` and added to `reads` list in `.agents/agents/frontend.yaml`.

### 2. Runtime MCP Server (`next-devtools-mcp`)
- **Configuration**: Standardized in `.mcp.json` using `npx -y next-devtools-mcp@latest`.
- **Runtime Endpoint**: Interacts with `/_next/mcp` served by `pnpm dev:turbo`.
- **Exposed Tools**: `get_errors`, `compile_route`, `get_compilation_issues`, `get_routes`, `get_server_action_by_id`, `get_logs`.

### 3. Agent Skills & Workflows
- **`next-dev-loop`**: Implements the *Inspect $\rightarrow$ Edit $\rightarrow$ Verify* cycle directly against the live dev server.
- **`next-cache-components-optimizer`**: Standardizes the TDD instant navigation optimization loop using `<Suspense>` and `instant()` tests.
- **`skills-lock.json`**: Tracks SHA256 integrity of all installed agent skills.

### 4. Idempotent TDD Suite
- **Location**: `tests/lib/nextjs-ai-agents-workflow.test.ts`.
- **Coverage**: Validates bundled docs rules, skill frontmatters, skill lockfile entries, workflow step requirements, `.mcp.json` format, and knowledge guides.
- **CI Integration**: Included in `pnpm validate:workflow` in `package.json`.

## Verification & Rollout Plan
1. Run `pnpm vitest run tests/lib/nextjs-ai-agents-workflow.test.ts` to ensure 100% green tests.
2. Run `pnpm validate:docs-governance` to ensure documentation and governance compliance.
3. Run `pnpm validate` to execute the full repository verification pipeline.
