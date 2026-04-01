#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-develop}"

echo "== PR Readiness Preflight =="
echo "Base branch: ${BASE_REF}"

if ! git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
  echo "Fetching origin/${BASE_REF}..."
  git fetch origin "${BASE_REF}" --depth=1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  echo "❌ Unable to detect current branch."
  exit 1
fi

if [[ "${CURRENT_BRANCH}" == "${BASE_REF}" ]]; then
  echo "❌ You are on '${BASE_REF}'. Create a feature/fix branch first."
  exit 1
fi

echo
echo "1) Running validate gate (lint + typecheck + docs governance)..."
npm run validate

echo
echo "2) Checking commit convention for branch commits..."
MERGE_BASE="$(git merge-base "origin/${BASE_REF}" HEAD)"
COMMITS="$(git log --format='%H%x09%s' "${MERGE_BASE}..HEAD")"

if [[ -z "${COMMITS}" ]]; then
  echo "❌ No branch commits detected relative to origin/${BASE_REF}."
  exit 1
fi

CONVENTIONAL_REGEX='^(feat|fix|docs|chore|refactor|security|nft|test|ci)\((app|program|shared|docs|infra|security|nft)\): .+'
INVALID=0
while IFS=$'\t' read -r sha subject; do
  if [[ ! "${subject}" =~ ${CONVENTIONAL_REGEX} ]]; then
    echo "❌ Invalid commit message: ${sha:0:7} -> ${subject}"
    INVALID=1
  fi
done <<< "${COMMITS}"

if [[ "${INVALID}" -ne 0 ]]; then
  echo "Commit convention check failed."
  exit 1
fi
echo "✅ Commit convention check passed."

echo
echo "3) Checking PR-size discipline..."
ADDITIONS="$(git diff --numstat "${MERGE_BASE}..HEAD" | awk '{a+=$1} END {print a+0}')"
echo "Added lines vs origin/${BASE_REF}: ${ADDITIONS}"
if (( ADDITIONS > 400 )); then
  if [[ "${SIZE_EXEMPT:-0}" != "1" ]]; then
    echo "❌ Added lines exceed 400. Split PR or run with SIZE_EXEMPT=1 and document feature-flag strategy in PR."
    exit 1
  fi
  echo "⚠️ SIZE_EXEMPT=1 set. Remember label 'size-exempt' and PR justification."
else
  echo "✅ PR-size check passed."
fi

echo
echo "4) Checking branch-age discipline..."
FIRST_COMMIT_EPOCH="$(git log --reverse --format='%ct' "${MERGE_BASE}..HEAD" | head -n1)"
NOW_EPOCH="$(date +%s)"
AGE_DAYS="$(awk -v now="${NOW_EPOCH}" -v first="${FIRST_COMMIT_EPOCH}" 'BEGIN {printf "%.2f", (now-first)/86400}')"
echo "Branch age (days): ${AGE_DAYS}"
TOO_OLD="$(awk -v age="${AGE_DAYS}" 'BEGIN {print (age>3) ? "1" : "0"}')"
if [[ "${TOO_OLD}" == "1" ]]; then
  if [[ "${BRANCH_AGE_EXEMPT:-0}" != "1" ]]; then
    echo "❌ Branch age exceeds 3 days. Rebase/split work or use BRANCH_AGE_EXEMPT=1 with explicit PR justification."
    exit 1
  fi
  echo "⚠️ BRANCH_AGE_EXEMPT=1 set. Remember label 'branch-age-exempt' and PR justification."
else
  echo "✅ Branch-age check passed."
fi

echo
echo "5) PR metadata checklist (manual before opening PR):"
echo "- Add exactly one scope label (scope:*)"
echo "- Add exactly one type label (type:*)"
echo "- Add exactly one risk label (risk:*)"
echo "- Fill PR template sections: Issue, RFC, Riesgos, Rollback Plan, Prueba Devnet"
echo "- If branch is feature/fix/nft/refactor and touches product code, update docs/features/*.md"

echo
echo "🎉 PR preflight passed. Safe to open PR against ${BASE_REF}."
