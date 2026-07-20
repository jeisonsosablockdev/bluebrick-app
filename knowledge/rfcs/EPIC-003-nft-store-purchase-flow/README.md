---
type: RFC
title: README
description: README - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-003-nft-store-purchase-flow/README.md
---

# EPIC-003-nft-store-purchase-flow

## Metadata
- Epic ID: `EPIC-003`
- Title: `NFT Store Purchase Flow`
- Status: `implemented`
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-27`

## Scope
- Problem statement:
  Hoy el proyecto permite deploy/mint admin con Core Candy Machine, pero no tiene un flujo de compra para usuario final en tienda.
- Business goal:
  Permitir que un usuario compre un NFT desde la tienda con confirmacion real en devnet y trazabilidad para operaciones/admin.
- Technical goal:
  Implementar compra sobre Metaplex Core Candy Machine leyendo precio desde `candyGuard.solPayment` on-chain, con revalidacion server-side, seguridad incremental y metricas.
- Out of scope:
  - KYC (se deja para futuro).
  - Mainnet y simulaciones de produccion.
  - Limite acumulado de mints por wallet (`mintLimit`).

## Success Criteria
- [x] Usuario puede comprar 1 NFT end-to-end desde tienda (listing/detail) en devnet con firma y confirmacion `confirmed`.
- [x] Precio mostrado en UI se obtiene desde cache backend de guard y se revalida con fuente on-chain antes del `prepare`.
- [x] Intentos/resultados quedan persistidos por `candyMachineAddress` para metricas operativas y trazabilidad.
- [x] Dashboard admin consume metricas reales reutilizando placeholders existentes (sin rediseno estructural).
- [x] Reconciliacion final de compra usa Helius Webhooks como fuente de verdad para estado `confirmed | failed`.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-003-01 | Basic NFT Purchase | `STORY-003-01-basic-nft-purchase.md` | `implemented` | `#43` | Compra MVP completada + evidencia devnet (`txSignature`: `k5Bg...PHP`) |
| STORY-003-02 | Anti-Bot Without Wallet Cap | `STORY-003-02-anti-bot-without-wallet-cap.md` | `implemented` | `#44` | Challenge firmado + anti-replay/rate-limit + `thirdPartySigner` mandatorio + compra devnet validada (`txSignature`: `41sS...jv8F`) |
| STORY-003-03 | Transaction Integrity and Idempotency | `STORY-003-03-transaction-integrity-and-idempotency.md` | `implemented` | `#45` | UUIDv7 + TTL server-side, lock transaccional en submit y dedupe por (`wallet`, `idempotency_key`) + replay validado (`flowId`: `76943968-9cc5-4a53-b929-e9b2af3b2ed5`) |
| STORY-003-04 | Quantity Foundation and Multi-Quantity Rollout | `STORY-003-04-quantity-foundation-and-multi-quantity-rollout.md` | `implemented` | `#49` | Contrato `quantity` en `quote/challenge/prepare`, rollout multi (`MULTI_ENABLED` por defecto con límites), error `INVALID_QUANTITY`, persistencia de `quantity` en `purchase_attempts` |
| STORY-003-05 | Purchase Traceability and Metrics Backend | `STORY-003-05-purchase-traceability-and-metrics-backend.md` | `implemented` | `#51` | Persistencia + reconciliación webhook-first + cache invalidation (sin dashboard) |
| STORY-003-06 | Admin Dashboard Metrics Binding | `STORY-003-06-admin-dashboard-metrics-binding.md` | `implemented` | `#52` | Binding de placeholders + contrato de estados UI y frescura de datos |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-19 | STORY-003-01 | Aprobado MVP de compra basica con precio definido por candy guard en deploy y lectura/revalidacion on-chain en compra | jaymusicmachine | `STORY-003-01-basic-nft-purchase.md` |
| 2026-03-19 | STORY-003-01 | Reabierta en `in-review` para agregar contrato de errores UX y estrategia de cache con revalidación | jaymusicmachine | `STORY-003-01-basic-nft-purchase.md` |
| 2026-03-19 | STORY-003-02 | Se define que anti-bot no usara limite acumulado de mints por wallet | jaymusicmachine | `STORY-003-02-anti-bot-without-wallet-cap.md` |
| 2026-03-19 | STORY-003-02 | Se eleva `thirdPartySigner` a mandatorio para venta pública (con validación off-chain) | jaymusicmachine | `STORY-003-02-anti-bot-without-wallet-cap.md` |
| 2026-03-19 | STORY-003-03 | `idempotencyKey` pasa a generación server-side con TTL y one-time-use | jaymusicmachine | `STORY-003-03-transaction-integrity-and-idempotency.md` |
| 2026-03-19 | STORY-003-04 | Se formaliza contrato de cantidad (`SINGLE_ONLY`/`MULTI_ENABLED`) y códigos de error de cantidad | jaymusicmachine | `STORY-003-04-quantity-foundation-and-multi-quantity-rollout.md` |
| 2026-03-19 | STORY-003-05 | Metricas de venta por candy machine van en backend/DB | jaymusicmachine | `STORY-003-05-purchase-traceability-and-metrics-backend.md` |
| 2026-03-19 | STORY-003-05 | Reconciliación final y sincronización de estado pasan a webhook-first (Helius) | jaymusicmachine | `STORY-003-05-purchase-traceability-and-metrics-backend.md` |
| 2026-03-19 | STORY-003-06 | Dashboard admin se implementa aparte y debe reutilizar placeholders existentes | jaymusicmachine | `STORY-003-06-admin-dashboard-metrics-binding.md` |
| 2026-03-19 | STORY-003-06 | Se añade contrato de endpoints admin + estados UI (`loading/error/empty/success`) + `dataFreshness` | jaymusicmachine | `STORY-003-06-admin-dashboard-metrics-binding.md` |
| 2026-03-19 | STORY-003-01 | Implementación completada y validada con compra real en devnet (`finalized`) | jaymusicmachine | `STORY-003-01-basic-nft-purchase.md` |
| 2026-03-19 | STORY-003-02 | Implementación completada: challenge firmado, anti-replay/rate-limit y enforcement de `thirdPartySigner` | jaymusicmachine | `STORY-003-02-anti-bot-without-wallet-cap.md` |
| 2026-03-20 | STORY-003-03 | Implementación completada: `idempotencyKey` server-side + state machine (`created/prepared/submitted/confirmed/failed`) + lock `FOR UPDATE` en submit | jaymusicmachine | `STORY-003-03-transaction-integrity-and-idempotency.md` |
| 2026-03-20 | STORY-003-03 | Evidencia operativa validada en devnet: submit `200`, replay idempotente con misma firma y transacción `finalized` (`faUD...Lz4`) | jaymusicmachine | `STORY-003-03-transaction-integrity-and-idempotency.md` |
| 2026-03-20 | STORY-003-04 | Implementación completada: contrato de cantidad en APIs de compra + rollout multi con límites server-side + error `INVALID_QUANTITY` + quantity-bound challenge + persistencia de `quantity` | jaymusicmachine | `STORY-003-04-quantity-foundation-and-multi-quantity-rollout.md` |
| 2026-03-24 | STORY-003-05 | Implementación completada: trazabilidad backend + reconciliación webhook-first + métricas por candy machine | jaymusicmachine | `STORY-003-05-purchase-traceability-and-metrics-backend.md` |
| 2026-03-20 | STORY-003-06 | Implementación completada: binding de métricas reales en dashboard admin y contrato de estados UI | jaymusicmachine | `STORY-003-06-admin-dashboard-metrics-binding.md` |

