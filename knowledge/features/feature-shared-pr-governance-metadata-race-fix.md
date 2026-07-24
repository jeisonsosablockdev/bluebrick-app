---
type: Feature Spec
title: Feature Shared Pr Governance Metadata Race Fix
description: Feature Shared Pr Governance Metadata Race Fix - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-pr-governance-metadata-race-fix.md
---

# Feature Note: shared-pr-governance-metadata-race-fix

## Summary
Fix the stale PR metadata race in GitHub governance checks by running policy only after metadata-bearing events, canceling superseded runs, and re-fetching the current PR state from the GitHub API.

## What Changed
- Updated `.github/workflows/pr-governance-develop.yml` to:
  - add workflow `concurrency` by PR number and event category (`full` vs `policy`)
  - keep heavy validation/docs jobs on `opened`, `synchronize`, `reopened`, and `ready_for_review`
  - skip `governance-policy` on `opened`
  - re-fetch the current PR body and labels from the live pull-request API before enforcing policy
- Added regression coverage in:
  - `tests/lib/pr-governance-workflow.test.ts`

## Why
- `pr:open` creates the PR first and applies labels immediately after.
- The old `opened` policy run could start before labels existed, causing a false failure even though the PR ended up with valid metadata moments later.
- This created extra CI noise, manual reruns, and empty “sync” commits just to force a clean `synchronize` event.

## Expected Impact
- Fewer false `PR Policy` failures on newly opened PRs.
- Less duplicated CI work across metadata-only events.
- Lower operational friction without making local `pr:open` heavy again.
