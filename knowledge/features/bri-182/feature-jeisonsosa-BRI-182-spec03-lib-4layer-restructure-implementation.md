# SPEC-03 Implementation Artifact: Reestructuración de 4 Capas en `/lib` (BRI-182)

## Overview
- **Issue Anchor**: `BRI-182`
- **SPEC Identifier**: `SPEC-03`
- **SPEC Branch**: `SPEC/jeisonsosa-bri-182-spec03-lib-4layer-restructure`
- **Parent Branch**: `refactor/jeisonsosa-BRI-182-alineacion-politicas-architect`
- **Primary Goal**: Crear la estructura física de 4 capas dentro de `/lib/` y reubicar los 74 archivos planos a sus carpetas correspondientes sin romper ningún contrato de importación.

## Technical Scope & Implementation Plan
1. Crear carpetas canónicas en `/lib/`:
   - `/lib/hooks/` (Layer 2: Custom React Hooks)
   - `/lib/state/` (Layer 2: Zustand & Client State Stores)
   - `/lib/pipelines/` (Layer 3: Domain Pure Functions & Pipelines)
   - `/lib/infrastructure/` (Layer 4: DB, RPC Clients, Pinata, Airwallex, WorkOS)
2. Reubicar archivos planos de `/lib/` hacia sus carpetas correspondientes.
3. Actualizar exhaustivamente las sentencias `import` en toda la aplicación (`/app`, `/components`, `/tests`, `/scripts`).
4. Verificar que las pruebas TDD baseline de `SPEC-01` sigan pasando al 100%.

## Test Plan First (TDD Red -> Green)
- Ejecutar `tests/lib/refactor-regression-baseline.test.ts` y toda la suite Vitest durante la reubicación para asegurar cero regresiones.

## Definition of Done for SPEC-03
- Los 74 archivos planos de `/lib/` clasificados en sus 4 capas correspondientes.
- Cero rutas rotas o errores de importación en `pnpm typecheck` y `pnpm lint`.
- Suite Vitest pasando en **GREEN**.
