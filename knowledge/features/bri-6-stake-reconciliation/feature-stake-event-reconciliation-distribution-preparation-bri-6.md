---
type: Feature Spec
title: Feature Stake Event Reconciliation Distribution Preparation BRI- 6
description: Feature Stake Event Reconciliation Distribution Preparation BRI- 6 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-stake-event-reconciliation-distribution-preparation-bri-6.md
---

# BRI-6 - Stake-event reconciliation and distribution preparation service

## ES

## Estado
- Issue padre: `BRI-6`
- Rama de iniciativa: `initiative/bri-6-stake-event-reconciliation-distribution`
- Slice actual: `feature/shared-stake-event-distribution-bri-6-s01-spec`
- Tipo: feature multi-slice
- Estado de este artefacto: spec slice

## Contexto
BRI-6 diseña el microservicio que prepara distribuciones de rentas usando el historial validado de `Stake / Unstake` definido por BRI-5 y BRI-170.

El diseño vigente ya no usa un programa notario Anchor. La base operativa es:

- `Stake` significa `freeze`.
- `Unstake` significa `unfreeze`.
- Helius observa transacciones, pero no decide verdad final.
- BRIDS revalida por firma contra RPC canónico antes de persistir eventos autoritativos.
- La tabla `user_profile_stake_events` es una proyección derivada, validada y auditable para perfil.
- La UI de BRI-170 consume inventario server-side y estados `ready_to_stake`, `ready_to_unstake`, `sync_pending` y errores recuperables.

BRI-6 no vuelve a resolver Stake / Unstake. BRI-6 consume sus eventos validados para preparar un resultado de distribución auditable.

## Problema
BRIDS necesita preparar distribuciones de rentas de forma explicable y auditable. Hoy existen piezas separadas:

- eventos validados de `stake / unstake`
- KYC y compliance del perfil
- tesorería o balance disponible
- UI placeholder de distribuciones

Sin un microservicio de preparación, no hay una respuesta determinística para:

- qué wallets fueron elegibles en un período
- qué NFTs estuvieron frozen durante cuánto tiempo
- qué monto corresponde a cada wallet
- qué política se aplicó
- qué eventos quedaron excluidos por reconciliación, KYC o falta de datos
- qué archivo puede usar el proceso posterior de claim

## Objetivo
Implementar una preparación de distribución off-chain que:

- lea eventos `Stake / Unstake` validados
- filtre la corrida por `collection_address` y/o `property_id`
- cruce wallets contra compliance/KYC
- reciba o capture un snapshot de tesorería disponible
- calcule montos pro-rata por tiempo frozen validado
- guarde resultados auditables por período
- genere un archivo de salida para claim o ejecución posterior

## Principios de verdad
1. RPC canónico valida la transacción de origen antes de que el evento de stake sea elegible.
2. BRI-6 solo consume eventos `user_profile_stake_events.validation_status = 'validated'`.
3. Helius es observador, no árbitro.
4. Compliance/KYC vive off-chain y decide elegibilidad de distribución.
5. Squads/tesorería o snapshot financiero decide monto disponible.
6. Una distribución finalizada no se reescribe; cualquier corrección requiere nueva corrida o evento de auditoría.

## Decisiones v1

### Períodos
- Los períodos son configurables con `period_start_at` y `period_end_at`.
- La zona horaria canónica de producto es `America/Bogota`.
- El cálculo usa instantes UTC en base de datos, pero el período se define y se audita con referencia `America/Bogota`.

### Alcance de distribución
- Cada corrida debe tener un scope explícito.
- Scope mínimo v1:
  - `collection_address`
  - `property_id`
- El motor no reparte globalmente entre todas las wallets BRIDS.
- El motor reparte el monto de una collection/property específica entre las wallets elegibles que tuvieron NFTs de ese scope frozen durante el período.
- Si en el futuro se soportan bundles multi-collection, deben modelarse como otro `distribution_scope_type`, no como comportamiento implícito.

### Elegibilidad de eventos
- Solo cuentan eventos con `validation_status = 'validated'`.
- Solo cuentan eventos cuyo `collection_address` y `property_id` coinciden con el scope de la corrida.
- Eventos `pending`, `reconcile_pending` o `rejected` no pueden entrar en una distribución finalizada.
- Si un período tiene eventos pendientes relevantes, la corrida puede quedar en `blocked` o `draft`, pero no `finalized`.

