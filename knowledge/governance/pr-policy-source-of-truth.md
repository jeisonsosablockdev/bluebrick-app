---
type: Policy
title: PR Policy Source of Truth
description: Machine-readable PR governance rules — labels, required sections, thresholds, patterns, and canonical commands
tags: [governance, pr, policy, labels, validation, ci, human-acceptance]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/governance/pr-policy-source-of-truth.json
---

# PR Policy Source of Truth

This document describes the machine-readable PR policy at [`pr-policy-source-of-truth.json`](pr-policy-source-of-truth.json).

## Policy Summary

### Labels
- **Scope**: `scope:app`, `scope:program`, `scope:shared`, `scope:docs`, `scope:infra`, `scope:nft`
- **Type**: `type:feature`, `type:fix`, `type:security`, `type:refactor`, `type:chore`, `type:docs`
- **Risk**: `risk:low`, `risk:medium`, `risk:high`
- **Exemptions**: `size-exempt`, `branch-age-exempt`

### Required PR Sections
1. Issue reference
2. RFC reference
3. Riesgos (Risk Analysis)
4. Rollback Plan
5. Prueba Devnet (Devnet Proof)
6. Human Acceptance

### Thresholds
- Max Added Lines: 400
- Max Branch Age: 3 days

### Patterns
- Feature Flag: `feature[- ]flag`
- Human Acceptance Approved: `## Human Acceptance` with `Status: approved`
- Commit Message: Conventional commits with scope `(app|program|shared|docs|infra|security|nft)`

### Canonical Commands
- Preflight: `npm run pr:ready`
- Metadata Lint: `npm run pr:metadata`
- Open PR: `npm run pr:open`

## Usage

This JSON is consumed by CI validation scripts:
- `scripts/ci/check-required-docs.sh`
- `scripts/ci/validate-doc-governance.sh`
- `scripts/pr-gates.ts`

Do not edit the JSON directly without updating the validation scripts.