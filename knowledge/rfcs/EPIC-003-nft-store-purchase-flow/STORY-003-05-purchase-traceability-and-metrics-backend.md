---
type: RFC
title: STORY- 003 05 Purchase Traceability And Metrics Backend
description: STORY- 003 05 Purchase Traceability And Metrics Backend - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-05-purchase-traceability-and-metrics-backend.md
---

# STORY-003-05-purchase-traceability-and-metrics-backend

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-05-purchase-traceability-and-metrics-backend`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-27`

## Context
- Problem:
  Sin persistencia y metricas backend no hay trazabilidad operativa ni analitica por candy machine.
- Why now:
  Se requiere base de datos de compras para soporte, auditoria y ranking de lo mas vendido.
- Constraints:
  - Esta historia no incluye UI de dashboard.
  - Debe almacenar `candyMachineAddress` como dimension principal.
  - Solo datos operativos/publicos; sin secretos.
- Affected paths:
  - `db` (migraciones y tablas de intentos/resultados)
  - `lib` (servicios de persistencia y agregacion)
  - `app/api/admin` (endpoints de metricas backend)

## Proposal
- Approach summary:
  Persistir ciclo completo de compra e implementar agregados de metricas por candy machine y coleccion.
- Technical design:
  - Tabla de intentos/resultado con campos minimos:
    - `attemptId`, `wallet`, `candyMachineAddress`, `collectionAddress`
    - `status`, `priceLamports`, `quantity`
    - `txSignature`, `mintAddress`, `errorCode`, `errorMessage`
    - `createdAt`, `updatedAt`, `confirmedAt`, `idempotencyKey`
  - Vistas/queries agregadas:
    - ventas exitosas por candy machine
    - ingresos por candy machine
    - tasa de fallo/conversion por ventana temporal
  - Reconciliación y Caché (Webhook-First):
    - El backend se suscribirá a **Helius Webhooks** para monitorear transacciones de compra y eventos relevantes de cuenta.
    - Al recibir webhook para una `txSignature`, se valida autenticidad del evento y se deduplica por (`signature`, `slot`, `eventType`).
    - Si estado webhook es `confirmed` o `failed`, backend actualiza el intento desde `submitted` al estado terminal correspondiente. Esta es la **fuente de verdad final**.
    - Si llega webhook fuera de orden, la state machine evita regresiones de estado terminal.
    - El backend mantendrá un caché (ej. Redis) con el estado del Candy Guard (`solPayment`, `startDate`, `itemsAvailable`).
    - Webhooks/eventos de cambio de guard invalidan cache inmediatamente; se refresca con lectura controlada.
    - Poller de baja frecuencia queda como fallback operativo si webhook falla.
  - Endpoints internos para consumo de admin UI en `STORY-003-06`.
- Alternatives considered:
  - Guardar solo firmas sueltas en logs: rechazado (sin trazabilidad robusta).
  - Hacer dashboard primero: rechazado (sin capa de datos estable).
- Tradeoffs:
  - Mayor costo inicial de modelado y consultas.
  - Mejor soporte, auditoria y decision comercial.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Debe quedar trazabilidad por candy machine para detectar lo mas vendido.
2. Es necesario guardar tanto intentos fallidos como exitosos.
3. API de metricas debe quedar desacoplada del dashboard.
- Blocking concerns:
  Definir retencion de datos historicos y estrategia de indexacion.

## Resolution
- Final approach after critique:
  Implementar primero capa de datos/metricas backend con reconciliación webhook-first y usarla como fuente para dashboard en historia siguiente.
- Changes accepted:
  - Persistencia completa de intentos/resultados.
  - Webhook de Helius como fuente de verdad de estado final.
  - Deduplicación de eventos y manejo de orden de llegada.
  - Cache de guard con invalidación por evento.
  - Dimensiones analiticas por candy machine y coleccion.
- Changes rejected (with rationale):
  - Acoplar logica de metricas dentro de componentes UI: reduce mantenibilidad.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-20`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. La arquitectura webhook-first con Helius es la correcta y cumple con las directivas del proyecto. La capa de caché es esencial para la escalabilidad.
## Status
- Current status: `implemented`
- Next action:
  Documentación consolidada con trazabilidad completa en el README de `EPIC-003`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Mapeo y validacion de persistencia por estado de compra.
  - Cálculo de metricas agregadas.
- Integration tests:
  - Endpoints admin de metricas retornan datos consistentes.
  - Intentos fallidos/exitosos aparecen en agregados correctos.
  - Webhook `confirmed` actualiza intento de `submitted` a `confirmed` sin acción del cliente.
  - Webhook duplicado no altera resultados (idempotencia de eventos).
- Devnet validation (if applicable):
  - Ejecutar compras reales y verificar presencia en DB + agregados.
- Responsive QA (if applicable):
  - N/A (backend centric).

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s): `#51`
- Final commit hash(es): `777895b`, `e29f07b`