### Elegibilidad de wallet
- Una wallet solo es elegible si su `compliance_status` es `fully_verified` al momento de preparar o finalizar la corrida.
- Wallets `pending_kyc`, `pending_aml`, `pending_review`, `restricted_aml` o `suspended` quedan excluidas y deben aparecer en auditoría.

### Fórmula v1
- Unidad base: segundos frozen validados por NFT dentro del período.
- El universo de cálculo es la collection/property de la corrida.
- Peso v1: `1` por NFT elegible.
- Contribución de wallet: suma de segundos frozen de sus NFTs elegibles.
- Distribución: `wallet_amount = floor(total_amount_minor * wallet_seconds / total_seconds)`.
- El remanente por redondeo queda registrado en la corrida para decisión posterior.
- No se usa floating point para dinero.

### Estado inicial al abrir período
- Si el primer evento del período para un NFT es `unstake`, el motor puede inferir que venía frozen desde `period_start_at` solo si existe un último evento validado anterior que lo dejó en estado `stake/freeze`.
- Si no existe evento anterior suficiente, el NFT no recibe segundos antes del primer `stake` validado dentro del período.

### Salida
- La salida v1 prepara un archivo JSON y/o CSV.
- La salida no ejecuta pago.
- La salida incluye: período, scope de collection/property, política, token, monto total, wallets, items por wallet, segundos, monto asignado, exclusiones y hash/checksum.

## Alcance v1
- Modelo de datos para `distribution_runs`, `distribution_items` y auditoría mínima.
- Servicio puro para calcular intervalos frozen y asignaciones.
- Repositorio server-side para crear drafts, bloquear, finalizar y listar corridas.
- Contratos de salida para claim posterior.
- Tests unitarios y de repositorio.
- Consola admin puede seguir siendo placeholder o pasar a leer corridas si el slice de UI se aprueba.

## Fuera de alcance v1
- Programa notario Anchor.
- Cambios a Stake / Unstake.
- Cambios a mint o plugins Metaplex.
- Ejecución de pagos.
- Claim final.
- Múltiples fórmulas simultáneas en producción.
- Oracle externo de precios.
- Distribución multi-token compleja.

## Riesgos
- Eventos pendientes al cierre del período pueden bloquear finalización.
- Cambios futuros de política no deben alterar corridas finalizadas.
- KYC puede cambiar después del período; la corrida debe guardar snapshot de elegibilidad.
- Redondeo de dinero debe ser explícito y auditable.
- Una consulta incompleta de eventos previos puede calcular mal el estado inicial frozen.

## Criterios de aceptación
1. El artefacto elimina dependencia del programa notario.
2. La jerarquía de verdad queda alineada con BRI-5 y BRI-170.
3. La fórmula v1 queda definida sin floating point.
4. El modelo de estados de distribución distingue `draft`, `blocked`, `finalized` y errores.
5. El plan TDD cubre cálculo temporal, KYC, idempotencia, redondeo y eventos pendientes.
6. El resultado de distribución queda preparado para claim, no ejecutado.
7. Cada corrida reparte únicamente dentro de su `collection_address`/`property_id`.
8. El plan de slices exige TDD, responsabilidad única, gates de clean-code y evidencia antes de cada merge.

## EN

## Status
- Parent issue: `BRI-6`
- Initiative branch: `initiative/bri-6-stake-event-reconciliation-distribution`
- Current slice: `feature/shared-stake-event-distribution-bri-6-s01-spec`
- Type: multi-slice feature
- Artifact status: spec slice

## Context
BRI-6 designs the service that prepares yield distributions from the validated `Stake / Unstake` history defined by BRI-5 and BRI-170.

The current design no longer uses an Anchor notary program. The operating baseline is:

- `Stake` means `freeze`.
- `Unstake` means `unfreeze`.
- Helius observes transactions, but does not decide final truth.
- BRIDS revalidates signatures against canonical RPC before persisting authoritative events.
- `user_profile_stake_events` is a derived, validated, auditable profile projection.
- The BRI-170 UI consumes server-side inventory and states such as `ready_to_stake`, `ready_to_unstake`, `sync_pending`, and recoverable errors.

BRI-6 does not solve Stake / Unstake again. BRI-6 consumes validated events to prepare an auditable distribution result.

## Problem
BRIDS needs to prepare yield distributions in an explainable and auditable way. Today the required inputs are separate:

- validated `stake / unstake` events
- profile KYC and compliance
- treasury or available balance
- placeholder distribution UI

Without a preparation service, there is no deterministic answer for:

