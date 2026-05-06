#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
README_FILE="$ROOT_DIR/README.md"
TMP_BLOCK="$ROOT_DIR/.readme-docs-block.tmp"
TMP_README="$ROOT_DIR/.readme.tmp"

START_MARKER="<!-- DOCS-AUTO:START -->"
END_MARKER="<!-- DOCS-AUTO:END -->"

if [[ ! -f "$README_FILE" ]]; then
  cat > "$README_FILE" <<'BASE'
# BRIDS

This README includes an auto-generated snapshot of project documentation.

<!-- DOCS-AUTO:START -->
<!-- DOCS-AUTO:END -->
BASE
fi

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

collect_scope() {
  local name="$1"
  case "$name" in
    architecture.md|authority-model.md|state-machine.md|threat-model.md|devnet-proof.md)
      echo "blockchain"
      ;;
    auth-flow.md|session-model.md)
      echo "frontend/auth"
      ;;
    nft-spec.md)
      echo "nft"
      ;;
    *)
      echo "general"
      ;;
  esac
}

{
  echo "## Documentation Snapshot (Auto-generated)"
  echo
  echo "Updated: $generated_at"
  echo
  echo "| Document | Scope | Last Updated | Last Commit |"
  echo "| --- | --- | --- | --- |"

  while IFS= read -r file; do
    name="$(basename "$file")"
    rel_path="${file#"$ROOT_DIR/"}"
    scope="$(collect_scope "$name")"

    if grep -q '^Last Updated:' "$file"; then
      last_updated="$(grep -m1 '^Last Updated:' "$file" | sed 's/^Last Updated:[[:space:]]*//')"
    else
      last_updated="not set"
    fi

    if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      last_commit="$(git -C "$ROOT_DIR" log -1 --date=short --pretty=format:'%ad %h' -- "$rel_path" 2>/dev/null || true)"
    else
      last_commit=""
    fi

    if [[ -z "$last_commit" ]]; then
      last_commit="not committed"
    fi

    printf '| [`%s`](./%s) | %s | %s | %s |\n' "$name" "$rel_path" "$scope" "$last_updated" "$last_commit"
  done < <(find "$ROOT_DIR/docs" -maxdepth 1 -type f -name '*.md' | sort)

  echo
  echo "### Required Docs by Change Type"
  echo '- Blockchain (/programs): `architecture.md`, `authority-model.md`, `state-machine.md`, `threat-model.md`, `devnet-proof.md`'
  echo '- Frontend/Auth (/app): `auth-flow.md`, `session-model.md`'
  echo '- NFT features: `nft-spec.md`'
} > "$TMP_BLOCK"

if grep -q "$START_MARKER" "$README_FILE" && grep -q "$END_MARKER" "$README_FILE"; then
  awk -v start="$START_MARKER" -v end="$END_MARKER" -v block_file="$TMP_BLOCK" '
    $0 == start {
      print
      while ((getline line < block_file) > 0) {
        print line
      }
      in_block = 1
      next
    }
    $0 == end {
      in_block = 0
      print
      next
    }
    !in_block { print }
  ' "$README_FILE" > "$TMP_README"
  mv "$TMP_README" "$README_FILE"
else
  {
    cat "$README_FILE"
    echo
    echo "$START_MARKER"
    cat "$TMP_BLOCK"
    echo "$END_MARKER"
  } > "$TMP_README"
  mv "$TMP_README" "$README_FILE"
fi

rm -f "$TMP_BLOCK" "$TMP_README"

git -C "$ROOT_DIR" add README.md

echo "✅ README sincronizado con documentación"
