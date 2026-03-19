# STORY-002-03-deploy-core-candy-machine

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-03-deploy-core-candy-machine`
- Status: `in-review` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-16`

## Context
- Problem:
  Falta especificación ejecutable para desplegar Candy Machine Core con guards mínimos y carga de items para dejar el mint listo.
- Why now:
  Sin esta historia no existe transición operativa entre setup UI y mint real.
- Constraints:
  - Red: devnet.
  - Sin simulación/mocks.
  - Guards mínimos: `startDate` + `solPayment(0.00001 SOL)`.
- Affected paths:
  - `/app` (server actions / API routes para deploy)
  - Posibles utilidades compartidas de mint en `packages/`
  - `docs/architecture.md`, `docs/authority-model.md`, `docs/state-machine.md`, `docs/threat-model.md`, `docs/devnet-proof.md`, `docs/nft-spec.md`

## Proposal
- Approach summary:
  Orquestar `Deploy Mint` en etapas: crear candy machine, configurar guards mínimos, cargar items, marcar estado ready-to-mint.
- Technical design:
  - Input: prefill del paso 1 (`cover/uri`, metadata base, `quantity`).
  - Deploy:
    1. Crear Core Candy Machine.
    2. Configurar guards mínimos:
       - `startDate`
       - `solPayment = 0.00001 SOL`
    3. Cargar items según cantidad.
    4. Guardar estado mínimo del job (`deploying`, `ready`, `failed`).
- Alternatives considered:
  - Deploy manual fuera del flujo UI (rechazado por objetivo de módulo único).
  - Agregar guards extra desde inicio (rechazado para mantener prueba mínima funcional).
- Tradeoffs:
  - Pro: menor complejidad de arranque y validación rápida.
  - Con: protección económica/comercial limitada en versión inicial.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Debe asegurarse idempotencia por `jobId` para evitar dobles deploys.
2. El valor de `solPayment` debe ser exacto y visible en UI de confirmación.
3. Se requiere evidencia de account state real tras deploy.
- Blocking concerns:
  Pendiente definir estrategia exacta de chunking para carga de items en cantidades altas.

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
  Aprobar diseño de deploy + persistencia mínima de estado.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Construcción de config de guards (`startDate`, `solPayment`).
  - Serialización de payload para creación/carga de items.
  - Transiciones de estado del job de deploy.
- Integration tests:
  - Deploy completo desde input del formulario pre-cargado.
  - Job queda en estado `ready-to-mint` al finalizar.
- Devnet validation (if applicable):
  - Crear candy machine real en devnet.
  - Confirmar signatures on-chain.
  - Leer estado real de cuenta al finalizar deploy.
- Responsive QA (if applicable):
  `N/A` principal (backend + orquestación).

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`

## Official Sources
- Core Candy Machine overview: https://developers.metaplex.com/smart-contracts/core-candy-machine
- Guards: https://developers.metaplex.com/smart-contracts/core-candy-machine/guards
