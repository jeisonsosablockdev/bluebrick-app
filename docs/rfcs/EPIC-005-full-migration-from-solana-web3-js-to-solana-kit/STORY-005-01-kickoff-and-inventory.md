# STORY-005-01-kickoff-and-inventory

## Metadata
- Epic: `EPIC-005-full-migration-from-solana-web3-js-to-solana-kit`
- Story ID: `STORY-005-01-kickoff-and-inventory`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Context
- Problem:
  La base de codigo contiene dependencias y tipos de `@solana/web3.js` distribuidos en varias capas, lo que bloquea una migracion segura si no existe un inventario canónico y priorizacion por riesgo.
- Why now:
  La migracion del stack Solana es requisito tecnico del epic y debe ejecutarse sin regresion funcional en auth/firma/mint/purchase/RPC.
- Constraints:
  - Sin cambio de UX ni logica de negocio.
  - Sin degradar seguridad de firmas/verificacion ni trust boundaries.
  - Devnet-only para validaciones de flujos criticos.
- Affected paths:
  - `app/**`
  - `components/**`
  - `lib/**`
  - `tests/**`
  - `e2e/**`
  - `docs/rfcs/EPIC-005-*/**`

## Proposal
- Approach summary:
  Ejecutar baseline tecnico reproducible de referencias `@solana/web3.js`, clasificar por primitive y criticidad, y fijar orden de migracion por historias con checklist de salida.
- Technical design:
  - Baseline obligatorio:
    - `rg -l "@solana/web3\\.js" app lib components tests e2e`
  - Clasificacion por primitive usada:
    - `Connection`, `PublicKey`, `VersionedTransaction`, `Keypair`, `clusterApiUrl`.
  - Clasificacion de riesgo por flujo:
    - Alto: auth/signature, purchase pipeline, admin transaction pipelines.
    - Medio: utilities RPC/address parsing.
    - Bajo: tests/e2e helpers y docs.
  - Definir matriz de migracion origen→destino (`web3.js` → `@solana/kit` / `@solana/web3-compat` en borde temporal).
- Alternatives considered:
  - Migracion big-bang en un solo PR: rechazada por riesgo alto de regresion.
- Tradeoffs:
  - La migracion por fases incrementa tiempo total, pero reduce riesgo de corte y facilita rollback.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. El inventario debe cubrir codigo de producto, pruebas y E2E para evitar falsas sensaciones de cierre.
2. Debe existir definicion explicita de compatibilidad temporal y su fecha de retiro.
3. Debe definirse criterio objetivo de cierre (`0` referencias directas a `@solana/web3.js`).
- Blocking concerns:
  Ninguno. Aprobada como historia fundacional.

## Resolution
- Final approach after critique:
  Se adopta baseline reproducible + matriz de riesgo + criterio de cierre con grep estricto.
- Changes accepted:
  - Inventario de 19 archivos como baseline inicial del epic.
  - Definicion de secuencia de migracion por historias 02-05.
- Changes rejected (with rationale):
  - Ejecutar cambios de codigo de producto dentro de la historia de inventario (rechazado para mantener separacion de fases).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Historia aprobada como gate de entrada obligatorio para el rollout de migracion.

## Status
- Current status: `approved`
- Next action:
  Ejecutar `STORY-005-02` para construir capa foundation y adapters de compatibilidad.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - N/A (historia de RFC/inventario).
- Integration tests:
  - N/A (historia de RFC/inventario).
- Devnet validation (if applicable):
  - N/A en esta historia.
- Responsive QA (if applicable):
  - N/A en esta historia.

## Traceability
- Related issue(s): `EPIC-005`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
