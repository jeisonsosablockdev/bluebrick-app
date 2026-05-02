#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: ./scripts/git-flow.sh <scope> <name> \"mensaje\""
  echo "Uso: ./scripts/git-flow.sh <type> <scope> <name> \"mensaje\" [options git-start]"
  echo "Ej:  ./scripts/git-flow.sh app initial-ui \"initial UI scaffold\""
  echo "Ej:  ./scripts/git-flow.sh refactor shared branch-alignment \"align branch scripts\""
  exit 1
fi

is_branch_type() {
  [[ "${1:-}" =~ ^(feature|fix|security|nft|refactor)$ ]]
}

TYPE="feature"
if [[ $# -ge 4 ]] && is_branch_type "$1"; then
  TYPE="$1"
  SCOPE="$2"
  NAME="$3"
  MSG="$4"
  shift 4
  START_ARGS=("$TYPE" "$SCOPE" "$NAME" "$@")
else
  SCOPE="$1"
  NAME="$2"
  MSG="$3"
  shift 3
  START_ARGS=("$SCOPE" "$NAME" "$@")
fi

"$(dirname "$0")/git-start.sh" "${START_ARGS[@]}"
"$(dirname "$0")/git-save.sh" "$SCOPE" "$MSG"
"$(dirname "$0")/git-push.sh"

echo "✅ Flujo completo: branch + commit + push"
