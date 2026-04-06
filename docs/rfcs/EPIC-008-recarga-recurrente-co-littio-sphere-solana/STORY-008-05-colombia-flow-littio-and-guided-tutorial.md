# STORY-008-05-colombia-flow-littio-and-guided-tutorial

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-05-colombia-flow-littio-and-guided-tutorial`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Sin guia contextual del flujo Colombia (`COP -> USD/ACH -> USDC`) los usuarios fallan en fondeo y dependen de soporte manual.
- Why now:
  Tras tener cuenta dedicada, se debe aterrizar el journey operativo dentro del tab de recarga.
- Constraints:
  - `blockedBy`: `STORY-008-04`.
  - El flujo debe mantenerse dentro de `Profile > Recargar cuenta`.
  - Debe incluir advertencias de seguridad y uso por titular verificado.
  - Debe aplicar matriz unificada de errores definida en `STORY-008-01`.
- Affected paths:
  - `app/**` bloques de instrucciones/tutorial
  - `docs/features/*.md`

## Sphere References (Story Scope)
- `/platform/onramper-accounts`
- `/platform/onramper-accounts/guide`
- `/platform/supported-rails-currencies`
- `/platform/transfer-lifecycle`

## Existing Infrastructure Reuse (Project)
- `docs/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-01-basic-nft-purchase.md` (estandar de contrato de errores UX)
- `docs/purchase-tracing.md` (flujo de soporte con trace id)
- `docs/features/*.md` (plantillas de feature-note para cambios iterativos)

## Proposal
- Approach summary:
  Integrar tutorial guiado y checklist operativo de Littio dentro de Recargar cuenta.
- Technical design:
  - Paso 1: instruccion clara para cargar COP en Littio.
  - Paso 2: instruccion para enviar USD por ACH a la cuenta de recarga dedicada.
  - Render de tutorial/video embebido + checklist visible.
  - Mensajes de seguridad: cuenta exclusiva del titular verificado.
  - Ayudas contextuales para reducir errores de cuenta/rail.
  - Estados de error orientados a accion (ej. `deposit_not_found`, `amount_mismatch`, `third_party_deposit_under_review`, `network_delay`) con siguiente paso claro.
- Alternatives considered:
  - Documentacion externa separada: rechazado por friccion y abandono del flujo.
- Tradeoffs:
  - Mayor densidad informativa en UI, menor error operacional.

## Critique
- Reviewer(s):
  - `product`
  - `operations`
- Critical findings:
1. El paso a paso debe ser breve y accionable, sin lenguaje bancario complejo.
2. Debe quedar claro que no se aceptan depositos de terceros sin revision.
3. Tutorial debe convivir con estados del modulo sin bloquear lectura.
4. Las pantallas de error no deben desalinearse del contrato backend de codigos y mensajes.
- Blocking concerns:
  Sin esta historia no se habilita `STORY-008-06` porque faltaria contexto de uso real.

## Resolution
- Final approach after critique:
  Mantener tutorial integrado al flujo con checklist, video y advertencias de seguridad.
- Changes accepted:
  - UX guiada en secuencia de 2 pasos + estado.
  - Mensajeria explicita de titularidad y seguridad.
- Changes rejected (with rationale):
  - Dejar instrucciones en FAQ fuera del producto (rechazado por baja conversion).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere validacion final de copy operativo CO.

## Status
- Current status: `draft`
- Next action:
  Aprobar experiencia guiada para desbloquear `STORY-008-06`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Render condicional de tutorial/checklist por estado/país.
  - Consistencia de `error_code -> copy -> CTA` en estados del tutorial.
- Integration tests:
  - Flujo completo de UI de instrucciones sin soporte externo.
- Devnet validation (if applicable):
  - N/A directo en esta historia (validacion transaccional en fases posteriores).
- Responsive QA (if applicable):
  - Contenido tutorial usable a 320/375/768/1024 sin overflow.

## Traceability
- Related issue(s): `BRI-32`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
