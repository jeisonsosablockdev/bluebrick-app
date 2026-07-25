# Solution Artifact: license-compliance Implementation

## How the work will be resolved
La solución se implementará mediante scripts nativos en TypeScript que aprovechan la capacidad nativa de PNPM (`pnpm licenses list --json`), evitando dependencias pesadas o desactualizadas:
1. Se creará el archivo de política de licencias `knowledge/governance/license-policy.json` clasificando licencias en `allowed`, `warn` y `disallowed`.
2. Se implementará `scripts/ci/check-licenses.ts` que ejecutará la inspección del árbol de `node_modules`, validará cada licencia contra la política y retornará código de error `1` si hay violaciones.
3. Se implementará `scripts/knowledge/generate-license-report.ts` que compilará el reporte en `knowledge/governance/licenses-report.md`.
4. Se registrarán las tareas en `package.json` (`check:licenses` y `knowledge:licenses`) y se integrará `pnpm check:licenses` dentro de `pnpm validate` y `scripts/ci/check-layered-architecture.sh`.

## What slices and branches will be used
- Rama principal de trabajo: `feature/jaymusicmachine-BRI-183-license-compliance`
- Rama de integración objetivo: `develop`

## What tests go first
1. Test unitario/integración en `tests/ci/check-licenses.test.ts` para verificar la lógica de clasificación de licencias (evaluando licencias de prueba MIT vs GPL vs LGPL).
2. Test de integración para validar la generación correcta del reporte markdown en `knowledge/governance/licenses-report.md`.

## What tooling is required
- Node.js runtime / `tsx` runner
- `pnpm` CLI (`pnpm licenses list --json`)
- Módulo nativo `fs` y `child_process` de Node.js
- MCP Server de Linear (`linear-mcp-server`)

## What gates must pass
- `pnpm check:licenses` aprueba limpiamente sin violaciones en el estado actual del repositorio.
- `pnpm knowledge:licenses` crea/actualiza `knowledge/governance/licenses-report.md`.
- `pnpm validate` ejecuta exitosamente incluyendo la verificación de licencias.
- `architect` Gate 2 aprueba el diff y la ausencia de dependencias prohibidas.
- Puerta 🛑 Human Acceptance para merge final a `develop`.

## What will be synchronized to Linear
- Issue Key: `BRI-183`
- Estado: In Progress / In Review al completar los cambios.
