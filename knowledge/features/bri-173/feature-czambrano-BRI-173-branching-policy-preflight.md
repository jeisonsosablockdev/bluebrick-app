---
type: Feature Spec
title: Feature Czambrano BRI- 173 Branching Policy Preflight
description: Feature Czambrano BRI- 173 Branching Policy Preflight - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-czambrano-BRI-173-branching-policy-preflight.md
---

# BRI-173 - Branching Policy and Preflight Protocol Architecture

## Human Brief

### Ownership
- Issue: `BRI-173`
- Developer: `czambrano`
- Team: `BRIDS App`

### Objective
Isolate the BRIDS branching policy, preflight flow, and issue-tracking automation into one dedicated source of truth so future work starts from a stable, documented protocol instead of inheriting workflow rules from product issues.

### Scope
- Parent work branch naming rules.
- SPEC branch naming rules and sequential slice behavior.
- Linear issue lifecycle automation for `In Progress`, `In Review`, and `Done`.
- Preflight sequence before any new work starts.
- Documentation handoff rules between product issues and workflow issues.

### Non-goals
- No product UI changes.
- No Marketplace or landing page implementation work.
- No code refactors unrelated to branching, preflight, or Linear automation.

### Acceptance Criteria
- The branching policy is documented in this dedicated issue only.
- The preflight protocol is documented and easy to execute before new work begins.
- The issue explains how to start work without contaminating product issues.
- The issue is the single source of truth for the workflow architecture and can be linked from other work.

### Risks
- If the protocol stays duplicated across product issues, future work will drift and create conflicting branch names.
- If preflight is skipped, new work could start on an unstable or partially cleaned tree.
- If Linear automation is not described clearly, status updates may become inconsistent.

### Open Questions
- Should `improvement` issues map to the `feature` branch family or a dedicated workflow family?
- Should preflight block all work until docs are updated, or only when branch-sensitive files change?
- Which parts of the workflow are mandatory for every issue versus only non-trivial work?
