---
type: Feature Implementation
title: Shared Agent System Knowledge Root Implementation
scope: shared
status: in-progress
owner: jay
branch: refactor/shared-agent-system-knowledge-root
depends_on: knowledge/features/feature-shared-agent-system-knowledge-root.md
---

# Shared Agent System Knowledge Root Implementation

## Slice

Single refactor slice: migrate active project-information storage and agent governance from `/docs` to `/knowledge`.

## Clean-Code Design Contract

- Responsibility: keep documentation root resolution centralized in the existing scripts and policy files, without introducing a second abstraction layer.
- Boundary: only agent orchestration, governance scripts/tests, README documentation, and documentation files move.
- Naming/coupling risk: keep the `docs` agent role name because it is a responsibility label, but use `knowledge/*` for filesystem paths.
- Duplication/dead-code policy: remove `/docs` after migrating content; avoid keeping compatibility copies outside `/knowledge`.
- Tests: update existing governance and knowledge tests to assert the new root instead of adding parallel tests.

## Implementation Plan

1. Migrate root docs, governance, guides, RFCs, templates, images, mapbox assets, feature/fix artifacts, and knowledge inbox content into `/knowledge`.
2. Update AGENTS, `.codex`, `.opencode`, and repo scripts to make `/knowledge` canonical and runner/provider usage explicit.
3. Update tests and generated README snapshot.
4. Run targeted validation, then full validation.
5. Publish branch and open a draft PR to `develop`.

## Validation Plan

- `npm run task:init -- refactor shared agent-system-knowledge-root --no-fetch --base develop`
- `npm run validate:knowledge`
- `npm run validate:docs-governance`
- Targeted Vitest suites for knowledge, workflow, task-init, RFC, PR governance, and git workflow scripts.
- `npm run validate`

## Review Plan

Run an explicit clean-code pass over changed scripts/policies before commit. Blocking issues must be fixed; non-blocking residual risk is recorded here.

## Current Evidence

- Bootstrap initially failed because `REASONING_AGENT_TASK` was unbound; fix included in this slice.
- Latest 4 merged PRs inspected: #303, #302, #299, #298.
