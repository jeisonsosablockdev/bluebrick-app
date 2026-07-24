---
type: Document
title: Linear Single Issue Slices.Template
description: Linear Single Issue Slices.Template - migrated from knowledge/
tags: [templates]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/templates/linear-single-issue-slices.template.md
---

# Human Brief

## Objective
{{GOAL}}

## Scope
{{SCOPE_ITEMS}}

## Non-goals
{{NON_GOAL_ITEMS}}

## Acceptance Criteria
{{ACCEPTANCE_CRITERIA_ITEMS}}

## Risks
{{RISK_ITEMS}}

## Open Questions
{{OPEN_QUESTIONS_ITEMS}}

# Technical Protocol for Agents

## Linear
- Issue: `{{ISSUE_ID}}`
- Owner / branch handle: `{{OWNER}}`

## Artifact Pair
- Problem artifact: `{{PROBLEM_ARTIFACT}}`
- Solution artifact: `{{SOLUTION_ARTIFACT}}`

## Parent Work Branch
`{{FEATURE_BRANCH}}`

# Spec Slice
- Branch: `{{DOCUMENTATION_SLICE_BRANCH}}`
- Objective: `{{DOCUMENTATION_SLICE_OBJECTIVE}}`
- SPEC definitions must use numbered-list indentation: `1. **SPEC01 - <title>**`, followed by indented bullets for branch, objective, scope, and criteria. Leave two normal line breaks before the next SPEC item.

# SPEC DEVELOPMENT HISTORY
{{SPEC_HISTORY_ITEMS}}

# SPEC HISTORY
{{SPEC_HISTORY_ITEMS}}

# Slice Plan
| Slice | Status | Branch | Objective | Scope técnico | Validation | PR |
| --- | --- | --- | --- | --- | --- | --- |
{{SPEC_ROWS}}

## Order of Execution
{{EXECUTION_ORDER}}

## Test Plan First
{{TEST_PLAN_FIRST_ITEMS}}

## Completion Gate
{{COMPLETION_GATE_ITEMS}}

# SPEC MERGE
{{SPEC_MERGE_ITEMS}}
