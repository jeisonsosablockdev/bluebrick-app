#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${BASE_REF:-${GITHUB_BASE_REF:-develop}}"
HEAD_REF="${HEAD_REF:-HEAD}"
HEAD_BRANCH="${HEAD_BRANCH:-${GITHUB_HEAD_REF:-$(git branch --show-current 2>/dev/null || true)}}"

BASE_REF="${BASE_REF}" HEAD_REF="${HEAD_REF}" HEAD_BRANCH="${HEAD_BRANCH}" bash ./scripts/ci/check-required-docs.sh

