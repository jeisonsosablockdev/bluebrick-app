---
type: Fix Spec
title: Fix Linear Initiative Branch Workflow
description: Fix Linear Initiative Branch Workflow - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-linear-initiative-branch-workflow.md
---

# Fix: Linear Initiative Branch Workflow

Last Updated: 2026-05-30 UTC
Status: implemented
Owner: shared workflow
Artifact Type: problem

## Summary

The repo currently uses `integration branch` as the name for the temporary branch that receives slice PRs before the final PR to `develop`.

That wording is technically accurate, but it is not aligned with the source of truth for this workflow: the parent Linear issue and its Git branch name.

## Problem Statement

The current workflow asks contributors and agents to remember that:

- `*-integration` means the parent branch for the full Linear-tracked initiative
- slice branches target that parent branch
- the final parent branch targets `develop`

This creates avoidable ambiguity because `integration` describes a Git operation, not the Linear-owned work container.

## Why It Matters

The workflow should be hard to misuse. If Linear owns the initiative and its Git branch name, the branch naming should make that explicit.

The current wording creates three risks:

- people call the parent branch a feature branch even when the work is a fix, security hardening, or refactor
- people confuse a spec artifact with an execution slice
- scripts and docs teach `integration` while the team talks about Linear as the planning source

## Expected Outcome

The workflow should use these canonical concepts:

- Linear initiative branch: the Git branch name stored on the parent Linear issue
- Spec slice: the first slice that owns the artifact pair, slice map, and test plan
- Delivery slice: each implementation, QA, docs, or review slice after the spec slice

Branching should become:

```text
develop
  -> initiative/<issue>-<slug>
      -> <type>/<scope>-<slug>-<issue>-sNN-<slice-slug>
```

## Current Gaps

- `git-start.sh` creates `*-integration` parent branches instead of `initiative/*`.
- `task-init.sh` asks for `integration` mode instead of `initiative` mode.
- `linear-plan-core.js` generates `*-integration` branch names and Linear issue sections.
- The PR validation workflow only listens to `*-integration` target branches.
- Governance docs and summaries still use `integration branch` as the canonical term.

## Open Questions

None for this fix. The implementation should keep backward compatibility for `--mode integration` as a legacy alias, but canonical output must use `initiative`.
