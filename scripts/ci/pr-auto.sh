#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
PR_RUN_FILE="${ROOT_DIR}/.agents/pr_last_run.json"

BRANCH="$(git branch --show-current 2>/dev/null || echo "refactor/jeisonsosa-BRI-186-monorepo-fdd-architecture")"
ISSUE_ID="$(node -e "try{const p=JSON.parse(require('fs').readFileSync('${ROOT_DIR}/.agents/active_task_state.json','utf8'));process.stdout.write(p.task_id||'');}catch(e){}" 2>/dev/null || echo "")"
if [[ -z "${ISSUE_ID}" ]]; then
  ISSUE_ID="$(echo "${BRANCH}" | grep -oE 'BRI-[0-9]+' | head -1 || echo "BRI-186")"
fi

DEFAULT_TITLE="refactor(monorepo): Monorepo Workspaces & 4-Layer Feature-Driven Design (FDD) Architecture (${ISSUE_ID})"
TITLE="${PR_TITLE:-${DEFAULT_TITLE}}"
CURRENT_SHA="$(git rev-parse HEAD)"

echo "== Executing Automated Post-Acceptance PR Workflow =="

# Single-Trigger Idempotency Guard check
if [[ -f "${PR_RUN_FILE}" && "${FORCE_PR_UPDATE:-0}" != "1" ]]; then
  LAST_SHA="$(node -e "try{const p=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(p.last_sha||'');}catch(e){}" "${PR_RUN_FILE}")"
  if [[ "${LAST_SHA}" == "${CURRENT_SHA}" ]]; then
    echo "ℹ️ PR auto workflow already executed for current commit SHA (${CURRENT_SHA:0:7}). Skipping duplicate run."
    exit 0
  fi
fi

# 1. Generate compliant PR body
BODY_FILE="${ROOT_DIR}/.github/pr-body.md"
bash "${SCRIPT_DIR}/generate-pr-body.sh" "${BODY_FILE}"

# 2. Deduce Labels
SCOPE_LABEL="${PR_SCOPE:-scope:app}"
TYPE_LABEL="${PR_TYPE:-type:refactor}"
RISK_LABEL="${PR_RISK:-risk:low}"

if [[ "${BRANCH}" == *"solana"* || "${BRANCH}" == *"program"* ]]; then
  SCOPE_LABEL="scope:program"
elif [[ "${BRANCH}" == *"app"* || "${BRANCH}" == *"frontend"* || "${BRANCH}" == *"monorepo"* ]]; then
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
  --body-file "${BODY_FILE}" \
  --scope "${SCOPE_LABEL}" \
  --type "${TYPE_LABEL}" \
  --risk "${RISK_LABEL}" \
  --draft 0 \
  --validate-mode full

# 4. Clean up ephemeral PR body post-publish
rm -f "${BODY_FILE}"

# Record single-trigger completion
cat <<EOF > "${PR_RUN_FILE}"
{
  "last_sha": "${CURRENT_SHA}",
  "branch": "${BRANCH}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Automated Post-Acceptance PR Workflow completed successfully!"
