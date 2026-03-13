#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push -u origin "$BRANCH"
echo "✅ Push listo: $BRANCH"

if [[ "$BRANCH" == "develop" ]]; then
  echo "🚀 Siguiente paso: abrir PR de release desde 'develop' hacia 'main'."
else
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
fi
