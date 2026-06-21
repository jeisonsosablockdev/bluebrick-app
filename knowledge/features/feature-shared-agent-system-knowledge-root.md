---
type: Feature Spec
title: Shared Agent System Knowledge Root
scope: shared
status: in-progress
owner: jay
branch: refactor/shared-agent-system-knowledge-root
---

# Shared Agent System Knowledge Root

## Problem

The repo still treated `/docs` as the canonical documentation root in agent routing, workflow policies, validation scripts, and README guidance. That duplicated the newer `/knowledge` OKF bundle and made runner guidance look Codex/OpenAI-specific even though the team also runs OpenCode and Nemotron.

## Current Behavior To Preserve

- Agent work still starts with `planner`, scoped workflow activation, artifact-first delivery, and final reviewer/clean-code gates.
- `npm run task:init`, PR governance, RFC scaffolding, knowledge index validation, and README sync remain executable repo workflows.
- Product/runtime behavior does not change.

## Target Behavior

- `/knowledge` is the single project-information root.
- `/docs` is removed after its unique content is migrated.
- Agent routing is runner-agnostic: Codex, ChatGPT-backed runners, OpenCode, Nemotron, and future agents follow the same governance.
- Recent documentation from the latest 4 merged PRs remains represented under `/knowledge`.

## Recent PR Inventory

- PR #303 `feat(okf): implement OKF v0.1 knowledge bundle in knowledge/` supplied the current `/knowledge` structure.
- PR #302 `Feature/czambrano bri 168 UI ux fixes and improvements` updated agent policies and OpenCode skill assets.
- PR #299 `feature(shared): add solana-dev skill from solana-foundation` added `.agents/skills/solana-dev` and its feature artifact.
- PR #298 `BRI-177: Business Logic Reasoner - Self-Discover Agent` added reasoning-agent orchestration and BRI-177 feature artifacts.

## Invariants

- No runtime code path, route contract, database schema, Solana transaction flow, or UI behavior changes.
- Existing agent role names remain stable.
- Provider-specific references are allowed only when the workflow depends on that provider.
- Historical artifacts may keep legacy context, but active governance paths must point to `/knowledge`.

## Acceptance Criteria

- `AGENTS.md`, `.codex/*`, `.opencode/*`, scripts, tests, and README no longer require `/docs`.
- `scripts/task-init.sh` works without callers setting `REASONING_AGENT_TASK`.
- `npm run validate:knowledge`, `npm run validate:docs-governance`, targeted workflow tests, and `npm run validate` are clean or any blocker is documented.
- `/docs` does not exist in the final tree.
