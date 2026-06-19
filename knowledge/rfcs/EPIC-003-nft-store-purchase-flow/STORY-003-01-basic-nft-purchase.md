---
type: RFC
title: STORY- 003 01 Basic Nft Purchase
description: STORY- 003 01 Basic Nft Purchase - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-01-basic-nft-purchase.md
---

# STORY-003-01-basic-nft-purchase

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-01-basic-nft-purchase`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-19`

## Context
- Problem:
  No existe flujo de compra de tienda para usuario final. Solo existe flujo admin para deploy/mint.
- Why now:
  Se requiere arrancar el siguiente EPIC con la funcionalidad basica: usuario compra NFT en devnet.
- Constraints:
  - Precio de mint no se define en compra; se define en deploy por `candyGuard.solPayment`.
  - El `quote` no hace lectura RPC directa por request; consume cache backend del guard.
  - El `prepare` revalida contra fuente on-chain antes de construir transacción.
  - SIW wallet auth, sin KYC por ahora.
  - Sin limite acumulado de mints por wallet.
  - Devnet only.
- Affected paths:
  - `app` (tienda: listing/detail + CTA comprar)
  - `app/api` (quote/prepare/submit purchase endpoints)
  - `lib` (lectura de guard on-chain, validaciones, orquestacion mint)
  - `db` (registro minimo de intento/resultado)

## Proposal
- Approach summary:
  Implementar compra MVP con `quantity=1`, mostrando precio desde cache backend y ejecutando mint real confirmado en devnet con contrato de errores UX explícito.
- Technical design:
  - `POST /api/purchase/quote` devuelve precio/disponibilidad desde cache backend (`solPayment`, `startDate`, `itemsRemaining`) + `cacheUpdatedAt`.
  - `POST /api/purchase/prepare` revalida guard on-chain y devuelve error semántico si hay desalineación (`PRICE_CHANGED`, `MINT_NOT_STARTED`, `SOLD_OUT`).
  - `POST /api/purchase/submit` procesa firma de wallet y devuelve resultado de envío inicial (`submitted`) con `attemptId` y `txSignature`.
  - Confirmación final de compra la define el backend vía reconciliación webhook-first (ver `STORY-003-05`), no el cliente.
  - Usuario firma con wallet; backend envía/valida y persiste resultado.
  - Se guarda trazabilidad mínima: wallet, candy machine, precio, firma, estado y `errorCode`.
- UI Error Handling Contract:
  La UI debe estar preparada para manejar los siguientes códigos de error específicos devueltos por la API de compra y mostrar un mensaje claro al usuario:
  - `MINT_NOT_STARTED`: La venta aún no ha comenzado (`startDate` futuro). La UI debe mostrar un contador o deshabilitar el botón.
  - `SOLD_OUT`: El Candy Machine no tiene más items. La UI debe mostrar "Agotado".
  - `PRICE_CHANGED`: El precio en el guard cambió entre el `quote` y el `submit`. La UI debe notificar al usuario y pedirle que reintente la compra con el nuevo precio.
  - `INSUFFICIENT_FUNDS`: El usuario no tiene suficiente SOL para cubrir el costo + fees. La UI debe indicarlo.
  - `TRANSACTION_FAILED`: Error genérico de la red o del programa. La UI debe sugerir reintentar.
- Alternatives considered:
  - Definir precio en DB/backend para compra: rechazado (fuente de verdad debe ser on-chain).
  - Confiar solo en validaciones de frontend: rechazado (cliente no confiable).
  - Leer RPC en cada `quote`: rechazado por ineficiente y costoso. Se opta por caché + revalidación.
- Tradeoffs:
  - Mayor complejidad en backend por cache + errores semánticos.
  - Menor costo RPC y mejor UX bajo carga.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Debe quedar explicito que precio viene de Candy Guard y no de input de compra.
2. SIW no reemplaza protecciones anti-bot de compra (se cubre en `STORY-003-02`).
3. Cantidad multi se difiere, pero arquitectura debe quedar preparada (`STORY-003-04`).
- Blocking concerns:
  Ninguno para arrancar implementacion MVP.

## Resolution
- Final approach after critique:
  MVP en revisión con `quote` cacheado, `prepare` con revalidación on-chain y contrato explícito de errores de negocio para la UI.
- Changes accepted:
  - Precio on-chain como unica fuente de verdad.
  - Persistencia minima de intento/resultado desde esta historia.
  - Confirmacion objetivo en `confirmed`.
- Changes rejected (with rationale):
  - Configurar precio en tiempo de compra: rompe consistencia con guard on-chain.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-19`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. El diseño técnico es robusto y cubre los casos de uso críticos y riesgos identificados. La implementación puede comenzar.

## Status
- Current status: `implemented`
- Next action:
  Iniciar implementación de `STORY-003-02` sobre este baseline.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Parser/normalizacion de guards on-chain (`solPayment`, `startDate`).
  - Reglas de validacion de quote/prepare (precio y disponibilidad).
- Integration tests:
  - Flujo quote -> prepare -> submit con persistencia de estado.
  - Error flow cuando cambia guard entre quote y prepare (`PRICE_CHANGED`).
  - Error flow para `MINT_NOT_STARTED`, `SOLD_OUT`, `INSUFFICIENT_FUNDS`.
- Devnet validation (if applicable):
  - Compra real ejecutada con firma wallet y tx confirmada/finalized en devnet.
  - Evidencia:
    - `attemptId`: `9aa335cc-c944-466d-8e41-57dd420099db`
    - `txSignature`: `k5BgDnq2Yftm7UgSnJ5ro8autQf2x5mTv8EWiWRVGew8GptiXzkN8cbfATXwskf3oH8yaKVpGgMrAkajD3JfPHP`
    - Explorer: `https://solscan.io/tx/k5BgDnq2Yftm7UgSnJ5ro8autQf2x5mTv8EWiWRVGew8GptiXzkN8cbfATXwskf3oH8yaKVpGgMrAkajD3JfPHP?cluster=devnet`
    - Estado RPC: `finalized` (slot `449520353`)
- Responsive QA (if applicable):
  - Validar CTA comprar y mensajes de estado en `320/375/768/1024`.

- Validation run (executed):
  - `npm run test -- tests/lib/purchase-service.test.ts tests/api/purchase-quote-route.test.ts tests/api/purchase-prepare-route.test.ts tests/api/purchase-submit-route.test.ts`
  - `npm run validate`

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s): `#43`
- Final commit hash(es): `edeebaa`, `8906c7d`
