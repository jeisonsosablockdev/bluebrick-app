#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${BASE_REF:-develop}"
FETCH_REMOTE=0
LIST_LIMIT="${LIST_LIMIT:-12}"

usage() {
  cat <<USAGE
Usage:
  bash ./scripts/ci/preflight-start.sh [--base <branch>] [--fetch]

Options:
  --base <branch>  Base branch to compare against (default: develop)
  --fetch          Refresh origin refs before reviewing branches
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --fetch)
      FETCH_REMOTE=1
      shift
      ;;
    --no-fetch)
      FETCH_REMOTE=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git worktree."
  exit 1
fi

print_section() {
  local title="$1"
  echo
  echo "${title}"
}

count_matches() {
  local pattern="$1"
  local text="${2-}"

  if [[ -z "${text}" ]]; then
    echo "0"
    return 0
  fi

  grep -E -c -- "${pattern}" <<<"${text}" || true
}

print_limited_list() {
  local lines="${1-}"
  local prefix="${2-- }"

  if [[ -z "${lines}" ]]; then
    echo "${prefix}none"
    return 0
  fi

  local total
  total="$(grep -c . <<<"${lines}" || true)"

  head -n "${LIST_LIMIT}" <<<"${lines}" | while IFS= read -r line; do
    [[ -z "${line}" ]] && continue
    echo "${prefix}${line}"
  done

  if (( total > LIST_LIMIT )); then
    echo "${prefix}... ${total} total"
  fi
}

count_nonempty_lines() {
  local lines="${1-}"

  if [[ -z "${lines}" ]]; then
    echo "0"
    return 0
  fi

  grep -c . <<<"${lines}" || true
}

print_agents_summary() {
  local section="$1"
  local limit="$2"

  awk -v target="## ${section}" -v limit="${limit}" '
    $0 == target { in_section = 1; next }
    /^## / && in_section { exit }
    in_section && /^([[:space:]]*)- / {
      print
      count++
      if (count >= limit) {
        exit
      }
    }
  ' AGENTS.md
}

