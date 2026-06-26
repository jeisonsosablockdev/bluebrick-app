#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/pr-governance-lib.sh"

BASE_REF="${BASE_REF:-${GITHUB_BASE_REF:-develop}}"
HEAD_REF="${HEAD_REF:-HEAD}"
HEAD_BRANCH="${HEAD_BRANCH:-${GITHUB_HEAD_REF:-}}"
LOCAL_NOISE_REGEX='^(\.npm-cache/|\.env\.vercel$|knowledge/linear-context\.md$)'
MAX_DISPLAYED_CHANGED_FILES=25

echo "Base ref: ${BASE_REF}"
echo "Head ref: ${HEAD_REF}"
if [[ -n "${HEAD_BRANCH}" ]]; then
  echo "Head branch: ${HEAD_BRANCH}"
fi

# Fetch full base branch history. Using depth=1 can break merge-base discovery
# on long-lived branches and makes the docs gate fail with exit 128.
git fetch --no-tags origin "${BASE_REF}" >/dev/null 2>&1 || true

committed_changed_files="$(git diff --name-only "origin/${BASE_REF}...${HEAD_REF}")"
working_tree_changed_files=""
untracked_changed_files=""

if [[ "${HEAD_REF}" == "HEAD" ]]; then
  # Local fallback: include uncommitted changes so docs preflight matches what
  # the author is about to commit/open in a PR.
  working_tree_changed_files="$(git diff --name-only HEAD)"
  untracked_changed_files="$(
    git ls-files --others --exclude-standard | grep -E -v "${LOCAL_NOISE_REGEX}" || true
  )"
fi

CHANGED_FILES="$(
  {
    printf '%s\n' "${committed_changed_files}"
    printf '%s\n' "${working_tree_changed_files}"
    printf '%s\n' "${untracked_changed_files}"
  } | merge_changed_file_sets
)"

if [[ -z "${CHANGED_FILES}" ]]; then
  echo "No changed files detected. Docs check skipped."
  exit 0
fi

summarize_changed_files_for_output() {
  local changed_files="$1"
  local display_count
  display_count="$(grep -c . <<<"${changed_files}" || true)"

  if [[ "${display_count}" -le "${MAX_DISPLAYED_CHANGED_FILES}" ]]; then
    echo "Changed files:"
    echo "${changed_files}"
    return 0
  fi

  echo "Changed files (showing first ${MAX_DISPLAYED_CHANGED_FILES} of ${display_count}):"
  head -n "${MAX_DISPLAYED_CHANGED_FILES}" <<<"${changed_files}"
}

summarize_changed_files_for_output "${CHANGED_FILES}"

if [[ "${HEAD_REF}" == "HEAD" ]]; then
  suppressed_local_noise_count="$(
    git ls-files --others --exclude-standard | grep -E -c "${LOCAL_NOISE_REGEX}" || true
  )"
  if [[ "${suppressed_local_noise_count}" -gt 0 ]]; then
    echo "Suppressed local-noise paths from docs log: ${suppressed_local_noise_count}"
  fi
fi

has_changed() {
  local regex="$1"
  if grep -E -q -- "${regex}" <<<"${CHANGED_FILES}"; then
    return 0
  fi
  return 1
}

changed_files_include_path() {
  local file_path="$1"

  grep -Fx -q -- "${file_path}" <<<"${CHANGED_FILES}"
}

changed_files_match() {
  local regex="$1"

  grep -E -- "${regex}" <<<"${CHANGED_FILES}" || true
}

require_docs_changed() {
  local scope="$1"
  shift
  local missing=0
  for doc in "$@"; do
    if [[ ! -f "${doc}" ]]; then
      echo "::error::Missing required doc file for ${scope}: ${doc} (file does not exist)"
      missing=1
      continue
    fi
    if ! changed_files_include_path "${doc}"; then
      echo "::error::Missing required doc update for ${scope}: ${doc}"
      missing=1
    fi
  done
  return "${missing}"
}

touches_program=0
touches_app=0
touches_nft=0
touches_product_code=0
missing_any=0
resolve_spec_parent_work_branch() {
  local spec_branch="$1"
  git config --get "branch.${spec_branch}.parentWorkBranch" 2>/dev/null || true
}
resolve_epic_dir() {
  local epic_id="$1"
  shopt -s nullglob
  local matches=(knowledge/rfcs/EPIC-"${epic_id}"-*)
  shopt -u nullglob
  local dirs=()
  for item in "${matches[@]}"; do
    if [[ -d "${item}" ]]; then
      dirs+=("${item}")
    fi
  done

  if [[ "${#dirs[@]}" -ne 1 ]]; then
    echo "::error::Expected exactly one RFC epic directory for EPIC-${epic_id}, found ${#dirs[@]}."
    return 1
  fi

  echo "${dirs[0]}"
}

