---
type: RFC
title: STORY- 003 04 Quantity Foundation And Multi Quantity Rollout
description: STORY- 003 04 Quantity Foundation And Multi Quantity Rollout - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-04-quantity-foundation-and-multi-quantity-rollout.md
---

# STORY-003-04-quantity-foundation-and-multi-quantity-rollout

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-04-quantity-foundation-and-multi-quantity-rollout`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-20`

## Context
- Problem:
  El flujo de compra actual asume `quantity=1` de forma implícita y no expone un contrato explícito para evolucionar a compras multi-cantidad.
- Why now:
  Se necesita una base de contrato estable para habilitar rollout progresivo de multi-cantidad sin romper APIs ni trazabilidad.
- Constraints:
  - Mantener validación server-side de cantidad y límites operativos por orden.
  - No romper idempotencia ni anti-bot ya implementados.
  - No confiar en validación de cliente.
  - Devnet only.
- Affected paths:
  - `app/api/purchase/*`
  - `lib/purchase-service.ts`
  - `lib/purchase-anti-bot.ts`
  - `lib/purchase-attempts-repository.ts`
  - `components/marketplace/PurchaseCta.tsx`

## Proposal
- Approach summary:
  Formalizar contrato de cantidad con modo operativo explícito y errores semánticos de cantidad.
- Technical design:
  - Introducir `quantityMode` en contrato (`SINGLE_ONLY | MULTI_ENABLED`) controlado por servidor.
  - Aceptar `quantity` en `quote/challenge/prepare` y validarlo server-side.
  - Definir errores semánticos para cantidad inválida (`INVALID_QUANTITY`).
  - Persistir `quantity` en `purchase_attempts`.
  - Vincular `quantity` al challenge firmado para prevenir replay/context mismatch.
  - Habilitar compra multi-cantidad con límites por orden (`PURCHASE_MAX_QUANTITY_PER_ORDER`) y validación de tamaño de transacción en `prepare`.
- Alternatives considered:
  - Seguir con `quantity` implícita en backend: rechazado por deuda técnica y contratos ambiguos.
  - Habilitar multi-cantidad completa en esta historia: rechazado por alcance/riesgo, se mantiene rollout incremental.
- Tradeoffs:
  - Más validaciones y payloads en rutas.
  - Mayor claridad contractual y menor riesgo para rollout futuro.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. El contrato debe ser explícito para evitar “implicit behavior”.
2. Los errores de cantidad deben ser semánticos para UX y soporte.
3. Debe preservarse compatibilidad para fallback operativo a `SINGLE_ONLY`.
- Blocking concerns:
  Ninguno para aprobación de diseño.

## Resolution
- Final approach after critique:
  Implementar contrato de cantidad con rollout multi controlado por configuración server-side.
- Changes accepted:
  - `quantityMode` explícito.
  - `quantity` validado server-side.
  - Error semántico `INVALID_QUANTITY`.
  - Persistencia de `quantity` por intento.
  - Rollout multi-cantidad (`MULTI_ENABLED` default) con límites por orden y rechazo de payloads que no caben en una sola transacción.
- Changes rejected (with rationale):
  - Multi-cantidad activa desde UI/backend en esta historia (se difiere para rollout controlado).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-19`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. Se implementa contrato de cantidad con habilitación multi-cantidad controlada por límites server-side.

## Status
- Current status: `implemented`
- Next action:
  Continuar con `STORY-003-05` (traceability/metrics backend) sobre base de contrato de cantidad estable.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validación de reglas de cantidad por modo (`SINGLE_ONLY`/`MULTI_ENABLED`) y límites.
  - Errores semánticos `INVALID_QUANTITY`.
- Integration tests:
  - `quote/challenge/prepare` aceptan `quantity>1` cuando está dentro de límites.
  - `quantity` inválida devuelve error semántico sin ejecutar flujo.
  - `quantity` se propaga a persistencia (`purchase_attempts`).
- Devnet validation (if applicable):
  - Compra real en devnet con `quantity>1` dentro de límites.
- Responsive QA (if applicable):
  - CTA de compra mantiene UX estable en 320/375/768/1024.
- Validation run (executed):
  - `npm run test -- tests/lib/purchase-service.test.ts tests/lib/purchase-anti-bot.test.ts tests/lib/purchase-attempts-repository.test.ts tests/api/purchase-quote-route.test.ts tests/api/purchase-challenge-route.test.ts tests/api/purchase-prepare-route.test.ts tests/api/purchase-submit-route.test.ts`
  - `npm run validate`

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s): `#49`
- Final commit hash(es): `39dfc00`, `c546513`
