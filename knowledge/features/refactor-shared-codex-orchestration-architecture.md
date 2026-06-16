# Refactor Shared Codex Orchestration Architecture

Date: 2026-05-10
Branch: `refactor/shared-codex-orchestration`

## Summary
- Replaced the monolithic root `AGENTS.md` with a routing-only entrypoint for Codex.
- Added modular agent definitions under `.codex/agents/`.
- Added orchestration workflows under `.codex/workflows/`.
- Added reusable constraint summaries under `.codex/policies/`.
- Added migration and routing rationale under `docs/guides/codex-orchestration-architecture.md`.

## Baseline Fixes Included
- Regenerated `package-lock.json` so `npm ci` works again with the current `package.json` on `develop`.
- Updated test helpers that mutate `NODE_ENV` so they remain compatible with the current Node runtime used in this repo.
- Corrected the protected NFT avatar route test harness to mock `DasClient` with a constructor-compatible class, preserving the route contract while restoring test stability.

## Verification
- `npm ci`
- `npm test`
- `npm run validate`

## Scope Notes
- Governance docs under `docs/governance/` remain the canonical source of truth.
- This refactor changes Codex orchestration structure and baseline test/install compatibility; it does not weaken PR, RFC, docs, devnet, Playwright, Synpress, responsive, or Definition of Done enforcement.
