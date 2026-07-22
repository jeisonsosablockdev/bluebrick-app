#!/usr/bin/env bash
# scripts/ci/check-layered-architecture.sh
#
# Validates 4-layer architecture compliance for Solana & Next.js per architect.yaml.
# Exits 1 if forbidden imports or layer boundary violations are detected.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "== 4-Layer Architecture Governance Check =="
echo "Root: $REPO_ROOT"
echo ""

VIOLATIONS=()

# 1. Enforce mandatory canonical directories in /lib
MANDATORY_DIRS=("hooks" "state" "pipelines" "infrastructure")
for dir in "${MANDATORY_DIRS[@]}"; do
  if [ ! -d "$REPO_ROOT/lib/$dir" ]; then
    VIOLATIONS+=("Missing mandatory layer directory: /lib/$dir")
  fi
done

# 2. Enforce Layer 1 (Presentation: /app, /components) does not import direct DB (pg)
if grep -rn --include="*.ts" --include="*.tsx" 'from "pg"' "$REPO_ROOT/app" "$REPO_ROOT/components" 2>/dev/null; then
  VIOLATIONS+=("Layer 1 (Presentation) contains forbidden direct DB imports ('pg')")
fi

if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  echo "✅ 4-Layer architecture governance check passed."
  exit 0
else
  echo "❌ 4-Layer architecture violations detected!"
  echo ""
  for v in "${VIOLATIONS[@]}"; do
    echo "  → $v"
  done
  echo ""
  exit 1
fi