## Critique (Staff Engineer Review)
- **3 Critical Weaknesses**:
  1. **Falta de Estrategia de Reconciliación Robusta**: La propuesta menciona "reconciliación" pero es vaga. Depender de que el cliente reintente o verifique tras un timeout de RPC es frágil y viola la regla de "no confiar en el cliente". Si el backend envía una transacción, recibe un error de red, pero la transacción *sí* se confirma en la cadena, el sistema entra en un estado inconsistente. La idempotencia por sí sola no resuelve esto.
  2. **Estrategia Anti-Bot Insuficiente**: `STORY-003-02` propone un nonce y rate-limiting, lo cual es un primer paso trivial. Para una venta pública, esto es insuficiente. La propuesta menciona el `thirdPartySigner` de Candy Machine Core como una *opción*, cuando debería ser **mandatorio** para cualquier venta que requiera protección real, permitiendo una validación off-chain (ej. CAPTCHA) antes de firmar la transacción.
  3. **Abuso de Llamadas RPC para Estado On-Chain**: El plan de "obtener `solPayment.lamports` desde Candy Guard" para cada `quote` es ineficiente y no escala. Generará costos elevados y throttling de RPC bajo carga. El backend debe cachear el estado del Candy Machine y usar webhooks para invalidar dicho caché, en lugar de realizar lecturas directas en cada petición.

