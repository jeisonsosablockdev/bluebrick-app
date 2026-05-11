#!/usr/bin/env bash

normalize_markdown_table_cell() {
  local value="${1-}"

  value="${value//\`/}"
  value="$(printf '%s' "${value}" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

  printf '%s' "${value}"
}

extract_story_context_from_branch() {
  local branch_name="${1-}"

  detected_story_epic=""
  detected_story_id=""

  if [[ "${branch_name}" =~ epic-([0-9]{3})-story-([0-9]{3})-([0-9]{2})(-|$) ]]; then
    if [[ "${BASH_REMATCH[1]}" != "${BASH_REMATCH[2]}" ]]; then
      return 1
    fi

    detected_story_epic="${BASH_REMATCH[1]}"
    detected_story_id="${BASH_REMATCH[3]}"
    return 0
  fi

  if [[ "${branch_name}" =~ epic-([0-9]{3})-story-([0-9]{2})(-|$) ]]; then
    detected_story_epic="${BASH_REMATCH[1]}"
    detected_story_id="${BASH_REMATCH[2]}"
    return 0
  fi

  return 1
}

merge_changed_file_sets() {
  awk 'NF && !seen[$0]++'
}

resolve_pr_ready_validate_command() {
  local validate_mode="${1-full}"

  case "${validate_mode}" in
    full)
      printf '%s' "npm run validate"
      ;;
    governance-only)
      printf '%s' "npm run validate:docs-governance"
      ;;
    skip)
      printf '%s' ""
      ;;
    *)
      echo "❌ Invalid validate mode: ${validate_mode}. Expected one of: full, governance-only, skip." >&2
      return 1
      ;;
  esac
}
