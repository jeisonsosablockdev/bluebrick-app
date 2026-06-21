---
id: feature-solana-dev-skill
title: Add solana-dev skill to .agents/skills for canonical in-repo access
status: approved
scope: tooling
source_branch: feature/shared-solana-dev-skill
created_at: 2026-06-14
updated_at: 2026-06-14
---

# Feature: Solana Dev Skill In-Repo

## Context

The project uses OpenCode with a custom agent orchestration (`.codex/agents/`, `.codex/workflows/`, `.codex/policies/`). Solana development tasks are handled by the `solana` agent which should have access to canonical Solana development guidance.

Currently the `solana-dev` skill lives only in `~/.codex/skills/solana-dev/` (global user config), making it:
- Not version-controlled with the repo
- Not available to other contributors without manual setup
- Subject to drift between environments

## Proposal

Install the `solana-dev` skill from the official Solana Foundation repository into the project's `.agents/skills/` directory using the `skills` CLI tool, so it becomes:
- Version-controlled in git
- Automatically available to all agents in the project
- Consistent across all contributor environments

Source: `https://github.com/solana-foundation/solana-dev-skill`

## Critique

**Alternative considered:** Keep using global `~/.codex/skills/` only.
- Rejected: creates onboarding friction, version drift, and CI inconsistency.

**Alternative considered:** Copy skill files manually.
- Rejected: loses upstream update capability, no integrity verification.

**Risk:** Skill updates from upstream require manual re-install.
- Mitigation: `npx skills update solana-dev` can be run periodically; skill is stable (official Solana Foundation maintained).

## Resolution

Install via `npx skills add https://github.com/solana-foundation/solana-dev-skill -y` which:
- Clones the skill repo
- Runs security assessments (Gen, Socket, Snyk)
- Copies files to `.agents/skills/solana-dev/` (project-local, versioned)
- Registers with all supported agents (OpenCode, Amp, Cline, etc.)

## Decision

Proceed with in-repo installation. Skill provides:
- Solana development playbook (wallet connection, Anchor/Pinocchio, @solana/kit)
- Testing guidance (LiteSVM, Mollusk, Surfpool)
- RPC quick lookups
- Security checklists
- MCP server integration (Solana MCP for live docs search)

## Traceability

- Branch: `feature/shared-solana-dev-skill`
- Commit: `feature(shared): add solana-dev skill from solana-foundation`
- Skill source: `solana-foundation/solana-dev-skill`
- Security: Gen=Safe, Socket=0 alerts, Snyk=Med Risk (reviewed)

## Status

Approved — implementation complete, pending validation + Human Acceptance.