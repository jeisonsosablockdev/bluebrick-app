---
type: Feature Spec
title: Feature Shared Nix Toolchain Policy
description: Feature Shared Nix Toolchain Policy - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-shared-nix-toolchain-policy.md
---

# Feature: Shared Nix Environment + Toolchain Maintenance Policy (BRI-43)

## Date
2026-04-05

## Summary
Introduce a reproducible developer environment via Nix and define an explicit maintenance policy for toolchain updates to reduce environment drift and avoid uncontrolled upgrades.

## Changes
- Added root `flake.nix` with default `devShell` for core project tooling.
- Added `knowledge/toolchain-policy.md` as maintenance governance for pinned tooling.
- Added usage guidance in `README.md` for entering Nix shell and running validation.

## Why
- Improves onboarding consistency across developers.
- Reduces "works on my machine" errors.
- Makes update decisions auditable and risk-aware.

## Out of scope
- CI migration to Nix in this iteration.
- Product-code changes in `/app`, `/lib`, or `/programs`.

## Validation
- `npm run validate`
