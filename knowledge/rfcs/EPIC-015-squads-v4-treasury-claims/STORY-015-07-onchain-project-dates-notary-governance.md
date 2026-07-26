---
type: RFC
title: STORY-015-07 On-Chain Project Dates Notary Governance & Engine Integration
description: Especificación técnica para la eliminación explícita y desmantelamiento de cualquier endpoint API de modificación directa de fechas, asegurando que solo el contrato on-chain y Squads puedan alterar las fechas.
tags: [rfcs, solana, squads, notary, governance, project-dates, project-end-at, pda-direct-read, read-model, ui, api-security]
timestamp: 2026-07-25T19:40:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance.md
---

# STORY-015-07 On-Chain Project Dates Notary Governance & Engine Integration

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-07-onchain-project-dates-notary-governance`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: Es imperativo garantizar que NO exista ningún endpoint API o ruta residual (ej. `PATCH /api/admin/collections/[id]`) que acepte campos de fechas como `project_start_at` o `project_end_at` para modificarlos directamente en la base de datos Postgres.
- **Why now**: Eliminar completamente esa debilidad de seguridad de la API y garantizar que la única vía de actualización sea la transacción multisig aprobada por el comité en Squads v4.
- **Constraints**: Integración completa con el SDK `@sqds/multisig` y `@solana/kit`.
- **Affected paths**: `lib/admin/collection-patch-payload.ts`, `app/api/admin/collections/[id]/route.ts`, `lib/distributions/distribution-engine.ts`, `app/admin/collections/`, `app/admin/notifications/`, `app/admin/treasury/squads/`.

## Technical Specification

### 1. PROHIBICIÓN Y ELIMINACIÓN EXPLÍCITA EN LA API DE COLECCIONES
- **Validación Rígida en `collection-patch-payload.ts`**:
  - Los campos `project_start_at` y `project_end_at` quedan clasificados formalmente como **`IMMUTABLE_PROJECT_DATE_FIELDS`**.
  - Si un usuario o atacante envía un cuerpo JSON en `PATCH /api/admin/collections/[id]` conteniendo campos de fechas, el validador rechaza la petición inmediatamente con el código de error `400 IMMUTABLE_PROJECT_DATE_FIELD`.
- **Cero Mutación Directa en DB**: No existe ningún código en los repositorios de backend que altere las columnas de fechas en Postgres desde peticiones REST directas.

### 2. LECTURA DIRECTA DE LA PDA NOTARIO EN EL MOTOR DE CÁLCULO (`distribution-engine.ts`)
- La función `calculateDistributionPreparation` consulta vía RPC la PDA Notario `ProjectConfigPDA` en Solana Devnet:
  ```typescript
  const onChainConfig = await fetchProjectConfigPDAOnChain(input.scope.collectionAddress);
  const projectStartMs = onChainConfig.projectStartAtMs;
  const projectEndMs = onChainConfig.projectEndAtMs;
  ```
- Toda la matemática de devengo por tiempo de staking se calcula utilizando estrictamente las fechas leídas directamente desde la PDA de Solana.

### 3. POSTGRES COMO CACHÉ INFORMATIVO DE LECTURA (Read-Model Only)
- Las columnas de fechas en Postgres sirven exclusivamente como una copia informativa de lectura rápida para renderizar la UI.
- La base de datos Postgres **únicamente sincroniza las fechas cuando el listener indexador confirma que la PDA Notario en Solana fue modificada tras la ejecución de la propuesta multisig de Squads v4**.

### 4. FLUJO UI/UX DE GOBERNANZA
1. **Solicitud de Cambio en `/admin/collections/[id]`**: Llama a `POST /api/admin/collections/[id]/date-change-request` registrando la solicitud en estado `PENDING_MULTISIG`. La API no modifica Postgres.
2. **Notificación al Comité en `/admin/notifications`**: Alerta destacada con el botón **"Promover a Propuesta Squads"**.
3. **Votación Multisig en `/admin/treasury/squads`**: Propuesta desplegada para firma con Phantom alcanzando el umbral $N$ de $M$.

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Campos `project_start_at` y `project_end_at` prohibidos explícitamente en el validador `collection-patch-payload.ts`.
  - [ ] `distribution-engine.ts` leyendo exclusivamente desde Solana RPC.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