- **Execution Risks**:
  - **Desincronización DB/Chain**: Sin una reconciliación basada en webhooks, los fallos de RPC llevarán a una desincronización permanente entre la base de datos de métricas y la realidad on-chain, haciendo que los dashboards y la trazabilidad sean inútiles.
  - **UX Pobre ante Cambios de Estado**: Si el precio del guard cambia entre el `quote` y el `submit`, la transacción fallará. La propuesta no define el flujo de error específico y claro que se le debe presentar al usuario en este escenario común.
  - **Colisión de Idempotency Key**: El ciclo de vida y la generación de la `idempotencyKey` no están definidos. Si el cliente la genera de forma débil, podría bloquear compras legítimas por colisiones accidentales o intencionadas.

- **Uncovered Edge Cases**:
  - **Fondos Insuficientes**: No se define el mensaje de error para el usuario si no tiene SOL suficiente para el precio + fee.
  - **Sold Out Concurrente**: ¿Qué pasa si el último NFT se vende entre el `prepare` y el `submit`? El sistema debe interpretar el error on-chain específico y actualizar el estado a "Sold Out".
  - **`startDate` Guard**: La UX para una compra antes de la fecha de inicio no está definida (¿botón deshabilitado, countdown, error?).

- **Stack Alignment**:
  - **@helius**: **FALLO CRÍTICO**. La propuesta ignora por completo el uso de **Helius Webhooks** para la confirmación de transacciones y la invalidación de caché, una violación directa de las reglas del proyecto (`GEMINI.md`). El principio de usar APIs optimizadas (DAS) para la lectura de estado tampoco se considera.
  - **@metaplex**: Correctamente alineado al usar Core Candy Machine.

- **Incorrect Assumptions**:
  - Asumir que las llamadas RPC directas son una forma escalable de obtener el estado de un mint para cada usuario.
  - Asumir que la revalidación en el backend es suficiente para una buena UX, ignorando la necesidad de comunicar claramente *por qué* falló una transacción (ej. "El precio ha cambiado").
  - Asumir que un nonce simple es una barrera efectiva contra bots.

- **Mandatory Tests**:
  1. **Prueba de Reconciliación con Webhook**: Simular una compra donde el backend recibe un webhook de Helius para una transacción `confirmed`. Verificar que el estado en la DB se actualiza de `submitted` a `confirmed` sin intervención del cliente.
  2. **Prueba de `thirdPartySigner`**: Una prueba de integración donde un intento de compra sin una firma válida del `thirdPartySigner` es rechazado por el programa en devnet.
  3. **Prueba de Idempotencia**: Enviar la misma petición de compra dos veces seguidas. Verificar que solo se ejecuta una transacción on-chain y se registra una sola compra en la DB.

- **Verdict**: `reject`

## Resolution (Post-Critique)
- **Acciones Obligatorias para Aprobación**:
  1. Rediseñar el flujo de confirmación para usar **Helius Webhooks** como fuente de verdad para el estado final de la transacción (`confirmed` | `failed`).
  2. Implementar una capa de caché en el backend para el estado del Candy Guard, que se invalide mediante webhooks cuando el guard cambie.
  3. Hacer mandatorio el uso del guard `thirdPartySigner` para ventas públicas y definir el flujo de validación off-chain.
  4. Definir explícitamente la estrategia de generación y ciclo de vida de la `idempotencyKey` en el servidor.

