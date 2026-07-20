---
type: Feature Spec
title: Fix Admin Shell Cleancode BRI- 123
description: Fix Admin Shell Cleancode BRI- 123 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/fix-admin-shell-cleancode-bri-123.md
---

# BRI-123 - Clean-code refactor for admin shell and collections detail components

## Summary
- Extracted admin navigation into a single reusable renderer and localized configuration so `AdminShell` no longer duplicates desktop/mobile link markup.
- Replaced the oversized collections page component with a small workspace composer backed by dedicated state-panel and card-grid components.
- Reduced `AdminCollectionDetailShell` to a page-level composer by moving hero/metadata and section rendering into focused components.

## Why
- The previous components mixed configuration, page-state branching, repeated navigation rendering, and large visual sections in single files.
- This refactor targets clearer single responsibility, smaller render units, and less repetition while preserving the existing UI contract.

## Validation
- `npx vitest run tests/components/admin-shell-navigation.test.ts tests/app/admin-collections-page.test.ts tests/app/admin-collection-detail-page.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`
- `npm run e2e:playwright`
