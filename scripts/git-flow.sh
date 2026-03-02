#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: ./scripts/git-flow.sh <scope> <name> \"mensaje\""
  echo "Ej:  ./scripts/git-flow.sh app initial-ui \"initial UI scaffold\""
  exit 1
fi

SCOPE="$1"
NAME="$2"
MSG="$3"

"$(dirname "$0")/git-start.sh" "$SCOPE" "$NAME"
"$(dirname "$0")/git-save.sh" "$SCOPE" "$MSG"
"$(dirname "$0")/git-push.sh"

echo "✅ Flujo completo: branch + commit + push"
