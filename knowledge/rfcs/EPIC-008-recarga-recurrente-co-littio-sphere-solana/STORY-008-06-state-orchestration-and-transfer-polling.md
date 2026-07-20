---
type: RFC
title: STORY- 008 06 State Orchestration And Transfer Polling
description: STORY- 008 06 State Orchestration And Transfer Polling - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-06-state-orchestration-and-transfer-polling.md
---

# STORY-008-06-state-orchestration-and-transfer-polling

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-06-state-orchestration-and-transfer-polling`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Sin un estado interno de negocio consistente, la UI y backend pueden divergir y perder trazabilidad de operaciones.
- Why now:
  Es la capa de control central del MVP antes de riesgo/fallback/rollout.
- Constraints:
  - `blockedBy`: `STORY-008-05`.
  - Polling backend es baseline del MVP, pero el contrato de ingestión debe ser event-driven y `webhook-ready` desde el primer release.
  - Debe mapear estados Sphere a estados de negocio internos sin dependencia del origen del evento (`polling` o `webhook`).
  - Debe alinear patrón con EPIC-003/EPIC-006: webhook-first como objetivo, polling como redundancia.
- Affected paths:
  - `app/api/**` polling/state orchestration
  - `app/api/webhooks/**` adaptador futuro de ingestión de eventos provider
  - `lib/**` mapping y state machine
  - `db/migrations/**` ledger de eventos y proyecciones
  - `app/**` rendering etiquetas de estado

## Sphere References (Story Scope)
- `/api-reference/virtual-account/list-transfers`
- `/platform/transfer-lifecycle`
- `/platform/transfers-api`
- `/platform/reference/webhooks`
- `/platform/reference/webhooks/events`
- `/platform/reference/webhooks/set-up-webhook`
- `/platform/reference/webhooks/manage-webhook`
- `/api-reference/webhook/post`
- `/api-reference/webhook/get-id`
- `/api-reference/event/get-id`

## Existing Infrastructure Reuse (Project)
- `app/api/webhooks/helius/purchase/route.ts` (ingestión webhook + deduplicación)
- `db/migrations/011_purchase_webhook_events.sql` (modelo de evento inmutable y idempotencia por fingerprint/event_id)
- `lib/purchase-flow-trace.ts` (correlación de flujo y trazabilidad)
- `knowledge/purchase-tracing.md` (runbook operativo de investigación por trace id)
- `knowledge/devnet-proof.md` (evidencia blockchain final para estados terminales)

## Proposal
- Approach summary:
  Definir state machine de negocio como proyección de un ledger de eventos inmutable, con polling como primer productor de eventos y webhook como segundo productor compatible.
- Technical design:
  - Estados internos iniciales:
    - `needs_verification`
    - `ready_to_fund`
    - `awaiting_deposit`
    - `funds_detected`
    - `converting_to_usdc`
    - `sent_to_wallet`
    - `under_review`
    - `refunded`
    - `failed`
  - Contrato de ingestión agnóstico a fuente:
    - `source_type`: `polling` | `webhook`
    - `source_event_id` y/o `event_fingerprint`
    - `received_at`, `occurred_at`, `raw_payload`
  - Polling por virtual account y reconciliacion incremental (MVP).
  - Mapeo deterministico de lifecycle Sphere -> estado interno (función pura y versionada).
  - Persistencia append-only de eventos + proyección de estado derivada (no mutar historial).
  - Reconciliacion final con evidencia on-chain de recepcion de USDC antes de cerrar `sent_to_wallet`.
  - Regla de transiciones monotónicas para evitar regresiones por eventos fuera de orden.
- Alternatives considered:
  - Depender de webhooks desde el inicio: rechazado para MVP por complejidad operativa inicial.
  - Modelo solo-polling sin contrato de eventos: rechazado por deuda técnica y alto costo de migración.
- Tradeoffs:
  - Polling consume mas ciclos backend, pero reduce riesgo de integracion inicial.
  - Diseño event-driven agrega disciplina de modelado, pero evita refactor estructural al activar webhooks.

## Critique
- Reviewer(s):
  - `backend`
  - `operations`
- Critical findings:
1. State machine debe ser deterministicamente reproducible.
2. Debe existir timeout/retry policy por estado intermedio prolongado.
3. Se requiere correlacion entre transfer externa y evidencia on-chain.
4. No se acepta diseño acoplado a polling que impida cutover limpio a webhook-first.
- Blocking concerns:
  Sin contrato de estados aprobado no avanzar a `STORY-008-07`.

## Resolution
- Final approach after critique:
  Aprobar state machine de 9 estados con polling como fuente inicial del MVP y contrato de eventos listo para webhook-first.
- Changes accepted:
  - Persistencia de eventos append-only y auditoria por transicion.
  - Reconciliacion on-chain obligatoria antes de `sent_to_wallet` final.
  - Contrato unificado de ingestión (`polling`/`webhook`) con deduplicación idempotente.
- Changes rejected (with rationale):
  - Estados ambiguos dependientes de UI (rechazado por inconsistencia backend).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Validar timeouts/escalamiento a `under_review` y runbook de cutover `polling -> webhook-first`.

## Status
- Current status: `draft`
- Next action:
  Cerrar contrato state-machine/event ledger para desbloquear `STORY-008-07`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Mapping lifecycle->estado, transiciones invalidas y terminales.
  - Ordenamiento/out-of-order + deduplicación por `source_event_id`/`event_fingerprint`.
- Integration tests:
  - Polling continuo + persistencia de eventos + reconciliacion.
  - Prueba de paridad de proyección al cambiar `source_type` de `polling` a `webhook` con mismo payload lógico.
- Devnet validation (if applicable):
  - Evidencia real de recepcion USDC y cambio de estado final.
  - Registro en `knowledge/devnet-proof.md` de firmas on-chain usadas para confirmar estados terminales.
- Responsive QA (if applicable):
  - Etiquetas de estado y timeline legibles en mobile/desktop.

## Traceability
- Related issue(s): `BRI-33`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
