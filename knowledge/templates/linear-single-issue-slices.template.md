---
type: Template
title: Linear Single Issue Slice Planning Template
description: Template for single-issue slice planning — objective, scope, artifacts, Linear initiative branch, spec slice with Socratic gate, slice plan table, execution order, risks, test plan first, completion gate
tags: [template, linear, slice, planning, governance, socratic]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/templates/linear-single-issue-slices.template.md
---

# Objective
{{GOAL}}

# Scope
{{SCOPE_ITEMS}}

# Non-goals
{{NON_GOAL_ITEMS}}

# Linear
- Issue: `{{ISSUE_ID}}`
- Owner: `{{OWNER}}`

# Artifact Pair
- Problem artifact: `{{PROBLEM_ARTIFACT}}`
- Solution artifact: `{{SOLUTION_ARTIFACT}}`

# Linear Initiative Branch
`{{INITIATIVE_BRANCH}}`

# Spec Slice
- Branch: `{{DOCUMENTATION_SLICE_BRANCH}}`
- Objective: `{{DOCUMENTATION_SLICE_OBJECTIVE}}`
- Socratic documentation gate: use `explain-like-socrates` before finalizing artifacts, assumptions, and delivery slices.

# Slice Plan
| Slice | Status | Branch | Objective | Scope tecnico | Validation | PR |
| --- | --- | --- | --- | --- | --- | --- |
{{SLICE_ROWS}}

# Order of Execution
{{EXECUTION_ORDER}}

# Risks
{{RISK_ITEMS}}

# Test Plan First
{{TEST_PLAN_FIRST_ITEMS}}

# Completion Gate
{{COMPLETION_GATE_ITEMS}}
