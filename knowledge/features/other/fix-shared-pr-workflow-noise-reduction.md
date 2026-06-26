---
type: Feature Spec
title: Fix Shared Pr Workflow Noise Reduction
description: Fix Shared Pr Workflow Noise Reduction - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-shared-pr-workflow-noise-reduction.md
---

# Feature Note: shared-pr-workflow-noise-reduction

## Summary
Reduce GitHub PR automation noise by keeping governance checks in a conservative mode and moving release drafting to a minimum-noise merge-time path.

## What Changed
- Updated `.github/workflows/pr-governance-develop.yml` to:
  - stop listening to `labeled` and `unlabeled` PR events
  - keep heavy validation/docs checks on `opened`, `synchronize`, `reopened`, and `ready_for_review`
  - keep the PR policy job on `edited`, `synchronize`, `reopened`, and `ready_for_review`
  - rename the metadata concurrency lane to `policy-lite` to reflect the reduced-event strategy
- Updated `.github/workflows/release-drafter.yml` to:
  - run on `push` to `develop`
  - keep `workflow_dispatch`
  - stop running on `pull_request_target` events
- Added regression coverage in:
  - `tests/lib/pr-governance-workflow.test.ts`
  - `tests/lib/github-actions-node24-runtime.test.ts`
- Updated operator guidance in:
  - `knowledge/guides/gitflow-pr-structure.md`

## Why
- `pr:open` still applies labels automatically, so re-triggering governance on every label mutation adds little value and a lot of CI noise.
- `release-drafter` is useful at integration time, not on every intermediate PR event.
- Fewer workflow runs means less inspection of skipped/cancelled checks and less operator overhead.

## Expected Impact
- Fewer duplicate PR governance runs from metadata-only churn.
- Cleaner PR check surfaces with less skipped/cancelled noise.
- Release notes still refresh on merge to `develop`, which is the point where the draft actually matters.
