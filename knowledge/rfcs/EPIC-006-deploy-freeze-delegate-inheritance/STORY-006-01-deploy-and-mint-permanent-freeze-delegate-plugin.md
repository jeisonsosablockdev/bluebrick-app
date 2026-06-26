# STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Falta formalizar en deploy/mint la herencia de `Permanent Freeze Delegate`.
- Why now:
  Se requiere que freeze/unfreeze esté controlado por `Permanent Freeze Delegate` con firma multisig, evitando dependencia del owner individual.
- Constraints:
  - Devnet only.
  - Sin mocks/simulación en validación final.
  - Sin cambios de UI.
  - Freeze/unfreeze requiere aprobación de Squads multisig.

## Proposal
- Approach summary:
  Configurar `Permanent Freeze Delegate` como autoridad operativa de freeze/unfreeze y ejecutar esas operaciones mediante multisig.
- Technical design:
  1. Definir autoridad de freeze operativa en `Permanent Freeze Delegate`.
  2. Configurar en deploy/mint la capacidad de freeze coherente con ese modelo.
  3. Verificación on-chain por asset tras mint.
  4. Verificación tras transfer: authority de freeze se mantiene en delegate (no en owner).
  5. Registrar eventos de freeze/unfreeze para auditoría.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-29`
- Decision owner: `staff-engineer`

## Status
- Current status: `implemented`
- Next action:
  Cierre documental y seguimiento operativo en EPIC-007 para casos de recovery.

## Devnet Evidence
- Referencia de prueba compartida con STORY-006-02 (el deploy fija ambos delegados permanentes):
  - `knowledge/features/feature-nft-permanent-transfer-delegate.md`
  - Transaction: `i5JG91SZbgU9YBdJMpT3y5oDhWFPVaJhseg71bsDnGM81bXk9WVCGNwyafnbCX9tgpFdiQems4XLNZLipjyMgeJ`

## Traceability
- Related issue(s): `EPIC-006 / STORY-006-01`
- Related PR(s):
  - `#81` (mergeado; integración en flujo de deploy/mint con freeze delegate permanente)
  - `#67` y `#85` (cerrados/supersedidos)
- Final commit hash(es):
  - `3e893036692459219ad46853c63d0f1d1acc9e95` (merge commit PR #81)
