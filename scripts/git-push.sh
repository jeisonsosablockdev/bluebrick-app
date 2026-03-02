#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push -u origin "$BRANCH"
echo "✅ Push listo: $BRANCH"
