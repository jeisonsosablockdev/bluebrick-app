#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROGRAMS_DIR="$ROOT_DIR/programs"
CRATES=(litesvm mollusk-svm mollusk-svm-programs-token proptest)

if [[ ! -d "$PROGRAMS_DIR" ]]; then
  echo "ℹ️ No existe directorio /programs. Nada que bootstrapear."
  exit 0
fi

mapfile -t MANIFESTS < <(find "$PROGRAMS_DIR" -type f -name Cargo.toml | sort)

if [[ ${#MANIFESTS[@]} -eq 0 ]]; then
  echo "ℹ️ No se encontraron Cargo.toml dentro de /programs."
  exit 0
fi

for manifest in "${MANIFESTS[@]}"; do
  if ! rg -q "^\[package\]" "$manifest"; then
    echo "↷ Omitiendo manifest virtual: $manifest"
    continue
  fi

  missing=()
  for crate in "${CRATES[@]}"; do
    if ! rg -q "^[[:space:]]*${crate}[[:space:]]*=" "$manifest"; then
      missing+=("$crate")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    echo "✅ Stack de testing ya presente en: $manifest"
    continue
  fi

  echo "🧪 Agregando stack de testing en $manifest: ${missing[*]}"
  cargo add --manifest-path "$manifest" --dev "${missing[@]}"
done

echo "✅ Bootstrap de stack de testing Solana completado."
