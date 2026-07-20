---
type: RFC
title: STORY- 003 03 Transaction Integrity And Idempotency
description: STORY- 003 03 Transaction Integrity And Idempotency - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-03-transaction-integrity-and-idempotency.md
---

# STORY-003-03-transaction-integrity-and-idempotency

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-03-transaction-integrity-and-idempotency`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-20`

## Context
- Problem:
  En compra de NFTs puede haber doble ejecucion por reintentos de red, refresh o clicks repetidos.
- Why now:
  Es clave evitar estados inconsistentes y duplicados antes de abrir volumen de compras.
- Constraints:
  - No confiar en estado cliente.
  - Confirmacion objetivo en `confirmed`.
  - Devnet only.
- Affected paths:
  - `app/api` (prepare/submit purchase con idempotencia)
  - `lib` (state machine de intento de compra)
  - `db` (idempotency keys, locking, transiciones de estado)

## Proposal
- Approach summary:
  Introducir idempotencia, locking y reglas de transicion para garantizar una sola ejecucion logica por intento.
- Technical design:
  - El endpoint de `prepare` genera y devuelve una `idempotencyKey` (UUIDv7) en backend con TTL corto (ej. 5 minutos).
  - El cliente debe incluir esta `idempotencyKey` en la llamada a `submit`.
  - Unicidad en DB por (`wallet`, `idempotencyKey`) + política one-time-use.
  - Lock corto durante `prepare/submit` para evitar carrera concurrente.
  - State machine explicita: `created -> prepared -> submitted -> confirmed | failed`.
  - Si `submit` se reintenta con misma `idempotencyKey`, backend retorna estado existente sin reenviar transacción.
  - Reconciliación de `submitted` debe ser webhook-first (ver `STORY-003-05`) para cerrar estados inciertos por fallos RPC.
- Alternatives considered:
  - Manejo optimista sin locks: rechazado por riesgo de duplicado.
  - Idempotencia solo en frontend: rechazado (cliente no confiable).
- Tradeoffs:
  - Mayor complejidad de persistencia/flujo.
  - Alta reduccion de errores operativos y soporte.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Debe existir unica fuente de estado por intento.
2. Debe soportar retry seguro sin duplicar cobro/registro.
3. Errores transitorios RPC requieren estrategia de reconciliacion.
- Blocking concerns:
  Definir timeout y política de retry/expiración para estado `submitted`.

## Resolution
- Final approach after critique:
  Adoptar idempotencia fuerte server-side + lock por intento + reconciliación webhook-first.
- Changes accepted:
  - Restricciones unicas para deduplicacion.
  - `idempotencyKey` server-side con TTL y one-time-use.
  - Transiciones de estado estrictas.
- Changes rejected (with rationale):
  - Flujo stateless sin persistencia: no asegura integridad.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-20`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. La estrategia de idempotencia server-side es robusta y previene problemas operativos críticos.
## Status
- Current status: `implemented`
- Next action:
  Continuar con `STORY-003-04` (quantity foundation) sobre la base de integridad transaccional ya implementada.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de transiciones de estado.
  - Deteccion de duplicado por `idempotencyKey`.
- Integration tests:
  - Reintento de mismo intento no genera segundo submit.
  - Doble click/concurrencia produce una sola operacion efectiva.
  - Misma `idempotencyKey` reutilizada devuelve estado previo sin nuevo envío on-chain.
- Devnet validation (if applicable):
  - Confirmar que no se crean mints duplicados bajo condiciones de retry.
- Responsive QA (if applicable):
  - N/A (backend centric; solo mensajes de estado en UI).

## Operational Evidence
- Date: `2026-03-20`
- Trace flow ID: `76943968-9cc5-4a53-b929-e9b2af3b2ed5`
- Attempt: `7bd07291-8ad4-4dc7-b96d-b978bf97f20b`
- Idempotency key: `019d0c8c-e205-741a-91a4-308022cb9555`
- Tx signature: `faUDFFUa1tDWwGaV3QP4Ee4ttwh6jMi74QwXbCeBJ5zu5X5FhRpE4RD1xEHLck9r7U6MZuYptVkmiDYHVtZjLz4`
- On-chain result:
  - `getSignatureStatus(..., searchTransactionHistory=true)` => `confirmationStatus=finalized`, `err=null` on devnet.
- Idempotency/replay result:
  - Same `attemptId + idempotencyKey` submitted multiple times.
  - Backend returned `200` and the same `txSignature` without issuing duplicate logical purchases.
- State persistence result:
  - `purchase_attempts.status = submitted`
  - `error_code = null`, `error_message = null`
  - Final confirmation transition remains delegated to webhook-first reconciliation (`STORY-003-05`).

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s): `#45`
- Final commit hash(es): `faf8100`, `55205dd`, `c72982a`, `b903a77`
