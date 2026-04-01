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

if [[ "${missing_any}" -eq 1 ]]; then
  echo "Required docs check failed."
  exit 1
fi

echo "Required docs check passed."
