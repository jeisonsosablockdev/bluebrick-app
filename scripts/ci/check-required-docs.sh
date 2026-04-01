#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${BASE_REF:-${GITHUB_BASE_REF:-develop}}"
HEAD_REF="${HEAD_REF:-HEAD}"
HEAD_BRANCH="${HEAD_BRANCH:-${GITHUB_HEAD_REF:-}}"

echo "Base ref: ${BASE_REF}"
echo "Head ref: ${HEAD_REF}"
if [[ -n "${HEAD_BRANCH}" ]]; then
  echo "Head branch: ${HEAD_BRANCH}"
fi

git fetch --no-tags --depth=1 origin "${BASE_REF}" >/dev/null 2>&1 || true

CHANGED_FILES="$(git diff --name-only "origin/${BASE_REF}...${HEAD_REF}")"

if [[ -z "${CHANGED_FILES}" && "${HEAD_REF}" == "HEAD" ]]; then
  # Local fallback: if branch has no commits yet, inspect working tree vs HEAD.
  CHANGED_FILES="$(git diff --name-only HEAD)"
fi

if [[ -z "${CHANGED_FILES}" ]]; then
  echo "No changed files detected. Docs check skipped."
  exit 0
fi

echo "Changed files:"
echo "${CHANGED_FILES}"

has_changed() {
  local regex="$1"
  if echo "${CHANGED_FILES}" | grep -E -q "${regex}"; then
    return 0
  fi
  return 1
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
    if ! echo "${CHANGED_FILES}" | grep -Fx -q "${doc}"; then
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
detected_story_epic=""
detected_story_id=""

extract_story_context_from_branch() {
  local branch_name="$1"
  if [[ "${branch_name}" =~ epic-([0-9]{3})-story-([0-9]{2}) ]]; then
    detected_story_epic="${BASH_REMATCH[1]}"
    detected_story_id="${BASH_REMATCH[2]}"
    return 0
  fi
  return 1
}

resolve_epic_dir() {
  local epic_id="$1"
  shopt -s nullglob
  local matches=(docs/rfcs/EPIC-"${epic_id}"-*)
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
    "docs/architecture.md" \
    "docs/authority-model.md" \
    "docs/state-machine.md" \
    "docs/threat-model.md" \
    "docs/devnet-proof.md" || missing_any=1
fi

if [[ "${touches_app}" -eq 1 ]]; then
  echo "App scope detected -> validating required frontend/auth docs."
  require_docs_changed "app" \
    "docs/auth-flow.md" \
    "docs/session-model.md" || missing_any=1
fi

if [[ "${touches_nft}" -eq 1 ]]; then
  echo "NFT scope detected -> validating required NFT docs."
  require_docs_changed "nft" \
    "docs/nft-spec.md" || missing_any=1
fi

requires_feature_doc=0
if [[ "${touches_product_code}" -eq 1 ]]; then
  if [[ -n "${HEAD_BRANCH}" ]]; then
    if [[ "${HEAD_BRANCH}" =~ ^(feature|fix|nft|refactor)/ ]]; then
      requires_feature_doc=1
    fi
  else
    # Local fallback when branch name isn't provided by CI env vars.
    CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
    if [[ "${CURRENT_BRANCH}" =~ ^(feature|fix|nft|refactor)/ ]]; then
      requires_feature_doc=1
    fi
  fi
fi

if [[ "${requires_feature_doc}" -eq 1 ]]; then
  echo "Feature/fix/refactor scope detected -> validating feature note under docs/features."
  if ! echo "${CHANGED_FILES}" | grep -E -q '^docs/features/.*\.md$'; then
    echo "::error::Missing feature note update: add/update at least one Markdown file under docs/features/ for this feature/fix/refactor PR."
    missing_any=1
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
      if ! echo "${CHANGED_FILES}" | grep -Fx -q "${story_file}"; then
        echo "::error::Missing story RFC update for this story branch: ${story_file}"
        missing_any=1
      fi
      if ! echo "${CHANGED_FILES}" | grep -Fx -q "${epic_readme}"; then
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
