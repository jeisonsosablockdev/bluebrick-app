#!/usr/bin/env bash
set -euo pipefail

BASE_REF="develop"
BODY_FILE=""
SCOPE_LABEL=""
TYPE_LABEL=""
RISK_LABEL=""
SIZE_EXEMPT="0"

usage() {
  cat <<USAGE
Usage:
  bash ./scripts/ci/pr-metadata-lint.sh \\
    --body-file <path> \\
    --scope <scope:app|scope:program|scope:shared|scope:docs|scope:infra|scope:nft> \\
    --type <type:feature|type:fix|type:security|type:refactor|type:chore|type:docs> \\
    --risk <risk:low|risk:medium|risk:high> \\
    [--base <branch>] \\
    [--size-exempt 0|1]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --body-file)
      BODY_FILE="$2"
      shift 2
      ;;
    --scope)
      SCOPE_LABEL="$2"
      shift 2
      ;;
    --type)
      TYPE_LABEL="$2"
      shift 2
      ;;
    --risk)
      RISK_LABEL="$2"
      shift 2
      ;;
    --size-exempt)
      SIZE_EXEMPT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$BODY_FILE" || -z "$SCOPE_LABEL" || -z "$TYPE_LABEL" || -z "$RISK_LABEL" ]]; then
  echo "❌ Missing required arguments."
  usage
  exit 1
fi

if [[ ! -f "$BODY_FILE" ]]; then
  echo "❌ Body file not found: $BODY_FILE"
  exit 1
fi

if ! git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
  git fetch origin "$BASE_REF" --depth=1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "❌ Unable to detect current branch."
  exit 1
fi

if [[ "$CURRENT_BRANCH" == "$BASE_REF" ]]; then
  echo "❌ You are on '${BASE_REF}'. Create a working branch first."
  exit 1
fi

ALLOWED_SCOPE=(scope:app scope:program scope:shared scope:docs scope:infra scope:nft)
ALLOWED_TYPE=(type:feature type:fix type:security type:refactor type:chore type:docs)
ALLOWED_RISK=(risk:low risk:medium risk:high)

contains_label() {
  local wanted="$1"
  shift
  for label in "$@"; do
    if [[ "$label" == "$wanted" ]]; then
      return 0
    fi
  done
  return 1
}

if ! contains_label "$SCOPE_LABEL" "${ALLOWED_SCOPE[@]}"; then
  echo "❌ Invalid scope label: $SCOPE_LABEL"
  exit 1
fi
if ! contains_label "$TYPE_LABEL" "${ALLOWED_TYPE[@]}"; then
  echo "❌ Invalid type label: $TYPE_LABEL"
  exit 1
fi
if ! contains_label "$RISK_LABEL" "${ALLOWED_RISK[@]}"; then
  echo "❌ Invalid risk label: $RISK_LABEL"
  exit 1
fi

BODY_CONTENT="$(tr '[:upper:]' '[:lower:]' < "$BODY_FILE")"
REQUIRED_SECTIONS=("issue" "rfc" "riesgos" "rollback plan" "prueba devnet")
for section in "${REQUIRED_SECTIONS[@]}"; do
  if ! grep -q "$section" <<< "$BODY_CONTENT"; then
    echo "❌ Missing required PR section in body: $section"
    exit 1
  fi
done

MERGE_BASE="$(git merge-base "origin/${BASE_REF}" HEAD)"
ADDITIONS="$(git diff --numstat "${MERGE_BASE}..HEAD" | awk '{a+=$1} END {print a+0}')"
if (( ADDITIONS > 400 )); then
  if [[ "$SIZE_EXEMPT" != "1" ]]; then
    echo "❌ PR has ${ADDITIONS} added lines (> 400); require --size-exempt 1 and strategy."
    exit 1
  fi

  if ! grep -Eq 'feature[- ]flag' <<< "$BODY_CONTENT"; then
    echo "❌ size-exempt requires mentioning feature-flag strategy in PR body."
    exit 1
  fi
fi

echo "✅ PR metadata lint passed."
echo "Base: ${BASE_REF} | Branch: ${CURRENT_BRANCH} | Additions: ${ADDITIONS} | SizeExempt: ${SIZE_EXEMPT}"
