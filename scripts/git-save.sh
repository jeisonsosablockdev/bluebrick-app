#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Uso: ./scripts/git-save.sh <scope> \"mensaje\""
  echo "Ej:  ./scripts/git-save.sh app \"initial UI scaffold\""
  exit 1
fi

SCOPE="$1"
MSG="$2"

git add .
git status
git commit -m "feat(${SCOPE}): ${MSG}"
echo "✅ Commit creado"