resolve_story_file() {
  local epic_dir="$1"
  local epic_id="$2"
  local story_id="$3"
  shopt -s nullglob
  local matches=("${epic_dir}"/STORY-"${epic_id}"-"${story_id}"-*.md)
  shopt -u nullglob
  local files=()
  for item in "${matches[@]}"; do
    if [[ -f "${item}" ]]; then
      files+=("${item}")
    fi
  done

  if [[ "${#files[@]}" -ne 1 ]]; then
    echo "::error::Expected exactly one story RFC file for STORY-${epic_id}-${story_id}, found ${#files[@]}."
    return 1
  fi

  echo "${files[0]}"
}

validate_story_rfc_content() {
  local story_file="$1"

  local required_sections=(
    "## Context"
    "## Proposal"
    "## Critique"
    "## Resolution"
    "## Decision"
    "## Status"
    "## Traceability"
  )

  for section in "${required_sections[@]}"; do
    if ! grep -F -q "${section}" "${story_file}"; then
      echo "::error::Missing required section '${section}' in ${story_file}"
      return 1
    fi
  done

  local metadata_status
  metadata_status="$(sed -nE 's/^- Status: `([^`]+)`.*/\1/p' "${story_file}" | head -n1)"
  local current_status
  current_status="$(sed -nE 's/^- Current status: `([^`]+)`.*/\1/p' "${story_file}" | head -n1)"

  if [[ -z "${metadata_status}" ]]; then
    echo "::error::Missing metadata status line in ${story_file}"
    return 1
  fi

  if [[ -z "${current_status}" ]]; then
    echo "::error::Missing current status line in ${story_file}"
    return 1
  fi

  case "${metadata_status}" in
    draft|in-review|approved|implemented|rejected) ;;
    *)
      echo "::error::Invalid story status '${metadata_status}' in ${story_file}"
      return 1
      ;;
  esac

  if [[ "${metadata_status}" != "${current_status}" ]]; then
    echo "::error::Status mismatch in ${story_file}: metadata='${metadata_status}' current='${current_status}'"
    return 1
  fi

  if [[ "${metadata_status}" == "implemented" ]]; then
    local related_prs
    related_prs="$(sed -nE 's/^- Related PR\(s\): (.*)$/\1/p' "${story_file}" | head -n1)"
    local final_commits
    final_commits="$(sed -nE 's/^- Final commit hash\(es\): (.*)$/\1/p' "${story_file}" | head -n1)"

    if [[ -z "${related_prs}" || "${related_prs}" =~ TBD || "${related_prs}" =~ pending/open ]]; then
      echo "::error::Implemented story must have merged PR traceability in ${story_file} (no TBD/pending/open)."
      return 1
    fi

    if [[ -z "${final_commits}" || "${final_commits}" =~ TBD ]]; then
      echo "::error::Implemented story must have final commit hash(es) in ${story_file}."
      return 1
    fi

    if ! echo "${final_commits}" | grep -E -q '[0-9a-f]{7,40}'; then
      echo "::error::Final commit hash(es) format is invalid in ${story_file}."
      return 1
    fi
  fi

  echo "RFC story content validation passed: ${story_file}"
}

validate_epic_readme_story_row() {
  local epic_readme="$1"
  local epic_id="$2"
  local story_id="$3"
  local expected_status="$4"

  local row
  row="$(grep -E "^\\|[[:space:]]*STORY-${epic_id}-${story_id}[[:space:]]*\\|" "${epic_readme}" | head -n1 || true)"
  if [[ -z "${row}" ]]; then
    echo "::error::Missing Story Index row for STORY-${epic_id}-${story_id} in ${epic_readme}"
    return 1
  fi

  local table_status
  table_status="$(echo "${row}" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $5); print $5}')"
  local table_pr
  table_pr="$(echo "${row}" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $6); print $6}')"
  table_status="$(normalize_markdown_table_cell "${table_status}")"
  table_pr="$(normalize_markdown_table_cell "${table_pr}")"

  if [[ "${table_status}" != "${expected_status}" ]]; then
    echo "::error::Story Index status mismatch for STORY-${epic_id}-${story_id} in ${epic_readme}: expected '${expected_status}', found '${table_status}'."
    return 1
  fi

  if [[ "${expected_status}" == "implemented" ]]; then
    if [[ -z "${table_pr}" || "${table_pr}" == "TBD" ]]; then
      echo "::error::Implemented story requires PR reference in Story Index row for STORY-${epic_id}-${story_id} (${epic_readme})."
      return 1
    fi
  fi

  echo "RFC epic Story Index validation passed for STORY-${epic_id}-${story_id}"
}

