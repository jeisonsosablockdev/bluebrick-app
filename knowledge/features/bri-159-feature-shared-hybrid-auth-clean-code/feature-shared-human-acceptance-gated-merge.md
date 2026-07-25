---
type: Feature Spec
title: Feature Shared Human Acceptance Gated Merge
description: Feature Shared Human Acceptance Gated Merge - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-human-acceptance-gated-merge.md
---

# Human Acceptance Gated Merge

## Problem
The canonical Codex flow can move from implementation to a final merge proposal into `develop` without a mandatory pause for user-run manual tests. That creates a gap between automated validation and the user's own acceptance of the result.

The flow also describes Socratic planning in generic terms, but the documentation slice does not explicitly require the local `explain-like-socrates` skill. That makes the planning conversation easier to skip or reinterpret.

## Why It Matters
- `develop` is the consolidation branch, so merging there should represent validated and accepted work.
- Automated checks do not replace the user's manual verification of product behavior.
- The documentation/spec slice is the correct place to clarify intent, redirect scope, and agree on slices before implementation begins.
- Merge traceability needs to show not only what passed in CI, but also who accepted the final result and when.

## Expected Outcome
- The documentation/spec slice always uses `explain-like-socrates` before finalizing artifacts and delivery slices.
- Delivery slices continue to target the Linear initiative branch.
- The final PR into `develop` must stop before merge until the user explicitly confirms manual testing and acceptance.
- The PR body and reviewer gate include `Human Acceptance`, and GitHub governance stays red until it records `Status: approved`.
- Linear sync records traceability, but technical merges remain slice -> initiative branch and initiative branch -> `develop`.

## Current Gaps
- PR metadata requires Issue, RFC, Riesgos, Rollback Plan, and Prueba Devnet, but not Human Acceptance.
- `planner`, `docs`, and `reviewer` do not explicitly block the final `develop` merge on user approval.
- Drift checks do not verify the Socratic documentation gate or human acceptance gate.

## Non-Goals
- No change to product behavior.
- No change to CI runtime semantics beyond PR metadata requirements and governance checks.
- No automatic creation of Linear issues or PRs.
- No auto-merge mechanism.

## Open Questions
- The exact human test evidence can vary by task. The required invariant is explicit user approval after manual verification, recorded in the PR body or final handoff.
