# Implementation Spec: Cleanup Monorepo Structure & Migration to pnpm

## Clean-Code Design Contract
* **Responsabilidad única:** El validador [check-monorepo-structure.sh](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/scripts/ci/check-monorepo-structure.sh) solo comprueba directorios en la raíz.
* **Eliminación de código muerto:** Eliminación de `.opencode/` y `package-lock.json`.
* **Coherencia global:** Actualización de todos los workflows de GitHub Actions para usar `pnpm install` y ejecutar tareas mediante `pnpm`.

## Proposed Changes

### Monorepo Structure Cleanup
* [NEW] [check-monorepo-structure.sh](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/scripts/ci/check-monorepo-structure.sh)
* [DELETE] `test/wallet-setup/`
* [NEW] `e2e/wallet-setup/`
* [MODIFY] [eslint.config.mjs](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/eslint.config.mjs)

### NPM to PNPM Migration
* [MODIFY] [package.json](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/package.json)
* [DELETE] `package-lock.json`
* [NEW] `pnpm-lock.yaml`
* [MODIFY] `.github/workflows/` files
* [MODIFY] [AGENTS.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/AGENTS.md)
* [MODIFY] [GEMINI.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/GEMINI.md)

## Verification Plan
1. **Validación de Estructura:** `bash scripts/ci/check-monorepo-structure.sh`
2. **Suite de Validación:** `pnpm validate`
