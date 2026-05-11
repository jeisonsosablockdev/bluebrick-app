#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git push -u origin "$BRANCH"
echo "✅ Push listo: $BRANCH"

if [[ "$BRANCH" == "develop" ]]; then
  echo "🚀 Siguiente paso: abrir PR de release desde 'develop' hacia 'main'."
elif [[ "$BRANCH" =~ ^(.+)-s[0-9]{2}-[^/]+$ ]]; then
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia '${BASH_REMATCH[1]}-integration'."
elif [[ "$BRANCH" =~ -integration$ ]]; then
  echo "🧭 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
else
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
fi
