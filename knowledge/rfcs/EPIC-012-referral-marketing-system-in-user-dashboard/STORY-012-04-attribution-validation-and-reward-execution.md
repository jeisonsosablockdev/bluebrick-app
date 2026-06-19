---
type: RFC
title: STORY- 012 04 Attribution Validation And Reward Execution
description: STORY- 012 04 Attribution Validation And Reward Execution - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-04-attribution-validation-and-reward-execution.md
---

# STORY-012-04-attribution-validation-and-reward-execution

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-04-attribution-validation-and-reward-execution`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El sistema necesita un backend infalible para convertir señales de captura y registro en una atribución única, auditable y elegible para recompensa sin duplicidades, fraude obvio ni rollbacks inconsistentes.
- Why now:
  Sin esta capa, la UX de sharing y dashboard sería una fachada sin verdad transaccional.
- Constraints:
  - La atribución no puede reasignarse una vez ligada a una wallet invitada válida.
  - La elegibilidad requiere KYC aprobado y compra confirmada de NFT; conectar wallet no es suficiente.
  - La recompensa del referente es fija por cada NFT elegible comprado por el invitado y debe quedar persistida en base de datos antes de cualquier distribución.
  - La wallet invitada tiene una ventana de `30 días` desde su suscripción/binding para que sus compras NFT elegibles generen recompensas al referente.
  - La distribución final de USDC no es automática; ocurre solo cuando un admin del proyecto aprueba/ejecuta el payout.
  - La recompensa debe tolerar reversos, chargebacks, eventos duplicados y wash trading.

## Proposal
- Approach summary:
  Implementar una capa backend event-driven que ligue el referral en el primer auth payload, detecte `KYC aprobado + compra confirmada de NFT`, acumule una recompensa fija de `10 USDC` por cada NFT elegible en la base de datos y deje la distribución final en manos del admin del proyecto.
- Technical design:
  - Esquema base propuesto:
    - `referral_codes(id, referrer_user_id, referrer_wallet_address, code UNIQUE, created_at, disabled_at)`
    - `referral_attributions(id, referral_code_id, referrer_user_id, invitee_user_id, invitee_wallet_address, source, captured_at, bound_at, kyc_approved_at, eligibility_window_ends_at, closed_at, status)`
    - `referral_reward_rules(id, nft_collection_id, reward_amount_usdc, settlement_window_days, holding_period_days, eligibility_window_days, active_from, active_to)`
    - `referral_reward_events(id, attribution_id, rule_id, nft_purchase_event_id UNIQUE, transaction_signature, nft_mint_address, reward_amount_usdc, qualified_at, settlement_ends_at, status, idempotency_key UNIQUE, audit_payload)`
    - `referral_payouts(id, referrer_user_id, total_amount_usdc, status, approved_by_admin_id, approved_at, executed_at, payout_tx_hash, notes)`
  - El auth backend consumirá `referralCode` en el primer sign-in y realizará el binding dentro de la misma transacción de creación/activación de usuario.
  - La base impondrá unicidad sobre `invitee_wallet_address` solo para atribuciones activas, por ejemplo con un índice parcial sobre estados no terminales.
  - La adjudicación se disparará por eventos existentes:
    - KYC verificado
    - compra confirmada de NFT elegible
    - reverso/chargeback/refund
  - Una compra solo genera recompensa si el invitado ya pasó KYC, la compra pertenece a una colección NFT elegible configurada en `referral_reward_rules` y ocurre dentro de `eligibility_window_days = 30` contados desde `bound_at`.
  - Cada NFT elegible comprado dentro de esa ventana genera un `referral_reward_event` independiente por `10 USDC` en el MVP.
  - Cada worker abrirá transacción, cargará `referral_attributions` y `referral_reward_events` con `SELECT ... FOR UPDATE`, verificará idempotencia por `nft_purchase_event_id`/`idempotency_key` y aplicará la transición exacta.
  - El estado de cada recompensa por compra seguirá esta máquina:
    - `pending_qualification`
    - `pending_settlement`
    - `accrued`
    - `pending_admin_distribution`
    - `paid`
    - `clawbacked`
    - `rejected`
    - `risk_hold`
  - La transición esperada es:
    - `pending_qualification`: existe atribución, pero falta KYC o compra NFT.
    - `pending_settlement`: KYC aprobado y compra NFT confirmada; se abre una ventana de settlement/holding obligatoria.
    - `accrued`: la recompensa fija de `10 USDC` por NFT quedó consolidada en DB solo si el NFT sigue en la wallet del invitado al final del holding period.
    - `pending_admin_distribution`: la recompensa acumulada queda lista para ser incluida en un payout batch aprobado por admin.
    - `paid`: el admin distribuyó efectivamente el payout.
  - El MVP fija `holding_period_days = 7`. Si el NFT sale de la wallet invitada antes de ese plazo, el reward event pasa a `rejected` o `risk_hold` y no llega a `accrued`.
  - Para mitigar wash trading, cada `referral_reward_event` debe cumplir el `holding_period_days` y el `settlement_window_days` antes de pasar a `accrued`, y el admin puede moverlo a `risk_hold` o `rejected` si detecta patrones sospechosos.
  - Las compras NFT de la wallet invitada fuera de la ventana de `30 días` no generan nuevos eventos de recompensa para el referente.
- Alternatives considered:
  - Polling/cronjob para revisar elegibilidad.
  - Considerar elegible la simple conexión de wallet.
  - Recompensa variable basada solo en volumen nominal.
  - Distribución automática inmediata.
  - Calcular reward status en frontend.
  - Reatribución manual posterior.
- Tradeoffs:
  - El modelo event-driven depende de la calidad del bus/webhooks, pero reduce latencia y evita polling ciego.
  - La ventana de settlement y la aprobación admin retrasan el pago, pero protegen contra conversiones reversibles y fraude obvio.
  - Una recompensa fija de `10 USDC` por NFT simplifica operación y comunicación, pero obliga a vigilar wash trading; por eso el MVP elige `holding_period_days = 7`.
  - Persistir eventos de recompensa y payouts por separado aumenta el modelo de datos, pero deja trazabilidad completa para auditoría y conciliación.

## Critique (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **Critical findings**:
  1. **Arquitectura Dirigida por Eventos vs Cronjobs**: Se desaconseja usar polling/cronjobs para revisar KYC y compras. Se debe utilizar la arquitectura de eventos ya existente (ej. escuchar webhooks de Stripe/Link para KYC y webhooks de Helius para compras). Un worker debe consumir este evento, verificar si el usuario tiene un `referrer_id`, y entonces aplicar la lógica de recompensa.
  2. **Race Conditions y FOR UPDATE**: Al asentar la recompensa, el worker debe bloquear la fila de la atribución (`SELECT ... FOR UPDATE`) para evitar que dos webhooks concurrentes acrediten la recompensa dos veces.
  3. **Protección Anti-Sybil a Nivel Reglas**: "Evento elegible" debe tener una restricción económica (ej. "comprar un activo de >$10 USD"). Si la regla es "sólo conectar wallet", vaciarán el presupuesto de recompensas usando bots. Esto debe quedar en la tabla de base de datos como una regla paramétrica, no quemada (hardcoded) en el código.
  4. **Periodo de Liquidación (Clawback)**: Si la compra fraccionada inicial se revierte por fraude (chargeback), la recompensa del referente debe revertirse. El estado de la recompensa debe ser `pending_settlement` durante un "periodo de gracia" (ej. 7 días) antes de pasar a `liquidated/claimable`.

### Strict Amendment (Post-Approval)
- **[STRICT] Riesgo de Wash Trading**: El `min_eligible_usd >= 10` es insuficiente si la recompensa (ej. $5 USD) es mayor al *costo hundido* (fees) del usuario. Un bot puede auto-referirse, comprar $10, vender inmediatamente perdiendo $0.50 en fees, pero ganando $5 en recompensas. La lógica de negocio debe requerir que el evento elegible tenga un "Holding period" (ej. mantener el activo por 7 días) o que la recompensa se pague de forma proporcional a los *fees* generados para la plataforma, no solo al volumen nominal.

- **Blocking concerns**:
  - Faltan definiciones estrictas a nivel de esquema de base de datos (Unique constraints, manejo de transacciones).
  - La regla económica debe blindarse contra operaciones de Wash Trading de riesgo 0.

## Resolution
- Proposed approach after critique:
  - La adjudicación deja de depender de cronjobs y pasa a un worker event-driven con eventos de KYC, compra NFT elegible y reversos.
  - La consistencia se garantiza con `UNIQUE` constraints, `FOR UPDATE`, transacciones y claves de idempotencia por compra NFT.
  - La elegibilidad queda fijada como `KYC aprobado + compra confirmada de NFT elegible`.
  - La política anti-wash del MVP será `holding period`, no fee-based: el NFT debe seguir en la wallet invitada durante `7 días` antes de que la recompensa pase a `accrued`.
  - Cada NFT elegible comprado dentro de los `30 días` posteriores a la suscripción/binding acumula una recompensa fija de `10 USDC` en DB.
  - La recompensa no se distribuye automáticamente: se consolida en DB, pasa por ventana de settlement y luego queda `pending_admin_distribution` hasta que el admin apruebe/ejecute el payout.
  - Las atribuciones sin KYC ni compras elegibles expiran y liberan la wallet; la unicidad de `invitee_wallet_address` aplica solo a atribuciones activas.
  - La crítica de wash trading se mitiga con `holding_period_days = 7`, ventana de settlement obligatoria y review/admin gate antes del pago.
- Changes accepted:
  - Arquitectura event-driven.
  - Binding transaccional del referral en primer auth payload.
  - Unique constraints para `code`, `nft_purchase_event_id` e `idempotency_key`, más unicidad parcial de `invitee_wallet_address` para atribuciones activas.
  - Reward lifecycle con `pending_settlement`, `accrued`, `pending_admin_distribution`, `paid` y `clawback`.
  - Regla fija de `10 USDC` por NFT elegible en el MVP, dentro de una ventana de elegibilidad de `30 días` desde la suscripción/binding del invitado.
  - `holding_period_days = 7` antes de `accrued`.
  - Distribución posterior controlada por admin.
- Changes rejected (with rationale):
  - Polling/cronjobs como mecanismo principal, porque elevan riesgo de drift temporal y duplicidad.
  - Elegibilidad basada solo en conectar wallet, porque no resiste abuso Sybil.
  - Distribución automática inmediata, porque elimina el control operativo requerido por el proyecto.
  - Cálculo o adjudicación desde frontend, porque destruye auditabilidad.

## Decision
- Decision: `approved`
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action:
  Desplegar el script de migración SQL y preparar el event listener para Helius Webhooks que consuma la validación de compras.

## Test and Validation Plan
- Unit tests:
  - Reglas de transición de `pending_qualification -> pending_settlement -> accrued -> pending_admin_distribution -> paid`.
  - Reglas de `clawbacked`, `rejected` y `risk_hold`.
  - Cálculo fijo de `10 USDC` por NFT elegible.
  - Corte estricto de elegibilidad al día 30 desde `bound_at`.
  - Regla de `holding_period_days = 7` con propiedad continua del NFT.
- Integration tests:
  - Intentar ligar la misma `invitee_wallet_address` a dos referentes concurrentes; solo una operación prevalece.
  - Expirar una atribución sin KYC y comprobar que la misma wallet puede crear una nueva atribución activa posterior.
  - Reprocesar dos veces la misma compra NFT y comprobar que la recompensa se acredita una sola vez.
  - Comprar múltiples NFTs elegibles dentro de los `30 días` y comprobar que se crean múltiples `referral_reward_events` de `10 USDC` cada uno.
  - Comprar un NFT elegible en el día 31 y comprobar que no se crea recompensa.
  - Transferir/vender el NFT antes del día 7 y comprobar que la recompensa no llega a `accrued`.
  - Aprobar un payout admin y comprobar que suma solo eventos `pending_admin_distribution`.
  - Revertir una compra ya calificada y verificar transición a `clawbacked`.
  - Forzar un `expires_at` mayor al TTL y confirmar que no se crea atribución válida.
- Devnet validation (if applicable):
  - Para compras NFT on-chain elegibles, validar contra datos reales de devnet antes de marcar implementación como completa.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
