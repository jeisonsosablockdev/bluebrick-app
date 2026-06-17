---
type: Feature Spec
title: Fix Shared Pr Policy Lite And Log Noise
description: Fix Shared Pr Policy Lite And Log Noise - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-shared-pr-policy-lite-and-log-noise.md
---

# Feature Note: shared-pr-policy-lite-and-log-noise

## Summary
Make the PR policy surface clearer on newly opened pull requests and suppress noisy local-only paths from docs-governance logs so CI triage stays cheap.

## What Changed
- Updated `.github/workflows/pr-governance-develop.yml` so `PR Policy`:
  - still appears on `opened`
  - returns a lightweight success message on `opened`
  - keeps real metadata enforcement for `edited`, `synchronize`, `reopened`, and `ready_for_review`
- Updated `scripts/ci/check-required-docs.sh` to:
  - suppress known local-noise paths from local preflight output
  - keep actual product/governance-relevant changes visible
  - summarize long changed-file lists instead of dumping everything
- Added regression coverage in:
  - `tests/lib/pr-governance-workflow.test.ts`
  - `tests/lib/pr-governance-shell.test.ts`
- Updated operator guidance in:
  - `docs/guides/gitflow-pr-structure.md`

## Why
- A `skipped` PR policy check on `opened` was technically safe but ambiguous enough to force extra human verification.
- The docs-governance preflight was printing huge local cache/noise lists, which inflated CI/log analysis cost without improving signal.

## Expected Impact
- `PR Policy` is now explicit and green on PR open, while still avoiding premature metadata enforcement.
- Docs-governance logs keep the meaningful files and hide operational garbage.
- Less CI noise means less manual log-reading and less downstream token consumption when investigating PR state.
