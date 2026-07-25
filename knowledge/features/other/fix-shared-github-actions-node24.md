---
type: Feature Spec
title: Fix Shared Github Actions Node24
description: Fix Shared Github Actions Node24 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/other/fix-shared-github-actions-node24.md
---

# Feature Note: fix-shared-github-actions-node24

## Summary
Upgrade the repository workflows to Node 24-compatible GitHub Action majors so CI stops emitting Node 20 deprecation warnings without relying on temporary force flags.

## What Changed
- Updated `.github/workflows/pr-governance-develop.yml` to use:
  - `actions/checkout@v6`
  - `actions/setup-node@v6`
  - `actions/github-script@v8`
- Updated `.github/workflows/release-drafter.yml` to use:
  - `release-drafter/release-drafter@v7`
- Added regression coverage in:
  - `tests/lib/github-actions-node24-runtime.test.ts`

## Why
- GitHub runners begin defaulting JavaScript actions to Node 24 on June 2, 2026.
- The prior workflow majors still declared Node 20 runtimes and emitted deprecation warnings.
- Force flags such as `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` are only a transition aid and can still leave warning noise behind, so the clean fix is to move to Node 24-native action majors.

## Expected Impact
- PR governance workflows stop reporting Node 20 deprecation warnings.
- Release drafter also runs on a Node 24-native action major.
- Future workflow edits will fail tests if someone reintroduces the deprecated majors or the force-flag workaround.
