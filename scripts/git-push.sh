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
elif [[ "$BRANCH" =~ ^SPEC/ ]]; then
  PARENT_BRANCH="$(git config --get "branch.${BRANCH}.parentWorkBranch" || true)"
  if [[ -n "$PARENT_BRANCH" ]]; then
    echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia '$PARENT_BRANCH'."
  else
    echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia la parent work branch configurada."
  fi
elif [[ "$BRANCH" =~ ^(feature|bugfix|fix|hotfix|epic|security|nft|refactor)/[a-z0-9-]+-[A-Z]+-[0-9]+-[a-z0-9-]+$ ]]; then
  echo "🧭 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
elif [[ "$BRANCH" =~ ^initiative/ ]]; then
  echo "🧭 Rama legacy de initiative detectada. Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
elif [[ "$BRANCH" =~ -integration$ ]]; then
  echo "🧭 Rama legacy de integracion detectada. Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
else
  echo "🧩 Siguiente paso: abrir PR desde '$BRANCH' hacia 'develop'."
fi