- which wallets were eligible in a period
- which NFTs were frozen and for how long
- which amount belongs to each wallet
- which policy was applied
- which events were excluded due to reconciliation, KYC, or missing data
- which file can be used by the later claim process

## Goal
Implement off-chain distribution preparation that:

- reads validated `Stake / Unstake` events
- filters the run by `collection_address` and/or `property_id`
- joins wallets against compliance/KYC
- receives or captures an available treasury snapshot
- calculates pro-rata amounts by validated frozen time
- stores auditable period results
- generates an output file for later claim or execution

## Truth Principles
1. Canonical RPC validates the source transaction before a stake event becomes eligible.
2. BRI-6 only consumes `user_profile_stake_events.validation_status = 'validated'`.
3. Helius is an observer, not an arbiter.
4. Compliance/KYC lives off-chain and decides distribution eligibility.
5. Squads/treasury or a financial snapshot decides available amount.
6. A finalized distribution is not rewritten; corrections require a new run or audit event.

## v1 Decisions

### Periods
- Periods are configurable with `period_start_at` and `period_end_at`.
- The canonical product timezone is `America/Bogota`.
- Calculation uses UTC instants in the database, while the period is defined and audited with `America/Bogota` reference.

### Distribution Scope
- Each run must have an explicit scope.
- Minimum v1 scope:
  - `collection_address`
  - `property_id`
- The engine does not distribute globally across all BRIDS wallets.
- The engine distributes the amount for one specific collection/property among eligible wallets that had NFTs from that scope frozen during the period.
- If future versions support multi-collection bundles, they must be modeled as another `distribution_scope_type`, not as implicit behavior.

### Event Eligibility
- Only events with `validation_status = 'validated'` count.
- Only events whose `collection_address` and `property_id` match the run scope count.
- `pending`, `reconcile_pending`, or `rejected` events cannot enter a finalized distribution.
- If a period has relevant pending events, the run may remain `blocked` or `draft`, but not `finalized`.

### Wallet Eligibility
- A wallet is eligible only when its `compliance_status` is `fully_verified` at preparation or finalization time.
- Wallets in `pending_kyc`, `pending_aml`, `pending_review`, `restricted_aml`, or `suspended` are excluded and must appear in audit output.

### v1 Formula
- Base unit: validated frozen seconds per NFT inside the period.
- The calculation universe is the run collection/property.
- v1 weight: `1` per eligible NFT.
- Wallet contribution: sum of frozen seconds across eligible NFTs.
- Distribution: `wallet_amount = floor(total_amount_minor * wallet_seconds / total_seconds)`.
- Rounding remainder is recorded on the run for later decision.
- Money never uses floating point.

### Initial Period State
- If the first event in the period for an NFT is `unstake`, the engine may infer it was frozen since `period_start_at` only when a prior validated event left it in `stake/freeze`.
- Without sufficient prior event evidence, the NFT receives no seconds before its first validated `stake` inside the period.

### Output
- v1 prepares JSON and/or CSV output.
- v1 does not execute payment.
- Output includes: period, collection/property scope, policy, token, total amount, wallets, wallet items, seconds, allocated amount, exclusions, and hash/checksum.

## v1 Scope
- Data model for `distribution_runs`, `distribution_items`, and minimum audit records.
- Pure service to calculate frozen intervals and allocations.
- Server-side repository to create drafts, block, finalize, and list runs.
- Output contracts for later claim.
- Unit and repository tests.
- Admin console may remain placeholder or move to real run reads if the UI slice is approved.

## Out of Scope
- Anchor notary program.
- Stake / Unstake changes.
- Mint or Metaplex plugin changes.
- Payment execution.
- Final claim.
- Multiple production formulas at once.
- External price oracle.
- Complex multi-token distribution.

## Risks
- Pending events at period close may block finalization.
- Future policy changes must not alter finalized runs.
- KYC may change after the period; the run must store eligibility snapshots.
- Money rounding must be explicit and auditable.
- Incomplete prior-event queries can miscalculate initial frozen state.

## Acceptance Criteria
1. The artifact removes the Anchor notary dependency.
2. Truth hierarchy aligns with BRI-5 and BRI-170.
3. v1 formula is defined without floating point.
4. Distribution states distinguish `draft`, `blocked`, `finalized`, and errors.
5. TDD plan covers temporal calculation, KYC, idempotency, rounding, and pending events.
6. Distribution output is prepared for claim, not executed.
7. Each run distributes only within its `collection_address`/`property_id`.
8. The slice plan requires TDD, single responsibility, clean-code gates, and evidence before every merge.
