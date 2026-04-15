#!/usr/bin/env bash
set -euo pipefail

BASE_REF="develop"
TITLE=""
BODY_FILE=""
SCOPE_LABEL=""
TYPE_LABEL=""
RISK_LABEL=""
SIZE_EXEMPT=""
DRAFT="1"

usage() {
  cat <<USAGE
Usage:
  bash ./scripts/ci/pr-open.sh \\
    --title <pr-title> \\
    --body-file <path> \\
    --scope <scope:app|scope:program|scope:shared|scope:docs|scope:infra|scope:nft> \\
    --type <type:feature|type:fix|type:security|type:refactor|type:chore|type:docs> \\
    --risk <risk:low|risk:medium|risk:high> \\
    [--base <branch>] \\
    [--size-exempt 0|1] \\
    [--draft 0|1]

Notes:
- If --size-exempt is omitted, it is inferred automatically from diff size (>400 lines).
- Labels are applied via gh api to avoid gh pr edit label instability in some environments.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --title)
      TITLE="$2"
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
    --draft)
      DRAFT="$2"
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

if [[ -z "$TITLE" || -z "$BODY_FILE" || -z "$SCOPE_LABEL" || -z "$TYPE_LABEL" || -z "$RISK_LABEL" ]]; then
  echo "❌ Missing required arguments."
  usage
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is required."
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
  echo "❌ You are on '${BASE_REF}'. Create/switch to a work branch first."
  exit 1
fi

MERGE_BASE="$(git merge-base "origin/${BASE_REF}" HEAD)"
ADDITIONS="$(git diff --numstat "${MERGE_BASE}..HEAD" | awk '{a+=$1} END {print a+0}')"

if [[ -z "$SIZE_EXEMPT" ]]; then
  if (( ADDITIONS > 400 )); then
    SIZE_EXEMPT="1"
  else
    SIZE_EXEMPT="0"
  fi
fi

bash ./scripts/ci/pr-metadata-lint.sh \
  --base "$BASE_REF" \
  --body-file "$BODY_FILE" \
  --scope "$SCOPE_LABEL" \
  --type "$TYPE_LABEL" \
  --risk "$RISK_LABEL" \
  --size-exempt "$SIZE_EXEMPT"

if [[ "$SIZE_EXEMPT" == "1" ]]; then
  SIZE_EXEMPT=1 npm run pr:ready "$BASE_REF"
else
  npm run pr:ready "$BASE_REF"
fi

git push -u origin "$CURRENT_BRANCH"

OWNER_REPO="$(gh repo view --json nameWithOwner -q '.nameWithOwner')"
PR_NUMBER=""
if PR_NUMBER="$(gh pr view --repo "$OWNER_REPO" --head "$CURRENT_BRANCH" --json number -q '.number' 2>/dev/null)"; then
  echo "ℹ️ Existing PR detected: #${PR_NUMBER}"
else
  CREATE_ARGS=(--repo "$OWNER_REPO" --base "$BASE_REF" --head "$CURRENT_BRANCH" --title "$TITLE" --body-file "$BODY_FILE")
  if [[ "$DRAFT" == "1" ]]; then
    CREATE_ARGS+=(--draft)
  fi

  PR_URL="$(gh pr create "${CREATE_ARGS[@]}")"
  PR_NUMBER="$(gh pr view --repo "$OWNER_REPO" --head "$CURRENT_BRANCH" --json number -q '.number')"
  echo "✅ PR created: ${PR_URL}"
fi

LABEL_ARGS=(-f "labels[]=${SCOPE_LABEL}" -f "labels[]=${TYPE_LABEL}" -f "labels[]=${RISK_LABEL}")
if [[ "$SIZE_EXEMPT" == "1" ]]; then
  LABEL_ARGS+=(-f "labels[]=size-exempt")
fi

# Use gh api for labels to avoid pr edit GraphQL instability in some environments.
gh api "repos/${OWNER_REPO}/issues/${PR_NUMBER}/labels" -X POST "${LABEL_ARGS[@]}" >/dev/null

PR_URL="$(gh pr view "$PR_NUMBER" --repo "$OWNER_REPO" --json url -q '.url')"
echo "✅ Labels applied to PR #${PR_NUMBER}."
echo "PR URL: ${PR_URL}"
