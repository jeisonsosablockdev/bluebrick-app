---
type: Feature Spec
title: Feature Shared Pr Governance Flow Flexibility
description: Feature Shared Pr Governance Flow Flexibility - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/other/feature-shared-pr-governance-flow-flexibility.md
---

# Feature Note: shared-pr-governance-flow-flexibility

## Summary
Reduce PR governance friction by making story-branch parsing more flexible, hardening docs governance comparisons, and keeping `pr:open` lightweight while CI remains the source of truth for full validation.

## What Changed
- Added shared governance shell helpers in:
  - `scripts/ci/pr-governance-lib.sh`
- Hardened docs governance in:
  - `scripts/ci/check-required-docs.sh`
  - accepts both `epic-011-story-02-*` and `epic-011-story-011-02-*`
  - includes uncommitted and untracked working-tree changes in local preflight
  - normalizes markdown table cells before comparing Story Index status
- Made local PR preflight configurable in:
  - `scripts/ci/pr-ready.sh`
  - `scripts/ci/pr-open.sh`
  - `pr:ready` keeps `full` validation by default
  - `pr:open` now defaults to `governance-only`
- Reduced heavy CI duplication in:
  - `.github/workflows/pr-governance-develop.yml`
  - full validate/docs jobs run only on `opened`, `synchronize`, `reopened`, and `ready_for_review`
  - label/body edits still re-run policy checks without re-running the heavy jobs
- Added regression coverage in:
  - `tests/lib/pr-governance-shell.test.ts`

## Why
- Avoid false negatives when the branch name includes the full story identifier.
- Prevent local docs preflight from disagreeing with what the author has already edited but not committed yet.
- Stop markdown formatting differences like `` `approved` `` vs `approved` from breaking the docs gate.
- Keep PR opening fast while preserving full CI validation in a clean environment.

## Expected Impact
- Fewer false governance failures while opening PRs.
- Lower local wait time for `pr:open`.
- Less duplicated heavy CI execution after labels/body edits.
