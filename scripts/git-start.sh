#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Uso: ./scripts/git-start.sh <scope> <name>"
  echo "Ej:  ./scripts/git-start.sh app initial-ui"
  exit 1
fi

SCOPE="$1"   # app | program | shared | nft | security | refactor
NAME="$2"    # initial-ui
BRANCH="feature/${SCOPE}-${NAME}"

git status --porcelain >/dev/null
git checkout -b "$BRANCH"
echo "✅ Rama creada: $BRANCH"
