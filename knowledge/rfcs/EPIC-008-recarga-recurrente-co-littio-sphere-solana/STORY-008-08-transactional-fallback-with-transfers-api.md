# STORY-008-08-transactional-fallback-with-transfers-api

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-08-transactional-fallback-with-transfers-api`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Si Onramper Accounts no esta habilitado, el producto pierde continuidad operativa sin una ruta de fallback equivalente.
- Why now:
  Es requisito de resiliencia previo al QA/rollout final.
- Constraints:
  - `blockedBy`: `STORY-008-07`.
  - UX de `Recargar cuenta` debe mantenerse sin cambios perceptibles.
  - Fallback debe mapear lifecycle a los mismos estados del modulo.
  - Debe conservar trazabilidad y cadena de custodia equivalente al motor principal.
- Affected paths:
  - `app/api/**` motor principal/fallback selection
  - `lib/**` adapters Transfers API
  - `app/**` estado y mensajes sin cambio de UX

## Sphere References (Story Scope)
- `/platform/transfers-api`
- `/api-reference/transfer/post`
- `/api-reference/transfer/get`
- `/api-reference/transfer/get-id`
- `/platform/transfer-lifecycle`

## Existing Infrastructure Reuse (Project)
- `app/api/webhooks/helius/purchase/route.ts` (patrón de evento procesable + idempotencia)
- `db/migrations/011_purchase_webhook_events.sql` (dedupe por `event_fingerprint`/`event_id`)
- `lib/purchase-flow-trace.ts` (identificador de flujo para operación multi-motor)

## Proposal
- Approach summary:
  Introducir fallback de motor transaccional con Transfers API conservando UI, estados y trazabilidad.
- Technical design:
  - Estrategia de seleccion de motor: `onramper` primario, `transfers_api` fallback.
  - Crear transfer por recarga y exponer `depositAccount`/instrucciones por operacion.
  - Mapear transfer lifecycle a state machine interna existente.
  - Manejo de reintentos, fallos y refunds sin romper trazabilidad.
  - Persistir `engine_used` (`onramper` | `transfers_api`) y `engine_reference_id` por operación.
  - Transparencia total al usuario (sin cambio de interfaz).
- Alternatives considered:
  - Deshabilitar recarga si falla Onramper: rechazado por indisponibilidad de producto.
- Tradeoffs:
  - Doble integracion backend, mayor resiliencia operacional.

## Critique
- Reviewer(s):
  - `backend`
  - `operations`
- Critical findings:
1. Debe existir logging que indique motor usado por operacion.
2. Estados fallback deben mantener paridad semantica con flujo principal.
3. Politica de retries/refunds debe estar alineada con compliance.
4. El cambio de motor no puede romper el modelo de eventos ni la reconciliación de estado.
- Blocking concerns:
  No ejecutar `STORY-008-09` sin parity funcional validada del fallback.

## Resolution
- Final approach after critique:
  Activar fallback con paridad de UX y de estados, con trazabilidad de motor.
- Changes accepted:
  - Strategy primary/fallback en backend.
  - Mapping unico de estados para ambos motores.
- Changes rejected (with rationale):
  - Mostrar UI distinta segun motor (rechazado por incoherencia UX).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere validar runbook operativo de failover.

## Status
- Current status: `draft`
- Next action:
  Aprobar fallback y paridad de estados para desbloquear `STORY-008-09`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Seleccion de motor y mapping de lifecycle.
- Integration tests:
  - Escenarios de failover, retry y refund.
  - Paridad de estados y payload de auditoría entre motor primario y fallback.
- Devnet validation (if applicable):
  - Validar operaciones reales en flujo fallback con trazabilidad completa.
- Responsive QA (if applicable):
  - Confirmar que UI no cambia perceptiblemente entre motores.

## Traceability
- Related issue(s): `BRI-35`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
