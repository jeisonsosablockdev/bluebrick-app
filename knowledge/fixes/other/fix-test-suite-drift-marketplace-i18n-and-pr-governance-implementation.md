---
type: Fix Spec
title: Fix Test Suite Drift Marketplace I18n And Pr Governance Implementation
description: Fix Test Suite Drift Marketplace I18n And Pr Governance Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-test-suite-drift-marketplace-i18n-and-pr-governance-implementation.md
---

# Implementation: Test suite drift in marketplace i18n mock and PR governance workflow

## Resolution

Repair the failing tests by updating the test-side contracts to match the current application and workflow behavior, while preserving existing governance and security intent.

This fix should prefer:

- correcting stale mocks,
- modernizing brittle text assertions,
- avoiding changes that weaken workflow enforcement or runtime behavior.

## Slice Plan

### Slice 1
- Update `tests/app/marketplace-page.test.ts` so the `@/lib/i18n` mock exports every symbol needed by `app/marketplace/page.tsx`, including `DEFAULT_LOCALE`.
- Update `tests/lib/pr-governance-workflow.test.ts` to assert the current workflow contract in `.github/workflows/pr-governance-develop.yml`.
- Only change workflow YAML if the test reveals an actual policy regression; do not loosen governance rules just to make the test green.

## Test-First Contract

Before implementation is complete, verify:

- `tests/app/marketplace-page.test.ts` passes,
- `tests/lib/pr-governance-workflow.test.ts` passes,
- the targeted command for both tests passes together,
- broader validation impact is reviewed before closing.

## Tooling

- `vitest` targeted runs for the affected suites
- `eslint` for touched test and workflow-related files
- `npm test` and, if feasible, `npm run validate`

## Gates

- Do not reduce workflow policy coverage.
- Do not remove governance assertions without replacing them with equivalent or stricter checks.
- Document exact commands run and any remaining unrelated failures.

## Linear Sync

If this work is linked to a Linear issue later, Linear should reflect that the repository test failures were caused by stale mocks and stale workflow assertions, not by a runtime regression in the feature work that triggered the discovery.
