---
type: Feature Spec
title: Feature Shared Agents Orchestration Enforcement BRI- 157
description: Feature Shared Agents Orchestration Enforcement BRI- 157 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-agents-orchestration-enforcement-bri-157.md
---

# Feature: Agents Orchestration Enforcement

Last Updated: 2026-05-18 UTC
Status: in-progress
Owner: shared workflow
Linear Issue: `BRI-157`
Mother Branch: `fix/shared-agents-orchestration-enforcement-bri-157`

## Summary

This traceability note exists as a bridge while the repo still enforces `knowledge/features/*.md` for qualifying `fix/*` work.

The governing planning artifacts for this initiative are:

- `knowledge/fixes/fix-agents-orchestation.md`
- `knowledge/fixes/fix-agents-orchestation-implementation.md`

Until slice `s03` lands, this file keeps the current docs governance gate satisfied without replacing the canonical fix artifacts.

## Scope

- harden repo workflow governance
- move from declarative rules to enforceable contracts
- align Linear, branching, artifacts, slices, and review gates
- add implementation slices incrementally against the mother branch

## Slice Traceability

### `s01` documentation

- formalized artifact-first planning in canonical governance docs
- introduced dual artifact planning for features and fixes
- documented documentation-slice-first for multi-slice work
- aligned the Linear planning guide and template

### `s02` linear and branch enforcement

- updates branch-planning helpers to generate the new artifact-aware parent issue structure
- requires `S01` as the first slice in the generator
- updates `git-start.sh` guidance toward documentation-slice-first and artifact-first startup

## Validation

- `npm run validate:docs-governance`
- `npm run test -- tests/lib/linear-plan-core.test.ts tests/lib/git-workflow-scripts.test.ts`
- `npm run validate`

## Notes

- this file is transitional traceability for the current repo gate
- the long-term enforcement target is the fix artifact pair under `knowledge/fixes/`
