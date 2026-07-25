---
type: Fix Spec
title: Fix Test Suite Drift Marketplace I18n And Pr Governance
description: Fix Test Suite Drift Marketplace I18n And Pr Governance - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/other/fix-test-suite-drift-marketplace-i18n-and-pr-governance.md
---

# Fix: Test suite drift in marketplace i18n mock and PR governance workflow

## Problem

The repository currently contains failing tests that block the standard `git-save.sh` flow because `npm test` no longer passes on a clean branch.

The failures come from two independent drifts:

- `tests/app/marketplace-page.test.ts` mocks `@/lib/i18n` incompletely and no longer matches the real module contract used by `app/marketplace/page.tsx`.
- `tests/lib/pr-governance-workflow.test.ts` asserts an older textual shape of `.github/workflows/pr-governance-develop.yml` and no longer matches the current workflow source.

## Why It Matters

- Quality gates become unreliable because unrelated work gets blocked by pre-existing test failures.
- Developers are encouraged to bypass validation gates, which weakens confidence in the branch workflow.
- The PR governance workflow is a security and process control surface; fixing drift here must not accidentally loosen policy enforcement.

## Expected Outcome

- `npm test` should pass again for these affected areas.
- Marketplace page tests should reflect the actual i18n module contract.
- PR governance workflow tests should validate the current policy behavior without demanding obsolete implementation text.
- No workflow security, label policy, or validation coverage should be reduced.

## Current Gaps

- The marketplace test mock exports `localize` but not `DEFAULT_LOCALE`.
- The governance workflow test expects explicit `opened` / `!= opened` branches and a deferral message that no longer exist in the YAML.
- The test suite currently checks implementation text too rigidly in a place where policy intent matters more than exact string shape.

## Open Questions

- The fix should determine whether the governance test should assert current behavior more directly or whether the workflow itself should restore the previous textual structure.
- Any change to the governance workflow assertions must preserve the same or stricter enforcement expectations.
