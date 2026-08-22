---
type: Feature Spec
title: Feature Next.js AI Agents and DevTools MCP Integration
description: Integration of Next.js 16+ AI Coding Agents architecture, next-devtools-mcp live runtime server, and official Vercel skills in brids
tags: [features, agents, mcp, nextjs, tooling]
timestamp: 2026-08-22T12:34:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-nextjs-ai-agents-integration.md
---

# Feature Note: Next.js AI Agents & DevTools MCP Integration

## Status
- Status: `approved`
- Mother/integration branch: `feature/jaymusicmachine-nextjs-ai-agents-integration`
- Target: Next.js 16+ App Router Developer & AI Agent Experience

## Summary
Integrate the official Next.js 16+ AI Coding Agent guidelines, runtime MCP tooling (`next-devtools-mcp`), and structured workflow skills (`next-dev-loop`, `next-cache-components-optimizer`) into the `brids` agentic system and monorepo governance.

## Problem Statement
When developing App Router components and Next.js features, AI agents often face two distinct issues:
1. **Outdated Training Data vs. Real APIs**: LLMs frequently hallucinate outdated conventions (e.g. legacy caching APIs, pages router assumptions, or obsolete server action patterns) rather than referencing the exact version-matched documentation shipped inside `node_modules/next/dist/docs/`.
2. **Blind Spot to Dev Server & Runtime State**: Agents cannot inspect real-time compilation warnings, hydration mismatches, or Server Action bindings without running expensive full builds.

## Solution Architecture
1. **Bundled Documentation Lookup**: Mandate in `AGENTS.md` and `.agents/agents/frontend.yaml` that the `frontend` subagent reads version-accurate documentation directly from `node_modules/next/dist/docs/01-app/`.
2. **Real-time Runtime Visibility (`next-devtools-mcp`)**: Add `.mcp.json` configuring `next-devtools-mcp` to connect to `/_next/mcp` on `pnpm dev:turbo`, exposing `compile_route`, `get_compilation_issues`, `get_errors`, and `get_routes`.
3. **Structured Vercel Skills**: Install and lock `next-dev-loop` and `next-cache-components-optimizer` in `.agents/skills/` and `.agents/skills-lock.json`.
4. **Idempotent TDD Verification**: Enforce all agent policies, frontmatters, and MCP configs with `tests/lib/nextjs-ai-agents-workflow.test.ts`.

## Scope
- `.mcp.json`
- `.agents/skills/next-dev-loop/SKILL.md`
- `.agents/skills/next-cache-components-optimizer/SKILL.md`
- `.agents/skills-lock.json`
- `.agents/agents/frontend.yaml`
- `.agents/workflows/frontend-cycle.md`
- `AGENTS.md`
- `knowledge/guides/next-devtools-mcp.md`
- `tests/lib/nextjs-ai-agents-workflow.test.ts`
- `package.json`

## Non-Goals
- No changes to on-chain Solana programs or Metaplex Core Candy Machine logic.
- No modifications to database schemas or migrations.
- No changes to user-facing UI styling or application logic.

## Success Criteria
- `pnpm validate:workflow` and `pnpm validate:docs-governance` pass without warnings.
- `tests/lib/nextjs-ai-agents-workflow.test.ts` passes deterministically and idempotently.
- `next-devtools-mcp` is ready for consumption by Antigravity subagents during `pnpm dev:turbo`.
