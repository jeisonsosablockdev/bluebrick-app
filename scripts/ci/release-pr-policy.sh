#!/usr/bin/env bash
set -euo pipefail

POLICY_FILE="${POLICY_FILE:-docs/governance/pr-policy-source-of-truth.json}"
EVENT_PATH="${GITHUB_EVENT_PATH:-}"

if [[ -z "${EVENT_PATH}" || ! -f "${EVENT_PATH}" ]]; then
  echo "❌ GITHUB_EVENT_PATH is required and must point to an existing pull_request payload."
  exit 1
fi

if [[ ! -f "${POLICY_FILE}" ]]; then
  echo "❌ Policy file not found: ${POLICY_FILE}"
  exit 1
fi

BASE_REF="$(jq -r '.pull_request.base.ref // empty' "${EVENT_PATH}")"
HEAD_REF="$(jq -r '.pull_request.head.ref // empty' "${EVENT_PATH}")"
BODY_CONTENT="$(jq -r '.pull_request.body // ""' "${EVENT_PATH}" | tr '[:upper:]' '[:lower:]')"

if [[ "${BASE_REF}" != "main" ]]; then
  echo "❌ Release PR policy only applies to PRs targeting main. Base was '${BASE_REF}'."
  exit 1
fi

if [[ "${HEAD_REF}" != "develop" ]]; then
  echo "❌ Policy violation: only 'develop' may target 'main'. Head was '${HEAD_REF}'."
  exit 1
fi

REQUIRED_SECTIONS="$(node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(p.requiredPrSections.join('\n'));" "${POLICY_FILE}")"

while IFS= read -r section; do
  [[ -z "${section}" ]] && continue
  if ! grep -q "${section}" <<< "${BODY_CONTENT}"; then
    echo "❌ Missing required release PR section: ${section}"
    exit 1
  fi
done <<< "${REQUIRED_SECTIONS}"

echo "✅ Release PR policy passed for develop -> main."
