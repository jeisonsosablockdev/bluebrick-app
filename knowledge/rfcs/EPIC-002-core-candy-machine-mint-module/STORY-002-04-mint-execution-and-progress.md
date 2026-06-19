---
type: RFC
title: STORY- 002 04 Mint Execution And Progress
description: STORY- 002 04 Mint Execution And Progress - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-002-core-candy-machine-mint-module/STORY-002-04-mint-execution-and-progress.md
---

# STORY-002-04-mint-execution-and-progress

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-04-mint-execution-and-progress`
- Status: `in-review` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-16`

## Context
- Problem:
  No está definido cómo ejecutar mint por cantidad variable y mostrar progreso con signatures reales durante la ejecución.
- Why now:
  Es la validación funcional central del módulo: mintear NFTs reales a partir del setup previo.
- Constraints:
  - Cantidad definida por formulario (`1`, `10`, `1000`, ...).
  - Mostrar progreso durante ejecución.
  - Exponer tx signatures confirmadas.
- Affected paths:
  - `/app` (orquestación de mint y UI de progreso)
  - Documentación de prueba devnet (`docs/devnet-proof.md`)

## Proposal
- Approach summary:
  Ejecutar mint por lotes/iteraciones según cantidad, con reporte de progreso en tiempo real del job.
- Technical design:
  - Input: candy machine `ready-to-mint` + `quantity`.
  - Ejecución:
    1. Disparar mint iterativo.
    2. Confirmar cada tx.
    3. Persistir avance (`mintedCount`, `failedCount`, signatures[]).
    4. Renderizar progreso y estado final en UI.
- Alternatives considered:
  - Mint en una sola transacción gigante (rechazado por límites y fragilidad).
  - Ocultar progreso y solo mostrar resultado final (rechazado por DX y trazabilidad).
- Tradeoffs:
  - Pro: observabilidad y recuperación más clara.
  - Con: mayor complejidad de estado/actualización de progreso.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Debe haber estrategia de throttling para evitar rate limit RPC.
2. Los errores parciales deben quedar trazados por índice/item.
3. La UI debe separar claramente `pending`, `confirmed`, `failed`.
- Blocking concerns:
  Pendiente definir tamaño de lote inicial para cantidades altas.

## Resolution
- Final approach after critique:
  `TBD` tras review.
- Changes accepted:
  `TBD`
- Changes rejected (with rationale):
  `TBD`

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-03-16`
- Decision owner: `TBD`
- Approval notes:
  Pendiente review.

## Status
- Current status: `in-review`
- Next action:
  Aprobar estrategia de ejecución por lotes y formato de progreso.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Cálculo de progreso (`minted/total`).
  - Manejo de errores parciales sin perder estado.
  - Agregado de signatures por transacción confirmada.
- Integration tests:
  - Ejecución de mint según cantidad de entrada.
  - Visualización de progreso en UI durante ejecución.
- Devnet validation (if applicable):
  - Mint real de `N` NFTs.
  - Todas las tx confirmadas y listadas en UI.
- Responsive QA (if applicable):
  - UI de progreso usable en 320/375/768/1024.

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`

## Official Sources
- Minting: https://developers.metaplex.com/smart-contracts/core-candy-machine/mint
