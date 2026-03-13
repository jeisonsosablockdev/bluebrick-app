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

# Develop-first workflow:
# always branch from latest local/remote develop when available.
if git show-ref --verify --quiet refs/heads/develop; then
  git checkout develop
  if git remote get-url origin >/dev/null 2>&1; then
    git pull --ff-only origin develop
  fi
else
  if git remote get-url origin >/dev/null 2>&1; then
    if git ls-remote --heads origin develop >/dev/null 2>&1 && [[ -n "$(git ls-remote --heads origin develop)" ]]; then
      echo "ℹ️  Rama local 'develop' no existe. Creandola desde origin/develop."
      git fetch origin develop
      git checkout -b develop origin/develop
    else
      echo "⚠️  'origin/develop' no existe. Creando 'develop' desde HEAD actual."
      git checkout -b develop
    fi
  else
    echo "⚠️  Remote 'origin' no configurado. Creando 'develop' desde HEAD actual."
    git checkout -b develop
  fi
fi

git checkout -b "$BRANCH"
echo "✅ Rama creada: $BRANCH"
echo "🌿 Base branch: develop"
echo "🧪 Gate inicial obligatorio:"
echo "   1) Define o actualiza tests unitarios de la historia primero (fase RED)."
echo "   2) Implementa codigo solo despues de tener esos tests definidos."
