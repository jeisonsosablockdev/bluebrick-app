#!/usr/bin/env bash
set -euo pipefail

required_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "❌ Missing required env var: ${name}"
    exit 1
  fi
}

required_env "VERCEL_TOKEN"
required_env "VERCEL_ORG_ID"
required_env "VERCEL_PROJECT_ID"
required_env "TARGET_ALIAS"
required_env "GIT_COMMIT_REF"
required_env "GIT_COMMIT_SHA"

echo "Deploying preview for ref '${GIT_COMMIT_REF}' at sha '${GIT_COMMIT_SHA}'..."

DEPLOYMENT_URL="$(
  npx vercel@latest deploy \
    --yes \
    --token "${VERCEL_TOKEN}" \
    --scope brids1-projects \
    --meta githubCommitRef="${GIT_COMMIT_REF}" \
    --meta githubCommitSha="${GIT_COMMIT_SHA}" \
    --meta ciAliasTarget="${TARGET_ALIAS}"
)"

DEPLOYMENT_URL="$(printf '%s' "${DEPLOYMENT_URL}" | tail -n1 | tr -d '\r')"

if [[ -z "${DEPLOYMENT_URL}" ]]; then
  echo "❌ Failed to capture deployment URL."
  exit 1
fi

echo "Deployment URL: ${DEPLOYMENT_URL}"
echo "Assigning alias ${TARGET_ALIAS}..."

npx vercel@latest alias set "${DEPLOYMENT_URL}" "${TARGET_ALIAS}" \
  --token "${VERCEL_TOKEN}" \
  --scope brids1-projects

echo "Inspecting ${TARGET_ALIAS}..."
npx vercel@latest inspect "${TARGET_ALIAS}" \
  --token "${VERCEL_TOKEN}" \
  --scope brids1-projects
