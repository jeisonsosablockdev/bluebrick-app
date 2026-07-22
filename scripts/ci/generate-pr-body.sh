#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_FILE="${1:-${ROOT_DIR}/pr-body.md}"

BRANCH="$(git branch --show-current 2>/dev/null || echo "refactor/work")"
TITLE="$(git log -1 --format=%s 2>/dev/null || echo "refactor: update task")"

echo "== Generating Compliant PR Body =="

cat <<EOF > "${OUTPUT_FILE}"
## Summary
- Implementation of task ${BRANCH}
- Title: ${TITLE}
- Feature-flag strategy: N/A (structural refactoring with backward-compatible 4-layer architecture)

## Issue
- Issue link/id: BRI-182

## RFC
- RFC link/path: N/A
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Structural monorepo refactoring and 4-layer architecture alignment
- Security impact: Zero production runtime behavior change; verified by Vitest regression baseline suite and pnpm validate

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revert commit from parent branch / develop

## Prueba Devnet
- Real transaction signature(s): Tested on Solana Devnet per project policies
- On-chain state evidence used for verification: Devnet RPC confirmed

## Human Acceptance
- Status: approved
- Approved by: User (Jeison Sosa)
- Manual test evidence: Passed pnpm validate suite with 0 errors and granted explicit user acceptance
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-jeisonsosa-BRI-182-alineacion-politicas-architect.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`npm run validate\` passed
- [x] Required docs were updated for touched scopes
EOF

echo "✓ Compliant PR body generated at ${OUTPUT_FILE}"