if has_changed '^programs/'; then
  touches_program=1
fi

if has_changed '^app/'; then
  touches_app=1
fi

if has_changed '^(app|programs|packages|lib|tests|e2e)/'; then
  touches_product_code=1
fi

if has_changed '^(programs|app|lib|packages|tests|e2e)/.*(nft|mint|metaplex|candy|asset)'; then
  touches_nft=1
fi

if [[ "${touches_program}" -eq 1 ]]; then
  echo "Program scope detected -> validating required blockchain docs."
  require_docs_changed "program" \
    "knowledge/architecture/architecture-overview.md" \
    "knowledge/architecture/authority-model.md" \
    "knowledge/architecture/state-machine.md" \
    "knowledge/architecture/threat-model.md" \
    "knowledge/architecture/devnet-proof.md" || missing_any=1
fi

if [[ "${touches_app}" -eq 1 ]]; then
  echo "App scope detected -> validating required frontend/auth docs."
  require_docs_changed "app" \
    "knowledge/architecture/auth-flow.md" \
    "knowledge/architecture/session-model.md" || missing_any=1
fi

if [[ "${touches_nft}" -eq 1 ]]; then
  echo "NFT scope detected -> validating required NFT docs."
  require_docs_changed "nft" \
    "knowledge/architecture/nft-spec.md" || missing_any=1
fi

requires_feature_artifact_pair=0
requires_fix_artifact_pair=0
if [[ "${touches_product_code}" -eq 1 ]]; then
  branch_for_artifact_checks=""
  if [[ -n "${HEAD_BRANCH}" ]]; then
    branch_for_artifact_checks="${HEAD_BRANCH}"
  else
    # Local fallback when branch name isn't provided by CI env vars.
    CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
    branch_for_artifact_checks="${CURRENT_BRANCH}"
  fi

  if [[ "${branch_for_artifact_checks}" =~ ^SPEC/ ]]; then
    spec_parent_work_branch="$(resolve_spec_parent_work_branch "${branch_for_artifact_checks}")"
    if [[ -n "${spec_parent_work_branch}" ]]; then
      branch_for_artifact_checks="${spec_parent_work_branch}"
    else
      echo "::error::SPEC branch '${branch_for_artifact_checks}' is missing branch.<name>.parentWorkBranch config. Create SPEC branches with ./scripts/git-start.sh."
      missing_any=1
    fi
  fi

  if [[ "${branch_for_artifact_checks}" =~ ^(feature|security|nft|refactor|epic)/ ]]; then
    requires_feature_artifact_pair=1
  fi
  if [[ "${branch_for_artifact_checks}" =~ ^(fix|bugfix|hotfix)/ ]]; then
    requires_fix_artifact_pair=1
  fi
  if [[ "${branch_for_artifact_checks}" =~ ^initiative/ ]]; then
    requires_feature_artifact_pair=1
  fi
fi

if [[ "${requires_feature_artifact_pair}" -eq 1 ]]; then
  echo "Feature/security/nft/refactor/epic scope detected -> validating feature artifacts under knowledge/features."
  feature_problem_artifacts="$(changed_files_match '^knowledge/features/feature-.*\.md$' | grep -E -v -- '-implementation\.md$' || true)"
  feature_solution_artifacts="$(changed_files_match '^knowledge/features/feature-.*-implementation\.md$')"

  if [[ -z "${feature_problem_artifacts}" ]]; then
    echo "::error::Missing feature problem artifact update: add/update knowledge/features/feature-<slug>.md for this PR."
    missing_any=1
  fi

  if [[ -z "${feature_solution_artifacts}" ]]; then
    echo "::error::Missing feature solution artifact update: add/update knowledge/features/feature-<slug>-implementation.md for this PR."
    missing_any=1
  fi

  if [[ "${missing_any}" -eq 0 ]]; then
    matching_feature_pair=0
    while IFS= read -r problem_artifact; do
      [[ -z "${problem_artifact}" ]] && continue
      problem_base="${problem_artifact%.md}"
      expected_solution="${problem_base}-implementation.md"
      if grep -Fx -q -- "${expected_solution}" <<<"${feature_solution_artifacts}"; then
        matching_feature_pair=1
        break
      fi
    done <<<"${feature_problem_artifacts}"

    if [[ "${matching_feature_pair}" -eq 0 ]]; then
      echo "::error::Feature artifact pair mismatch: update a matching knowledge/features/feature-<slug>.md and knowledge/features/feature-<slug>-implementation.md in the same PR."
      missing_any=1
    fi
  fi