branch_artifact_guidance() {
  local branch_name="$1"

  case "${branch_name}" in
    feature/*|security/*|nft/*|refactor/*)
      echo "- This branch family expects /docs/features/*.md updates when qualifying product code changes."
      ;;
    fix/*)
      echo "- This branch family expects /docs/fixes/fix-<slug>.md and /docs/fixes/fix-<slug>-implementation.md for qualifying work."
      ;;
    develop)
      echo "- Fresh task brief detected: use ./scripts/task-init.sh to run the Socratic clarification pass and then create the right branch."
      ;;
  esac

  if [[ "${branch_name}" =~ -integration$ ]]; then
    echo "- Integration branch detected: documentation slice should close before implementation slices."
  fi

  if [[ "${branch_name}" =~ -s[0-9]{2}- ]]; then
    echo "- Slice branch detected: PR target should be the parent integration branch, not develop."
  fi
}

has_remote=0
if git remote get-url origin >/dev/null 2>&1; then
  has_remote=1
fi

if [[ "${FETCH_REMOTE}" == "1" && "${has_remote}" == "1" ]]; then
  git fetch origin >/dev/null 2>&1 || true
  REMOTE_REFRESH_SUMMARY="Remote refs refreshed from origin."
else
  REMOTE_REFRESH_SUMMARY="Automatic remote cleanup is disabled. Branch review uses local refs unless you run with --fetch."
fi

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  CURRENT_BRANCH="DETACHED_HEAD"
fi

UPSTREAM_BRANCH=""
if [[ "${CURRENT_BRANCH}" != "DETACHED_HEAD" ]]; then
  UPSTREAM_BRANCH="$(git for-each-ref --format='%(upstream:short)' "refs/heads/${CURRENT_BRANCH}" | head -n1)"
fi

STATUS_OUTPUT="$(git status --short --branch)"
STATUS_PORCELAIN="$(git status --porcelain)"
TRACKED_CHANGES="$(grep -E -v '^\?\?' <<<"${STATUS_PORCELAIN}" || true)"
UNTRACKED_CHANGES="$(grep -E '^\?\?' <<<"${STATUS_PORCELAIN}" || true)"
TRACKED_COUNT="$(count_matches '.' "${TRACKED_CHANGES}")"
UNTRACKED_COUNT="$(count_matches '.' "${UNTRACKED_CHANGES}")"

BASE_LOCAL=0
BASE_REMOTE=0
if git show-ref --verify --quiet "refs/heads/${BASE_REF}"; then
  BASE_LOCAL=1
fi
if git show-ref --verify --quiet "refs/remotes/origin/${BASE_REF}"; then
  BASE_REMOTE=1
fi

BASE_SYNC_SUMMARY="Base branch '${BASE_REF}' could not be compared to origin."
if [[ "${BASE_LOCAL}" == "1" && "${BASE_REMOTE}" == "1" ]]; then
  read -r LOCAL_AHEAD LOCAL_BEHIND < <(git rev-list --left-right --count "${BASE_REF}...origin/${BASE_REF}")
  if [[ "${LOCAL_AHEAD}" == "0" && "${LOCAL_BEHIND}" == "0" ]]; then
    BASE_SYNC_SUMMARY="Local ${BASE_REF} is aligned with origin/${BASE_REF}."
  else
    BASE_SYNC_SUMMARY="Local ${BASE_REF} is ahead ${LOCAL_AHEAD} and behind ${LOCAL_BEHIND} versus origin/${BASE_REF}."
  fi
elif [[ "${BASE_REMOTE}" == "1" ]]; then
  BASE_SYNC_SUMMARY="Remote origin/${BASE_REF} exists, but no local ${BASE_REF} branch is checked out."
elif [[ "${BASE_LOCAL}" == "1" ]]; then
  BASE_SYNC_SUMMARY="Local ${BASE_REF} exists, but origin/${BASE_REF} is unavailable."
fi

CURRENT_BRANCH_SUMMARY="Current branch does not have an upstream."
if [[ -n "${UPSTREAM_BRANCH}" ]]; then
  TRACK_STATE="$(git for-each-ref --format='%(upstream:track)' "refs/heads/${CURRENT_BRANCH}" | head -n1)"
  if [[ -z "${TRACK_STATE}" ]]; then
    CURRENT_BRANCH_SUMMARY="Current branch tracks ${UPSTREAM_BRANCH}."
  else
    CURRENT_BRANCH_SUMMARY="Current branch tracks ${UPSTREAM_BRANCH} ${TRACK_STATE}."
  fi
fi

BRANCH_AGE_SUMMARY="Current branch age could not be derived from ${BASE_REF}."
if [[ "${BASE_REMOTE}" == "1" ]]; then
  MERGE_BASE="$(git merge-base "origin/${BASE_REF}" HEAD 2>/dev/null || true)"
  if [[ -n "${MERGE_BASE}" ]]; then
    UNIQUE_COMMIT_COUNT="$(git rev-list --count "${MERGE_BASE}..HEAD")"
    if (( UNIQUE_COMMIT_COUNT == 0 )); then
      BRANCH_AGE_SUMMARY="Current branch has no unique commits versus origin/${BASE_REF}."
    else
      FIRST_UNIQUE_COMMIT_EPOCH="$(git log --reverse --format='%ct' "${MERGE_BASE}..HEAD" | head -n1)"
      NOW_EPOCH="$(date +%s)"
      BRANCH_AGE_DAYS="$(awk -v now="${NOW_EPOCH}" -v first="${FIRST_UNIQUE_COMMIT_EPOCH}" 'BEGIN {printf "%.2f", (now-first)/86400}')"
      BRANCH_AGE_SUMMARY="Current branch has ${UNIQUE_COMMIT_COUNT} unique commit(s) and is ${BRANCH_AGE_DAYS} day(s) old versus origin/${BASE_REF}."
    fi
  fi
fi

LOCAL_ONLY_BRANCHES="$(
  git for-each-ref --sort=-committerdate --format='%(refname:short)|%(upstream:short)|%(committerdate:relative)' refs/heads \
    | awk -F'|' '$2 == "" {print $1 " (" $3 ")"}'
)"

GONE_UPSTREAM_BRANCHES="$(
  git for-each-ref --sort=-committerdate --format='%(refname:short)|%(upstream:track)|%(committerdate:relative)' refs/heads \
    | awk -F'|' '$2 ~ /gone/ {print $1 " (" $3 ")"}'
)"
LOCAL_ONLY_COUNT="$(count_nonempty_lines "${LOCAL_ONLY_BRANCHES}")"
GONE_UPSTREAM_COUNT="$(count_nonempty_lines "${GONE_UPSTREAM_BRANCHES}")"

MERGED_BRANCHES=""
if [[ "${BASE_LOCAL}" == "1" ]]; then
  MERGED_BRANCHES="$(
    git for-each-ref --sort=-committerdate --format='%(refname:short)' --merged "${BASE_REF}" refs/heads \
      | grep -E -v "^(main|master|${BASE_REF}|${CURRENT_BRANCH})$" || true
  )"
fi
MERGED_BRANCH_COUNT="$(count_nonempty_lines "${MERGED_BRANCHES}")"

PACKAGE_LOCK_SUMMARY="No package lockfile review ran."
if [[ -f package.json && -f package-lock.json ]]; then
  PACKAGE_RELATED_CHANGES="$(
    {
      if [[ "${BASE_REMOTE}" == "1" ]]; then
        git diff --name-only "origin/${BASE_REF}...HEAD" -- package.json package-lock.json
      fi
      git diff --name-only --cached -- package.json package-lock.json
      git diff --name-only -- package.json package-lock.json
      git ls-files --others --exclude-standard -- package.json package-lock.json
    } | awk 'NF && !seen[$0]++'
  )"

  PACKAGE_CHANGED=0
  LOCK_CHANGED=0
  if grep -Fx -q "package.json" <<<"${PACKAGE_RELATED_CHANGES}"; then
    PACKAGE_CHANGED=1
  fi
  if grep -Fx -q "package-lock.json" <<<"${PACKAGE_RELATED_CHANGES}"; then
    LOCK_CHANGED=1
  fi

  if [[ "${PACKAGE_CHANGED}" == "1" && "${LOCK_CHANGED}" == "0" ]]; then
    PACKAGE_LOCK_SUMMARY="Warning: package.json changed without package-lock.json in the branch/worktree."
  elif [[ "${PACKAGE_CHANGED}" == "0" && "${LOCK_CHANGED}" == "1" ]]; then
    PACKAGE_LOCK_SUMMARY="Note: package-lock.json changed without package.json in the branch/worktree."
  else
    PACKAGE_LOCK_SUMMARY="No obvious package.json/package-lock.json drift detected in the branch/worktree."
  fi
elif [[ -f package.json ]]; then
  PACKAGE_LOCK_SUMMARY="Warning: package.json exists but package-lock.json is missing."
else
  PACKAGE_LOCK_SUMMARY="No package.json found in the current worktree."
fi

declare -a ACTION_ITEMS=()
append_action() {
  ACTION_ITEMS+=("$1")
}

if [[ "${TRACKED_COUNT}" != "0" || "${UNTRACKED_COUNT}" != "0" ]]; then
  append_action "Finish, stash, or document the current worktree changes before switching branches or starting a new slice."
fi

if [[ "${BASE_LOCAL}" == "1" && "${BASE_REMOTE}" == "1" ]]; then
  if (( LOCAL_BEHIND > 0 )); then
    append_action "Update local ${BASE_REF} from origin/${BASE_REF} before creating new work branches."
  fi
  if (( LOCAL_AHEAD > 0 )); then
    append_action "Review why local ${BASE_REF} is ahead of origin/${BASE_REF}; decide whether to push, split, or keep those commits local before branching more work."
  fi
fi

if [[ "${CURRENT_BRANCH}" == "DETACHED_HEAD" ]]; then
  append_action "Switch to a named work branch before starting changes so AGENTS branch rules and PR flow still apply."
elif [[ -z "${UPSTREAM_BRANCH}" && "${CURRENT_BRANCH}" != "${BASE_REF}" ]]; then
  append_action "Publish ${CURRENT_BRANCH} with 'git push -u origin ${CURRENT_BRANCH}' if it should be shared; otherwise keep it intentionally local."
fi

if (( LOCAL_ONLY_COUNT > 0 )); then
  append_action "Review local-only branches and decide which ones are intentional drafts versus branches that should be published or retired."
fi

if (( GONE_UPSTREAM_COUNT > 0 )); then
  append_action "Review branches whose upstream is gone and confirm whether each was merged or archived before deleting anything manually."
fi

if (( MERGED_BRANCH_COUNT > 0 )); then
  append_action "Review branches already merged into ${BASE_REF}; delete them manually only after confirming they are no longer needed."
fi

if [[ "${PACKAGE_CHANGED:-0}" == "1" && "${LOCK_CHANGED:-0}" == "0" ]]; then
  append_action "If dependency definitions changed, regenerate and commit package-lock.json so the repo stays reproducible."
elif [[ "${PACKAGE_CHANGED:-0}" == "0" && "${LOCK_CHANGED:-0}" == "1" ]]; then
  append_action "Confirm why package-lock.json changed on its own and keep a short note in the branch or PR if the drift is intentional."
elif [[ ! -f package-lock.json && -f package.json ]]; then
  append_action "Add the missing package-lock.json or document why this repository should run without one."
fi

case "${CURRENT_BRANCH}" in
  feature/*|fix/*|security/*|nft/*|refactor/*)
    append_action "Review AGENTS.md before implementation: non-trivial work in this branch family needs the governing artifact pair before coding."
    ;;
esac

print_section "== Start Preflight =="
echo "Repository: $(basename "$(git rev-parse --show-toplevel)")"
echo "Current branch: ${CURRENT_BRANCH}"
echo "Status:"
echo "${STATUS_OUTPUT}"

print_section "1) Workspace"
if [[ "${TRACKED_COUNT}" == "0" && "${UNTRACKED_COUNT}" == "0" ]]; then
  echo "- Working tree is clean."
else
  echo "- Working tree has ${TRACKED_COUNT} tracked change(s) and ${UNTRACKED_COUNT} untracked file(s)."
fi
echo "- ${CURRENT_BRANCH_SUMMARY}"
echo "- ${REMOTE_REFRESH_SUMMARY}"

print_section "2) Branch Hygiene"
echo "- ${BASE_SYNC_SUMMARY}"
echo "- ${BRANCH_AGE_SUMMARY}"
echo "- Local branches without upstream:"
print_limited_list "${LOCAL_ONLY_BRANCHES}"
echo "- Local branches whose upstream is gone:"
print_limited_list "${GONE_UPSTREAM_BRANCHES}"
echo "- Local branches already merged into ${BASE_REF}:"
print_limited_list "${MERGED_BRANCHES}"

print_section "3) Package Drift"
echo "- ${PACKAGE_LOCK_SUMMARY}"

print_section "4) AGENTS.md"
if [[ -f AGENTS.md ]]; then
  echo "- Entry rules:"
  print_limited_list "$(print_agents_summary "Entry Rules" 4)" "  "
  echo "- Definition of Done reminders:"
  print_limited_list "$(print_agents_summary "Definition of Done" 4)" "  "
else
  echo "- AGENTS.md not found at repo root."
fi

print_section "5) Branch Guidance"
BRANCH_GUIDANCE="$(branch_artifact_guidance "${CURRENT_BRANCH}")"
if [[ -n "${BRANCH_GUIDANCE}" ]]; then
  print_limited_list "${BRANCH_GUIDANCE}"
else
  echo "- Start new work from the latest develop using ./scripts/task-init.sh when the brief is vague, or ./scripts/git-start.sh when the branch shape is already known."
fi

print_section "6) Recommended Next Steps"
if (( ${#ACTION_ITEMS[@]} == 0 )); then
  echo "- No immediate branch-hygiene action detected."
else
  ACTION_LINES="$(printf '%s\n' "${ACTION_ITEMS[@]}")"
  print_limited_list "${ACTION_LINES}"
fi

echo
echo "Preflight complete."
