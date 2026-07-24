---
type: RFC
title: STORY- 011 02 Admin Collections Read Model
description: STORY- 011 02 Admin Collections Read Model - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-02-admin-collections-read-model.md
---

# STORY-011-02-admin-collections-read-model

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-02-admin-collections-read-model`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-23`

## Context
- Problem:
  No existe un read model para poblar `/admin/collections` con proyectos realmente administrables por el admin autenticado. Hoy solo hay piezas separadas: `marketplace_entries`, `asset_mint_snapshots` y uploads ligados a `draftId`.
- Why now:
  La UI de Collections depende de un listado confiable antes de construir el editor visual. Si el listado no resuelve ownership y consistencia, toda la consola queda mal definida.
- Constraints:
  - Debe filtrar por admin autenticado server-side.
  - Debe validar consistencia entre entry de marketplace y snapshot on-chain.
  - Debe tolerar estados parciales/inconsistentes sin romper la página.
  - No debe introducir lógica de confianza del lado cliente.
- Affected paths:
  - `app/admin/collections/page.tsx`
  - `app/api/admin/collections/route.ts` (nuevo)
  - `lib/property-marketplace-server.ts`
  - `lib/core-candy-machine-snapshot-repository.ts`
  - `tests/api/*`

## Proposal
- Approach summary:
  Crear un read model server-side para listar colecciones propias del admin, enriquecidas con estado de validación y metadata suficiente para la UI de index.
- Technical design:
  - Introducir una consulta que parta de `marketplace_entries.created_by = actorPubkey`.
  - Cruzar por `collection_address` y/o `asset_mint_address` con `asset_mint_snapshots`.
  - Emitir para cada fila:
    - `entryId`
    - `title`
    - `coverImageUrl`
    - `collectionAddress`
    - `candyMachineAddress`
    - `updatedAt`
    - `validationState` (`linked | missing_snapshot | inconsistent | orphaned`)
    - `editableSections`
  - Exponer `GET /api/admin/collections`.
- Alternatives considered:
  - Filtrar solo por `marketplace_entries.created_by`.
    - Rechazado: no detecta entries huérfanas o inconsistentes.
  - Filtrar solo por `asset_mint_snapshots.created_by`.
    - Rechazado: no alcanza para listar entries reales publicadas en marketplace.
- Tradeoffs:
  - El cruce de fuentes agrega complejidad de consulta, pero reduce falsos positivos y mejora la experiencia operativa.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta decidir si entries inconsistentes deben mostrarse con warning o excluirse del listado principal.
2. Falta cerrar la prioridad de matching: `collectionAddress` vs `candyMachineAddress` cuando uno falte.
3. Falta decidir si el listado incluirá bootstrap metadata desde `form_snapshot`.
- Blocking concerns:
  - No aprobar la API sin contrato explícito de `validationState`.

## Resolution
- Final approach after critique:
  Aprobado. El read model cruzará `marketplace_entries` y `asset_mint_snapshots`. Las entries con bootstrap fallido o inconsistencias serán derivadas a la cola de revisión manual (`STORY-011-10`).
- Changes accepted:
  - El listado debe ser ownership-aware y consistency-aware.
- Changes rejected (with rationale):
  - Rechazado un listado “simple” solo con `marketplace_entries`.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado el contrato de matching dual. Se delegan los estados de error a la historia de Health (10).

## Status
- Current status: `implemented`
- Next action:
  Ninguna dentro de este story; la refinación visual quedó absorbida por `STORY-011-05`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Matching por `collectionAddress` y `candyMachineAddress`.
  - Clasificación correcta de `validationState`.
- Integration tests:
  - `GET /api/admin/collections` devuelve solo entries del admin.
  - Entries inconsistentes reciben el estado esperado.
- Devnet validation (if applicable):
  - Reutiliza datos persistidos; no requiere nuevas transacciones.
- Responsive QA (if applicable):
  - La UI que consuma este modelo deberá validarse en el story de UI.

## Traceability
- Related issue(s): `BRI-71`, `BRI-80`, `BRI-81`, `BRI-82`
- Related PR(s): `#129`, `#131`, `#132`
- Final commit hash(es): `02ee2f55cad2b0d1a88eb3b9c5ed87d7dd76252d` (`BRI-80`), `eef45769f83c819e7a86a39debf08a8742c1d301` (`BRI-81`), `6fcccd0a767cfc0eb20d30040657f124c28a92ac` (`BRI-82`)

## Implementation Progress
- `BRI-80` completed the server-side query ownership contract as the first slice of this story.
- `BRI-81` adds `GET /api/admin/collections` as a thin admin-only API layer over the read model, reusing the server-side ownership and `validationState` contract without duplicating matching logic.
- `BRI-82` consumes the approved list contract in `/admin/collections` with explicit `loading`, `error`, `empty`, and minimal `success` states, keeping the page read-only and intentionally simple.
- The read model now classifies marketplace rows as `linked`, `missing_snapshot`, or `inconsistent` by reconciling `marketplace_entries` against `asset_mint_snapshots`.
- In this codebase, `marketplace_entries.asset_mint_address` is treated as the persisted candy machine address for matching purposes.
- Only `linked` rows expose editable sections; error and partial-match rows remain non-editable and are delegated to later API/UI slices.