fi

if [[ "${requires_fix_artifact_pair}" -eq 1 ]]; then
  echo "Fix scope detected -> validating problem + solution artifact pair under knowledge/fixes."
  fix_problem_artifacts="$(changed_files_match '^knowledge/fixes/fix-.*\.md$' | grep -E -v -- '-implementation\.md$' || true)"
  fix_solution_artifacts="$(changed_files_match '^knowledge/fixes/fix-.*-implementation\.md$')"

  if [[ -z "${fix_problem_artifacts}" ]]; then
    echo "::error::Missing fix problem artifact update: add/update knowledge/fixes/fix-<slug>.md for this PR."
    missing_any=1
  fi

  if [[ -z "${fix_solution_artifacts}" ]]; then
    echo "::error::Missing fix solution artifact update: add/update knowledge/fixes/fix-<slug>-implementation.md for this PR."
    missing_any=1
  fi

  if [[ "${missing_any}" -eq 0 ]]; then
    matching_fix_pair=0
    while IFS= read -r problem_artifact; do
      [[ -z "${problem_artifact}" ]] && continue
      problem_base="${problem_artifact%.md}"
      expected_solution="${problem_base}-implementation.md"
      if grep -Fx -q -- "${expected_solution}" <<<"${fix_solution_artifacts}"; then
        matching_fix_pair=1
        break
      fi
    done <<<"${fix_problem_artifacts}"

    if [[ "${matching_fix_pair}" -eq 0 ]]; then
      echo "::error::Fix artifact pair mismatch: update a matching knowledge/fixes/fix-<slug>.md and knowledge/fixes/fix-<slug>-implementation.md in the same PR."
      missing_any=1
    fi
  fi
fi

if [[ -z "${HEAD_BRANCH}" ]]; then
  HEAD_BRANCH="$(git branch --show-current 2>/dev/null || true)"
fi

if [[ "${touches_product_code}" -eq 1 ]] && extract_story_context_from_branch "${HEAD_BRANCH}"; then
  echo "Epic/story branch detected (${HEAD_BRANCH}) -> validating RFC sync for STORY-${detected_story_epic}-${detected_story_id}."

  epic_dir="$(resolve_epic_dir "${detected_story_epic}")" || missing_any=1
  if [[ "${missing_any}" -eq 0 ]]; then
    epic_readme="${epic_dir}/README.md"
    story_file="$(resolve_story_file "${epic_dir}" "${detected_story_epic}" "${detected_story_id}")" || missing_any=1

    if [[ ! -f "${epic_readme}" ]]; then
      echo "::error::Missing epic README for branch story flow: ${epic_readme}"
      missing_any=1
    fi

    if [[ "${missing_any}" -eq 0 ]]; then
      if ! changed_files_include_path "${story_file}"; then
        echo "::error::Missing story RFC update for this story branch: ${story_file}"
        missing_any=1
      fi
      if ! changed_files_include_path "${epic_readme}"; then
        echo "::error::Missing epic README update for this story branch: ${epic_readme}"
        missing_any=1
      fi
    fi

    if [[ "${missing_any}" -eq 0 ]]; then
      validate_story_rfc_content "${story_file}" || missing_any=1
    fi

    if [[ "${missing_any}" -eq 0 ]]; then
      story_status="$(sed -nE 's/^- Status: `([^`]+)`.*/\1/p' "${story_file}" | head -n1)"
      validate_epic_readme_story_row "${epic_readme}" "${detected_story_epic}" "${detected_story_id}" "${story_status}" || missing_any=1
    fi
  fi
fi

if [[ "${missing_any}" -eq 1 ]]; then
  echo "Required docs check failed."
  exit 1
fi

echo "Required docs check passed."
