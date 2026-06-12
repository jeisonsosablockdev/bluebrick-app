#!/usr/bin/env bash
set -euo pipefail

# Agent Bootstrap - MANDATORY entry point for all agent tasks
# Ensures workflow activation, precondition verification, and task initialization

echo "🔒 AGENT BOOTSTRAP - Required before ANY task"
echo "============================================="

# Detect scope from changed files or prompt
detect_scope() {
  local changed_files=""
  if git status --porcelain | grep -q "^[AM]"; then
    changed_files=$(git status --porcelain | awk '{print $2}')
  fi
  
  # Also check for uncommitted changes in working tree
  if [[ -z "$changed_files" ]]; then
    changed_files=$(git diff --name-only HEAD 2>/dev/null || true)
  fi
  
  echo "Detected changed paths:"
  echo "$changed_files" | sed 's/^/  - /'
  
  # Determine workflow based on paths
  local workflow=""
  if echo "$changed_files" | grep -qE '^(/app|components/)'; then
    workflow="frontend-cycle"
  fi
  if echo "$changed_files" | grep -qE '^(/programs/)'; then
    workflow="blockchain-cycle"
  fi
  if echo "$changed_files" | grep -qE '(nft|mint|metaplex|candy)'; then
    workflow="${workflow:-nft-cycle}"
  fi
  if echo "$changed_files" | grep -qE '^(scripts/db-|lib/db|db/)'; then
    workflow="${workflow:-db}"
  fi
  if echo "$changed_files" | grep -qE '^(\.codex|docs/governance|AGENTS\.md)'; then
    workflow="${workflow:-refactor-cycle}"
  fi
  
  if [[ -n "$workflow" ]]; then
    echo "📋 Matching workflow: .codex/workflows/${workflow}.md"
    if [[ -f ".codex/workflows/${workflow}.md" ]]; then
      echo "   ✅ Workflow exists"
      # Show first 20 lines as summary
      head -30 ".codex/workflows/${workflow}.md"
    else
      echo "   ❌ Workflow NOT FOUND"
    fi
  else
    echo "⚠️  No specific workflow detected from paths"
  fi
}

# Verify preconditions from AGENTS.md Entry Rules
verify_preconditions() {
  echo ""
  echo "🔍 Verifying AGENTS.md Entry Rule preconditions..."
  
  # Check for Linear issue if non-trivial work
  if git diff --name-only HEAD | grep -qE '^(feature|fix|security|nft|refactor)/'; then
    echo "  ⚠️  Non-trivial work detected - Linear issue/artifact required"
    echo "     Ensure governing artifact exists before implementation"
  fi
  
  # Check task:init has been run (or run it now)
  if [[ "${SKIP_TASK_INIT:-0}" != "1" ]]; then
    echo ""
    echo "📋 Running npm run task:init (canonical bootstrap)..."
    npm run task:init
  else
    echo "  ⏭️  SKIP_TASK_INIT=1 set, skipping task:init"
  fi
}

# Main execution
detect_scope
verify_preconditions

echo ""
echo "✅ Agent bootstrap complete. Ready for planner → workflow activation."
echo "============================================="