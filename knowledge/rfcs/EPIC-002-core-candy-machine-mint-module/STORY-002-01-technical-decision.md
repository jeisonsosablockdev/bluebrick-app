# STORY-002-01-technical-decision

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-01-technical-decision`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-16`

## Context
- Problem:
  Necesitamos una decisión técnica explícita para el módulo de mint: elegir estándar/programa, guardas mínimas y condiciones de validación real en devnet.
- Why now:
  El flujo funcional inicia en `/admin/assets/new` y requiere continuidad inmediata hacia mint real, sin abrir otro módulo ni postergar definición técnica.
- Constraints:
  - Devnet only.
  - Sin simulación/mocks/fake signatures.
  - Guard mínimo inicial: `startDate + solPayment`.
  - Cobro simbólico: `0.00001 SOL` por NFT.
  - Cantidad variable (`1`, `10`, `1000`, ...).
- Affected paths:
  - `knowledge/rfcs/EPIC-002-core-candy-machine-mint-module/*`
  - `/app/admin/assets/new`
  - `/app` (módulo de mint y orquestación UI/server)

## Proposal
- Approach summary:
  Usar **Metaplex Core Candy Machine** (no Candy Machine v3) para alinear la solución con Core + plugins y evitar deuda técnica de migración.
- Technical design:
  - Programa de mint: Core Candy Machine.
  - Flujo: Create Asset -> Continue to Mint -> Deploy -> Mint -> Reconcile.
  - Guards mínimos de arranque:
    - `startDate`
    - `solPayment = 0.00001 SOL`
- Alternatives considered:
  - Candy Machine v3 (descartado por desalineación con Core/plugins objetivo).
  - Mint custom sin Candy Machine (descartado por mayor complejidad operativa y de seguridad).
- Tradeoffs:
  - Pro: alineación directa con Core/plugin ecosystem.
  - Pro: menor fricción para extender guards y lógica de mint.
  - Con: menor madurez histórica comparado con flujos legacy.

## Critique
- Reviewer(s):
  - `jaymusicmachine` (product/engineering)
- Critical findings:
1. Se debe bloquear explícitamente uso de Candy Machine v3 en este epic para evitar bifurcación.
2. Debe existir evidencia de mint real devnet con signatures confirmadas.
3. El guard set inicial debe mantenerse mínimo para validar funcionalidad antes de hardening.
- Blocking concerns:
  Ninguna para iniciar RFC de historias hijas del epic.

## Resolution
- Final approach after critique:
  Se aprueba Core Candy Machine con guardas mínimas (`startDate + solPayment`) y cobro simbólico (`0.00001 SOL`) para validación funcional E2E.
- Changes accepted:
  - Base técnica única: Core Candy Machine.
  - Devnet real + confirmación on-chain obligatoria.
  - Alcance restringido a módulo mint.
- Changes rejected (with rationale):
  - Candy Machine v3: rechazado por falta de alineación con Core/plugins.
  - Incluir marketplace/tesorería/analytics en este epic: rechazado por scope creep.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-16`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Decisión técnica cerrada. Historias de implementación del epic pueden avanzar bajo esta base.

## Status
- Current status: `approved`
- Next action:
  Crear y aprobar historias de implementación (`STORY-002-02` a `STORY-002-05`) antes de codificar.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  `N/A` (story de decisión técnica).
- Integration tests:
  `N/A` (story de decisión técnica).
- Devnet validation (if applicable):
  Se define como requisito en historias de implementación.
- Responsive QA (if applicable):
  Se define en `STORY-002-02`.

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`

## Official Sources
- Core Candy Machine overview: https://developers.metaplex.com/smart-contracts/core-candy-machine
- Minting: https://developers.metaplex.com/smart-contracts/core-candy-machine/mint
- Guards: https://developers.metaplex.com/smart-contracts/core-candy-machine/guards
