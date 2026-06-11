#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: ./scripts/full-cycle.sh <scope> <name> \"mensaje\" [docs]"
  echo "Uso: ./scripts/full-cycle.sh <type> <scope> <name> \"mensaje\" [docs] [options git-start]"
  echo "Ej:  ./scripts/full-cycle.sh app initial-ui \"initial UI scaffold\""
  echo "Ej:  ./scripts/full-cycle.sh program nft-mint \"add nft mint flow\" program,nft"
  echo "Ej:  ./scripts/full-cycle.sh refactor shared branch-alignment \"align git scripts\""
  echo "Scopes válidos para ramas tipadas: app | program | shared"
  echo "Tipos válidos: feature | bugfix | fix | hotfix | epic | security | nft | refactor"
  echo "Docs opcionales: program,app,nft"
  exit 1
fi

is_branch_type() {
  [[ "${1:-}" =~ ^(feature|bugfix|fix|hotfix|epic|security|nft|refactor)$ ]]
}

TYPE="feature"
if [[ $# -ge 4 ]] && is_branch_type "$1"; then
  TYPE="$1"
  SCOPE="$2"
  NAME="$3"
  MSG="$4"
  shift 4
else
  SCOPE="$1"
  NAME="$2"
  MSG="$3"
  shift 3
fi

DOC_SCOPES="auto"
if [[ $# -gt 0 && "$1" != --* ]]; then
  DOC_SCOPES="$1"
  shift
fi

case "$SCOPE" in
  program) AUTO_DOCS="program" ;;
  app) AUTO_DOCS="app" ;;
  nft) AUTO_DOCS="nft" ;;
  *) AUTO_DOCS="" ;;
esac

if [[ "$DOC_SCOPES" == "auto" ]]; then
  DOC_SCOPES="$AUTO_DOCS"
fi

"$(dirname "$0")/git-start.sh" "$TYPE" "$SCOPE" "$NAME" "$@"

if [[ "$SCOPE" == "program" || "$SCOPE" == "nft" ]]; then
  "$(dirname "$0")/program-test-stack.sh"
fi

if [[ -n "$DOC_SCOPES" ]]; then
  "$(dirname "$0")/docs-sync.sh" "$DOC_SCOPES"
else
  echo "ℹ️ No docs-sync automático para scope '$SCOPE'"
fi

"$(dirname "$0")/git-save.sh" "$SCOPE" "$MSG"
"$(dirname "$0")/git-push.sh"

echo "✅ Flujo completo: branch + docs + commit + push"
