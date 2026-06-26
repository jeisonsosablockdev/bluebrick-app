#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: ./scripts/git-save.sh <scope> \"mensaje\""
  echo "Uso: ./scripts/git-save.sh --message \"mensaje\" [--scope <scope>]"
  echo "Ej:  ./scripts/git-save.sh app \"initial UI scaffold\""
  exit 1
fi

SCOPE=""
MSG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)
      SCOPE="$2"
      shift 2
      ;;
    --message)
      MSG="$2"
      shift 2
      ;;
    *)
      if [[ -z "${SCOPE}" ]]; then
        SCOPE="$1"
      elif [[ -z "${MSG}" ]]; then
        MSG="$1"
      else
        echo "❌ Argumento desconocido: $1"
        exit 1
      fi
      shift
      ;;
  esac
done

CURRENT_BRANCH="$(git branch --show-current)"

if [[ "$CURRENT_BRANCH" =~ ^(develop|main|master)$ ]]; then
  echo "❌ No se permiten commits directos en ${CURRENT_BRANCH}. Crea una rama de trabajo primero."
  exit 1
fi

if [[ -z "${MSG}" ]]; then
  echo "❌ Mensaje de commit obligatorio."
  exit 1
fi

if [[ -z "${SCOPE}" ]]; then
  if [[ "${CURRENT_BRANCH}" =~ ^(feature|bugfix|fix|hotfix|epic|security|nft|refactor|docs|chore)/([a-z]+)- ]]; then
    SCOPE="${BASH_REMATCH[2]}"
  fi
fi

has_npm_script() {
  local script_name="$1"

  node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); process.exit(pkg.scripts && pkg.scripts['${script_name}'] ? 0 : 1);"
}

run_quality_gates() {
  if [[ "${SKIP_TEST_GATES:-0}" == "1" ]]; then
    echo "⚠️  SKIP_TEST_GATES=1 detectado, se omiten validaciones."
    return
  fi

  if [[ ! -f package.json ]]; then
    echo "❌ package.json no encontrado. No se puede validar tests unitarios."
    exit 1
  fi

  if ! has_npm_script "test"; then
    echo "❌ Falta script 'test' en package.json. Definelo antes de guardar."
    exit 1
  fi

  echo "🧪 Ejecutando gate final de unit tests (npm test)..."
  npm test

  if has_npm_script "validate"; then
    echo "🔍 Ejecutando gate final de calidad (npm run validate)..."
    npm run validate
  else
    echo "❌ Falta script 'validate' en package.json. Definelo antes de guardar."
    exit 1
  fi
}

run_quality_gates

if [[ ! "${SCOPE}" =~ ^(app|program|shared|docs|infra|security|nft)$ ]]; then
  echo "❌ Scope inválido para commit convencional: ${SCOPE}"
  echo "Scopes válidos: app, program, shared, docs, infra, security, nft"
  exit 1
fi

COMMIT_TYPE="feat"
case "${CURRENT_BRANCH}" in
  feature/*)
    COMMIT_TYPE="feat"
    ;;
  bugfix/*)
    COMMIT_TYPE="fix"
    ;;
  fix/*)
    COMMIT_TYPE="fix"
    ;;
  hotfix/*)
    COMMIT_TYPE="fix"
    ;;
  epic/*)
    COMMIT_TYPE="feat"
    ;;
  security/*)
    COMMIT_TYPE="security"
    ;;
  refactor/*)
    COMMIT_TYPE="refactor"
    ;;
  nft/*)
    COMMIT_TYPE="nft"
    ;;
  knowledge/*)
    COMMIT_TYPE="docs"
    ;;
  chore/*)
    COMMIT_TYPE="chore"
    ;;
esac

if git diff --cached --quiet; then
  echo "❌ No hay cambios staged. Haz staging explicito de los archivos de este slice antes de guardar."
  exit 1
fi

git status
git commit -m "${COMMIT_TYPE}(${SCOPE}): ${MSG}"
echo "✅ Commit creado"
