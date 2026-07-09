#!/usr/bin/env bash
# scripts/ci/check-monorepo-structure.sh
#
# Validates the repository root only contains canonical directories.
# Exits 1 if any non-whitelisted top-level directory is found.
#
# Canonical structure (per knowledge/governance/git-monorepo-policy.md)

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Newline-separated whitelist of allowed top-level directory names
ALLOWED="
programs
app
components
lib
packages
tests
e2e
scripts
public
db
schemas
content
knowledge
artifacts
node_modules
.next
.git
.github
.agents
.codex
.cursor
.keys
.vercel
.npm-cache
.cache-synpress
"

echo "== Monorepo Structure Check =="
echo "Root: $REPO_ROOT"
echo ""

VIOLATIONS=()

for entry in "$REPO_ROOT"/*/  "$REPO_ROOT"/.*/ ; do
  [ -d "$entry" ] || continue
  name="$(basename "$entry")"
  # Skip . and ..
  [ "$name" = "." ] && continue
  [ "$name" = ".." ] && continue

  if ! echo "$ALLOWED" | grep -qx "$name"; then
    VIOLATIONS+=("$name")
  fi
done

if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  echo "✅ Monorepo structure check passed. No unauthorized top-level directories found."
  exit 0
else
  echo "❌ Monorepo structure violation detected!"
  echo ""
  echo "The following top-level directories are NOT in the canonical whitelist:"
  for v in "${VIOLATIONS[@]}"; do
    echo "  → /$v"
  done
  echo ""
  echo "To fix: remove the directory or add it to the whitelist in:"
  echo "  scripts/ci/check-monorepo-structure.sh"
  echo "  knowledge/governance/git-monorepo-policy.md"
  echo ""
  exit 1
fi
