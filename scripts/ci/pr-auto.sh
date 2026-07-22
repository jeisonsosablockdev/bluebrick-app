#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BRANCH="$(git branch --show-current)"
TITLE="$(git log -1 --format=%s)"

echo "== Executing Automated Post-Acceptance PR Workflow =="

# 1. Generate compliant PR body
bash "${SCRIPT_DIR}/generate-pr-body.sh" "${ROOT_DIR}/pr-body.md"

# 2. Deduce Labels
SCOPE_LABEL="scope:shared"
TYPE_LABEL="type:refactor"
RISK_LABEL="risk:low"

if [[ "${BRANCH}" == *"solana"* || "${BRANCH}" == *"program"* ]]; then
  SCOPE_LABEL="scope:program"
elif [[ "${BRANCH}" == *"app"* || "${BRANCH}" == *"frontend"* ]]; then
  SCOPE_LABEL="scope:app"
elif [[ "${BRANCH}" == *"nft"* ]]; then
  SCOPE_LABEL="scope:nft"
fi

if [[ "${BRANCH}" == *"feature"* ]]; then
  TYPE_LABEL="type:feature"
elif [[ "${BRANCH}" == *"fix"* || "${BRANCH}" == *"bugfix"* ]]; then
  TYPE_LABEL="type:fix"
elif [[ "${BRANCH}" == *"security"* ]]; then
  TYPE_LABEL="type:security"
fi

echo "Deducted Labels -> Scope: ${SCOPE_LABEL} | Type: ${TYPE_LABEL} | Risk: ${RISK_LABEL}"

# 3. Open / Update PR automatically via pr-open.sh
bash "${SCRIPT_DIR}/pr-open.sh" \
  --title "${TITLE}" \
  --body-file "${ROOT_DIR}/pr-body.md" \
  --scope "${SCOPE_LABEL}" \
  --type "${TYPE_LABEL}" \
  --risk "${RISK_LABEL}" \
  --validate-mode full

echo "✅ Automated Post-Acceptance PR Workflow completed successfully!"
