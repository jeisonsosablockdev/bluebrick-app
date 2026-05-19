#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$BRANCH" =~ ^(develop|main|master)$ ]]; then
  echo "❌ No se permite push directo a ${BRANCH}. Abre una rama de trabajo y usa PR."
  exit 1
fi

git push -u origin "$BRANCH"
echo "✅ Push listo: $BRANCH"

if [[ "$BRANCH" == "develop" ]]; then
  echo "🚀 Siguiente paso: abrir PR de release desde 'develop' hacia 'main'."
elif [[ "$BRANCH" =~ ^(.+)-s[0-9]{2}-[^/]+$ ]]; then
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia '${BASH_REMATCH[1]}'."
elif [[ "$BRANCH" =~ -integration$ ]]; then
  echo "🧭 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
else
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
fi
