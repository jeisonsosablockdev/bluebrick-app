---
type: Feature Spec
title: Feature Czambrano BRI- 173 Branching Policy Preflight Implementation
description: Feature Czambrano BRI- 173 Branching Policy Preflight Implementation - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-czambrano-BRI-173-branching-policy-preflight-implementation.md
---

# BRI-173 - Branching Policy and Preflight Protocol Implementation Protocol

## Technical Protocol for Agents

### Linear
- Issue: `BRI-173`
- Issue type: `workflow / process architecture`
- Owner / branch handle: `czambrano`
- Team: `BRIDS App`
- Source issue: [Branching policy and preflight protocol architecture](https://linear.app/brids-app/issue/BRI-173/branching-policy-and-preflight-protocol-architecture)

### Artifact Pair
- Problem artifact: `docs/features/feature-czambrano-BRI-173-branching-policy-preflight.md`
- Solution artifact: `docs/features/feature-czambrano-BRI-173-branching-policy-preflight-implementation.md`

### Source of Truth
- Repo policy: `docs/governance/git-monorepo-policy.md`
- Planning guide: `docs/guides/linear-single-issue-slice-planning.md`
- PR structure: `docs/guides/gitflow-pr-structure.md`
- Preflight entrypoint: `scripts/ci/preflight-start.sh`
- Task bootstrap: `scripts/task-init.sh`
- Branch helper: `scripts/git-start.sh`
- Status automation: `scripts/linear-status.js` and `scripts/linear-status-core.js`
- Linear bridge: `scripts/linear-mcp-server.ts`

### Workflow Rules
- Always run preflight before creating or renaming a work branch.
- Always create or update the parent Linear issue before coding.
- Always move issue-tracked work to `In Progress` when starting.
- Always move the issue to `In Review` when the PR is ready for review.
- Always move the issue to `Done` when the work is merged and confirmed.
- Keep SPECs sequential: one slice at a time, one SPEC branch at a time.

### Parent Work Branch
`refactor/czambrano-BRI-173-branching-policy-preflight`

### SPEC Plan
- First SPEC: `SPEC/czambrano-BRI-173-workflow-baseline-audit`
- Branch pattern: `SPEC/czambrano-BRI-173-<spec-slug>`

| SPEC | Status | Branch | Objective | Scope tecnico | Validation | PR |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | planned | `SPEC/czambrano-BRI-173-workflow-baseline-audit` | Audit the existing workflow and lock the baseline for branching and preflight | branch map, issue lifecycle, preflight entrypoints, automation gaps | `npm run validate` + workflow proof | Parent work branch |
| S02 | planned | `SPEC/czambrano-BRI-173-linear-status-automation` | Normalize Linear status transitions and safe fallback behavior | In Progress, In Review, Done automation, safe skips, comments | `npm run validate` + Linear bridge proof | Parent work branch |
| S03 | planned | `SPEC/czambrano-BRI-173-branching-naming-and-slices` | Codify parent branch and SPEC naming rules with single-issue sequencing | naming conventions, slice order, parent/child rules | `npm run validate` + branch naming proof | Parent work branch |
| S04 | planned | `SPEC/czambrano-BRI-173-preflight-and-bootstrap` | Finalize preflight and task bootstrap guidance before merging the workflow docs | preflight checks, bootstrap rules, stop conditions | `npm run validate` + preflight proof | Parent work branch |

### Order of Execution
1. Run preflight on the current repo state before editing anything else.
2. Confirm the parent work branch starts from the latest `develop`.
3. Open the planning SPEC first and use it to lock the workflow architecture.
4. Create each next SPEC only after the previous SPEC merges back into the parent work branch.
5. Keep the workflow docs and the Linear issue synchronized as the source of truth.

### Test Plan First
- Capture the current branching and preflight behavior before changing any protocol text.
- Add or tighten tests for scripts and workflow helpers before changing behavior.
- Validate safe fallback behavior for status automation before closing the issue.
- Keep the branching policy and preflight checks visible in the artifact before finalizing the workflow.

### Completion Gate
- [ ] Workflow docs live in this dedicated issue only
- [ ] `npm run validate`
- [ ] Required docs updated for the workflow scope
- [ ] Parent issue links the merged PRs and final commit path
- [ ] Final PR or docs merge reflects the isolated workflow source of truth
