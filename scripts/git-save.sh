#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Uso: ./scripts/git-save.sh <scope> \"mensaje\""
  echo "Ej:  ./scripts/git-save.sh app \"initial UI scaffold\""
  exit 1
fi

SCOPE="$1"
MSG="$2"

CURRENT_BRANCH="$(git branch --show-current)"

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
  fix/*)
    COMMIT_TYPE="fix"
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
  docs/*)
    COMMIT_TYPE="docs"
    ;;
  chore/*)
    COMMIT_TYPE="chore"
    ;;
esac

git add .
git status
git commit -m "${COMMIT_TYPE}(${SCOPE}): ${MSG}"
echo "✅ Commit creado"
