#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: ./scripts/full-cycle.sh <scope> <name> \"mensaje\" [docs]"
  echo "Ej:  ./scripts/full-cycle.sh app initial-ui \"initial UI scaffold\""
  echo "Ej:  ./scripts/full-cycle.sh program nft-mint \"add nft mint flow\" program,nft"
  echo "Scopes branch: app | program | shared | nft | security | refactor"
  echo "Docs opcionales: program,app,nft"
  exit 1
fi

SCOPE="$1"
NAME="$2"
MSG="$3"
DOC_SCOPES="${4:-auto}"

case "$SCOPE" in
  program) AUTO_DOCS="program" ;;
  app) AUTO_DOCS="app" ;;
  nft) AUTO_DOCS="nft" ;;
  *) AUTO_DOCS="" ;;
esac

if [[ "$DOC_SCOPES" == "auto" ]]; then
  DOC_SCOPES="$AUTO_DOCS"
fi

"$(dirname "$0")/git-start.sh" "$SCOPE" "$NAME"

if [[ -n "$DOC_SCOPES" ]]; then
  "$(dirname "$0")/docs-sync.sh" "$DOC_SCOPES"
else
  echo "ℹ️ No docs-sync automático para scope '$SCOPE'"
fi

"$(dirname "$0")/git-save.sh" "$SCOPE" "$MSG"
"$(dirname "$0")/git-push.sh"

echo "✅ Flujo completo: branch + docs + commit + push"
