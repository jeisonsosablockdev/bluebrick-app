# STORY-007-01-recovery-workflow-specification

## Metadata
- Epic: `EPIC-007-offline-recovery-protocol`
- Story ID: `STORY-007-01-recovery-workflow-specification`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-29`
- Last Updated: `2026-03-29`

## Context
- Problem:
  El protocolo de recuperación no está especificado con suficiente rigor legal, operativo y de seguridad.
- Why now:
  Es prerequisito para aprobar recovery con `Permanent Transfer Delegate`.
- Constraints:
  - Verificación primaria por Stripe Identity.
  - Documento notariado obligatorio.
  - Contacto por número telefónico previamente autenticado.
  - Junta de compliance como aprobador final offline.
  - SLA máximo de 90 días.

## Proposal
- Approach summary:
  Definir flujo state-machine de recuperación con evidencia documental y trazabilidad completa.
- Technical design:
  1. Estados del caso (`submitted`, `identity_passed`, `compliance_review`, `dispute_window`, `approved_for_multisig`, `closed`, `rejected`).
  2. Reglas de transición por estado y responsable.
  3. Lista de evidencia requerida por caso.
  4. Criterios de rechazo.
  5. Integración de salida hacia ejecución on-chain multisig.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-03-29`
- Decision owner: `TBD`

## Status
- Current status: `draft`
- Next action:
  Completar especificación de estados, runbook compliance y plantilla de expediente.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
