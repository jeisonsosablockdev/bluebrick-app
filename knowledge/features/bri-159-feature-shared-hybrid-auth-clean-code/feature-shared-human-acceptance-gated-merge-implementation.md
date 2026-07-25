---
type: Feature Spec
title: Feature Shared Human Acceptance Gated Merge Implementation
description: Feature Shared Human Acceptance Gated Merge Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-human-acceptance-gated-merge-implementation.md
---

# Human Acceptance Gated Merge Implementation

## Decision Summary
Make the final merge to `develop` an acceptance-gated step. The agent may complete implementation, run validations, open or prepare the final PR, and report evidence, but it must not merge to `develop` until the user confirms manual tests and gives explicit approval.

## Documentation Slice Gate
For non-trivial multi-slice work, the first slice remains the spec/documentation slice. That slice must use the local skill:

`/Users/jaymusicmachine/.codex/skills/explain-like-socrates/SKILL.md`

The purpose is to explain the intended work conversationally, surface assumptions, and allow redirection before delivery slices open.

## Slice Plan
| Slice | Responsibility | Branch | Clean-Code Design Contract | Validation |
| --- | --- | --- | --- | --- |
| S01 | Governance docs and feature artifacts | `feature/shared-human-acceptance-gated-merge` | Keep policy text canonical, avoid duplicated contradictory rules, and name the human gate consistently. | `npm run validate:workflow`, `npm run validate:docs-governance` |
| S02 | Agent and helper-script contract | `feature/shared-human-acceptance-gated-merge` | Keep prompts narrow, make blockers explicit, and avoid adding ad hoc merge behavior. | `npm run validate:workflow` |
| S03 | Drift and PR governance tests | `feature/shared-human-acceptance-gated-merge` | Tests check policy contracts by stable phrases instead of brittle formatting. | `npm run validate:knowledge`, `npm run validate:workflow` |

## Required Changes
- Add `Human Acceptance` to the PR metadata source of truth and PR template.
- Require `Status: approved` in the final `develop` PR body before the GitHub governance check passes.
- Update `AGENTS.md`, `.codex/agents/planner.toml`, `.codex/agents/docs.toml`, `.codex/agents/reviewer.toml`, and docs policy summaries.
- Update PR readiness/opening helpers so the gate is visible before PR creation.
- Update governance drift checks to catch missing Socratic documentation and acceptance gates.
- Update guides and Linear slice template so new plans include the stop-before-merge behavior.

## Test Plan First
- `npm run validate:workflow`
- `npm run validate:knowledge`
- `npm run validate:docs-governance`
- `bash ./scripts/ci/check-required-docs.sh`
- `npm run knowledge:drift`
- `npm run validate`

## Completion Gate
- Documentation/spec slice requires `explain-like-socrates`.
- Final merge to `develop` is blocked until user manual testing is approved.
- PR body includes Human Acceptance.
- Reviewer treats missing human acceptance as blocking.
- Drift report passes after the change.

## Linear Sync
Linear should record the parent issue, initiative branch, documentation branch/spec slice, delivery slices, PRs, validation evidence, manual test approval, and final commit. Linear is traceability, not a technical merge target.
