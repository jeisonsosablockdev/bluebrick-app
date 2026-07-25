# SPEC-02 Implementation Artifact: Higiene de la Raíz del Monorepo (BRI-182)

## Overview
- **Issue Anchor**: `BRI-182`
- **SPEC Identifier**: `SPEC-02`
- **SPEC Branch**: `SPEC/jeisonsosa-bri-182-spec02-root-hygiene`
- **Parent Branch**: `refactor/jeisonsosa-BRI-182-alineacion-politicas-architect`
- **Primary Goal**: Limpiar la raíz del repositorio eliminando archivos temporales o no autorizados y reforzando las reglas de verificación en CI.

## Technical Scope & Implementation Plan
1. Identificar y eliminar archivos huérfanos/sueltos en la raíz:
   - `PR_BODY.md`
   - `pr-body.md`
   - `linear_metadata.json`
2. Actualizar el script de verificación `scripts/ci/check-monorepo-structure.sh` para detectar y fallar si existen archivos sueltos no autorizados en la raíz.
3. Crear test de gobernanza de raíz `tests/lib/root-hygiene-governance.test.ts`.

## Test Plan First (TDD Red -> Green)
- Fase RED: `tests/lib/root-hygiene-governance.test.ts` falla si los archivos huérfanos existen en la raíz.
- Fase GREEN: Tras eliminar los archivos, el test pasa a **GREEN**.

## Definition of Done for SPEC-02
- Archivos temporales eliminados de la raíz.
- `check-monorepo-structure.sh` valida la raíz limpiamente.
- Test `root-hygiene-governance.test.ts` pasa en **GREEN**.