## Resolution Matrix (Implemented in RFC)
| Gemini Point | Ajuste Aplicado | Story |
| --- | --- | --- |
| Reconciliación frágil DB/chain | Webhook de Helius como fuente final de estado de compra + reconciliación asíncrona | `STORY-003-05`, `STORY-003-03` |
| Anti-bot insuficiente | `thirdPartySigner` mandatorio en venta pública + validación off-chain + rate-limit por ventana | `STORY-003-02` |
| Exceso de lecturas RPC por quote | Cache de guard (`solPayment`, `startDate`) + invalidación por eventos/webhooks + refresh controlado | `STORY-003-05`, `STORY-003-01` |
| UX sin errores claros | Contrato de errores explícitos: `PRICE_CHANGED`, `INSUFFICIENT_FUNDS`, `SOLD_OUT`, `MINT_NOT_STARTED` | `STORY-003-01` |
| Colisión/ciclo de vida idempotency | `idempotencyKey` server-side (UUIDv7), one-time use, TTL y UNIQUE constraints | `STORY-003-03` |
| Falta de pruebas críticas | Suite obligatoria: webhook reconciliation, `thirdPartySigner` enforcement, idempotency double-submit | `STORY-003-05`, `STORY-003-02`, `STORY-003-03` |

- **Revised Verdict (RFC Scope)**: `approved`
  Todas las historias del Epic (`01` a `06`) han sido detalladas, revisadas y aprobadas. El Epic completo está listo para implementación.

## Risks and Dependencies
- Risks:
  - Cambios de guard on-chain entre preview y confirmacion pueden generar desalineacion de precio.
  - Rate limiting agresivo puede afectar conversion legitima.
  - Inconsistencias temporales entre DB y estado on-chain ante fallos RPC.
- Dependencies:
  - Core Candy Machine y Candy Guard desplegados en devnet.
  - SIW funcionando para sesion/autorizacion.
  - RPC devnet estable + proveedor DAS para lectura.
  - Helius Webhooks configurado para confirmaciones e invalidación de cache.
- Mitigations:
  - Cache de estado de guard con invalidación por eventos y refresh controlado.
  - Revalidar precio/startDate guard en backend justo antes de `prepare`.
  - Idempotencia server-side + locks para evitar doble compra lógica.
  - Reconciliación webhook-first para corregir estados inciertos.

## Open Questions
- [x] ¿`thirdPartySigner` se activa en todos los nuevos deploys de candy machine o solo en colecciones de venta publica?  
  Resuelto: obligatorio para colecciones de venta pública.
- [x] ¿Cuantos mints por minuto por wallet/IP son aceptables para anti-bot sin afectar UX?  
  Resuelto: ventana de `60s`, con tope de `8` intentos por wallet y `20` por IP (`PURCHASE_RATE_LIMIT_WINDOW_SECONDS=60`, `PURCHASE_RATE_LIMIT_MAX_BY_WALLET=8`, `PURCHASE_RATE_LIMIT_MAX_BY_IP=20`).
- [x] ¿En que momento de roadmap se habilita `quantity > 1` en frontend?  
  Resuelto: habilitado en el rollout de `STORY-003-04` bajo límites server-side.

## Traceability
- Issue(s): `EPIC-003`
- PR(s): `#42` (base), `#43` (story-01), `#44` (story-02), `#45` (story-03), `#49` (story-04), `#51` (story-05), `#52` (story-06)
- Final commit hash(es): `7dbd4ac`, `edeebaa`, `8906c7d`, `b0f8ae9`, `43d15e3`, `0ae1fa7`, `faf8100`, `39dfc00`, `777895b`, `e29f07b`, `2b90d73`, `d61ccc0`, `4cb0f27`, `04af78d`, `f0e6b4d`, `8e636e9`
