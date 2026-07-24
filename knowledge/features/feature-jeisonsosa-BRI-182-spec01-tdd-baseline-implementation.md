# SPEC-01 Implementation Artifact: TDD Baseline & Salvaguarda de Funcionalidades (BRI-182)

## Overview
- **Issue Anchor**: `BRI-182`
- **SPEC Identifier**: `SPEC-01`
- **SPEC Branch**: `SPEC/jeisonsosa-bri-182-spec01-tdd-baseline`
- **Parent Branch**: `refactor/jeisonsosa-BRI-182-alineacion-politicas-architect`
- **Primary Goal**: Crear la suite de pruebas de regresión TDD baseline para congelar el comportamiento actual de `/lib` antes de cualquier reestructuración física de archivos.

## Technical Scope & Implementation Plan
1. Crear el archivo de pruebas de regresión `tests/lib/refactor-regression-baseline.test.ts`.
2. Cubrir módulos funcionales clave en `/lib/`:
   - Autenticación y decisión post-auth (`auth-store.ts`, `auth-state.ts`, `app-auth.ts`, `post-auth-decision.ts`).
   - Módulos de Checkout y Compra (`checkout-service.ts`, `purchase-service.ts`, `purchase-anti-bot.ts`).
   - Módulos de Marketplace y Propiedades (`property-service.ts`, `property-marketplace-server.ts`).
   - Módulos de Observabilidad y Monitoreo Admin (`admin-metrics-client.ts`, `observability`).
3. Verificar que la suite Vitest ejecute en **GREEN** y proporcione una línea base sólida.

## Test Plan First (TDD Red -> Green)
- Ejecutar `pnpm test tests/lib/refactor-regression-baseline.test.ts` asegurando 100% de pasaje positivo.

## Definition of Done for SPEC-01
- Suite `refactor-regression-baseline.test.ts` integrada y pasando en Vitest.
- Cero alteraciones a archivos de producción en esta SPEC.
- `pnpm validate` ejecuta limpiamente.
