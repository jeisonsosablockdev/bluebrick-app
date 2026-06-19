---
type: Vulnerability Report
title: Shared PR Policy Noise Reduction (BRI-153 related)
description: Fixed excessive PR governance noise from overly strict policy enforcement on small/iterative changes
tags: [security, vulnerability, pr, governance, policy, noise, bri-153]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-shared-pr-policy-lite-and-log-noise.md
---

# Shared PR Policy Noise

## Summary
Fixed excessive PR governance noise from overly strict policy enforcement that was blocking small/iterative changes with unnecessary requirements.

## Vulnerability Details
- **Type**: Operational security / Governance misconfiguration
- **Component**: PR policy enforcement (`scripts/ci/validate-doc-governance.sh`, `pr-policy-source-of-truth.json`)
- **Impact**: Legitimate small changes blocked by heavyweight documentation requirements
- **Severity**: Medium (operational friction)

## Root Cause
The PR policy enforcement was applying full governance requirements (RFC, risk analysis, rollback plan, devnet proof, human acceptance) to ALL changes touching product code, including:
- Single-line typo fixes
- Minor UI copy changes
- Configuration updates
- Dependency version bumps

This created friction where developers had to create full documentation artifacts for trivial changes.

## Fix Applied
**Branch**: `fix-shared-pr-policy-lite-and-log-noise`

### Changes
1. **Introduced "lite" policy for small changes** — Changes under threshold skip heavyweight requirements
2. **Threshold-based gating**:
   - `< 50 lines changed` + single file: Lite policy (description + issue ref only)
   - `50-200 lines`: Standard policy (adds risk analysis)
   - `> 200 lines`: Full policy (all sections required)
3. **Reduced log noise** — CI output filtered for relevant failures only
3. **Updated `pr-policy-source-of-truth.json`** with size thresholds

### Policy Tiers
| Tier | Lines Changed | Files | Required Sections |
| --- | --- | --- | --- |
| Lite | < 50 | 1 | Description, Issue Ref |
| Standard | 50-200 | ≤ 5 | + Risk Analysis, Rollback Plan |
| Full | > 200 | any | + Devnet Proof, Human Acceptance, RFC |

### Code Changes
- `scripts/ci/validate-doc-governance.sh`: Added tier detection
- `scripts/ci/pr-metadata-lint.sh`: Reduced log verbosity
- `docs/governance/pr-policy-source-of-truth.json`: Added size thresholds

## Verification
- Small changes (typos, config) pass with minimal requirements
- Large changes still require full governance
- CI logs cleaner, actionable failures highlighted
- No regression in security posture for significant changes

## Related
- [Git Monorepo Policy](../governance/git-monorepo-policy.md)
- [PR Policy Source of Truth](../governance/pr-policy-source-of-truth.md)
- [Documentation Policy](../governance/documentation-policy.md)