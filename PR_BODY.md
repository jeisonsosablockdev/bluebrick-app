## Summary
Este PR alinea la estructura de la raíz del monorepo con las políticas de gobernanza definidas en `knowledge/governance/git-monorepo-policy.md` y realiza la migración del gestor de paquetes de `npm` a `pnpm`.

**Cambios Clave:**
- **Limpieza de Estructura:** Eliminación del directorio `.opencode/` en la raíz y renombre de `test/wallet-setup/` a `e2e/wallet-setup/` para unificar directorios canónicos.
- **Validación Automatizada:** Creación del script `scripts/ci/check-monorepo-structure.sh` que valida la raíz del repositorio en CI/CD.
- **Migración a pnpm:** Remoción de `package-lock.json`, generación de `pnpm-lock.yaml` y actualización de los scripts en `package.json` para usar `pnpm` en lugar de `npm run`.
- **Workflows adaptados:** Configuración de `pnpm` y cache en los workflows de GitHub Actions.
- **Gobernanza de Documentos:** Creación de especificaciones de feature y plan de implementación (`feature-shared-cleanup-monorepo-structure.md`).

---

## Issue
- **Linear:** `N/A` (Tarea de infraestructura transversal)

## RFC
- **RFC:** `N/A`

## Risks / Riesgos
- **Riesgo:** Bajo. Los scripts de ejecución y flujos de CI/CD han sido probados y validados localmente.

## Rollback Plan
1. Eliminar `pnpm-lock.yaml` y `node_modules/`.
2. Restaurar `package-lock.json` mediante git.
3. Revertir cambios en `package.json`, `eslint.config.mjs` y workflows.
4. Ejecutar `npm install`.

## Devnet Proof / Prueba Devnet
- **Devnet Proof:** `N/A` (No hay interacciones en cadena).

## Feature Flag Strategy
- **Feature-flag:** N/A (Este PR es de infraestructura y limpieza, no introduce nueva lógica de negocio reactiva que requiera feature flags).

## Human Acceptance
Status: approved
> ✅ Aprobado y verificado manualmente en el workspace.
> **Aprobado por:** Jay / Jaymusicmachine

## Walkthrough Artifact
- **Path:** [walkthrough.md](file:///Users/jaymusicmachine/.gemini/antigravity/brain/b2844528-7ed9-4dab-bd29-dacea68b3b15/walkthrough.md)

## Validation
- La suite completa de validaciones pasó exitosamente:
  `pnpm validate`
- El script de estructura pasó exitosamente:
  `bash scripts/ci/check-monorepo-structure.sh`

## Required Labels
- [x] `scope:shared`
- [x] `type:refactor`
- [x] `risk:low`