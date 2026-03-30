# STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-01-deploy-and-mint-permanent-freeze-delegate-plugin`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-03-29`

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
- Current status: `approved`
- Next action:
  Ready for implementation.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
