# SPEC-05 Implementation Artifact: Gobernanza Automatizada en CI & Validación Final (BRI-182)

## Overview
- **Issue Anchor**: `BRI-182`
- **SPEC Identifier**: `SPEC-05`
- **SPEC Branch**: `SPEC/jeisonsosa-bri-182-spec05-architecture-ci-governance`
- **Parent Branch**: `refactor/jeisonsosa-BRI-182-alineacion-politicas-architect`
- **Primary Goal**: Automatizar la verificación de arquitectura de 4 capas en CI para evitar futuras violaciones o acumulación de archivos sueltos en `/lib/`.

## Technical Scope & Implementation Plan
1. Crear el script de CI `scripts/ci/check-layered-architecture.sh`:
   - Validar que no existan archivos `.ts` o `.tsx` directamente en la raíz de `/lib/` (excepto re-exports autorizados si los hay).
   - Validar que las importaciones respeten los límites de las 4 capas (ej. Presentation no importa DB ni Web3 transaction builders).
2. Integrar `check-layered-architecture.sh` dentro del comando `pnpm validate` en `package.json`.
3. Ejecutar la validación completa del repositorio.

## Test Plan First (TDD Red -> Green)
- Ejecutar `bash ./scripts/ci/check-layered-architecture.sh` y confirmar pasaje exitoso (código 0).
- Ejecutar `pnpm validate`.

## Definition of Done for SPEC-05
- Script `scripts/ci/check-layered-architecture.sh` creado y probado.
- Integración en `package.json` completada.
- `pnpm validate` ejecuta 100% en **GREEN**.
- Registrado de la historia de desarrollo en `SPEC DEVELOPMENT HISTORY`.
