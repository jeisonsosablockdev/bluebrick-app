---
type: Feature Spec
title: Feature App Investor Dashboard Overview Real Data BRI- 171
description: Feature App Investor Dashboard Overview Real Data BRI- 171 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-investor-dashboard-overview-real-data-bri-171.md
---

# BRI-171 - Investor Dashboard Overview with real data

## ES

## Estado
- Issue padre: `BRI-171`
- Linear URL: `https://linear.app/brids-app/issue/BRI-171/feature-investor-dashboard-overview-real-data`
- Rama de iniciativa canónica: `initiative/bri-171-investor-dashboard-overview-real-data`
- Slice actual: `feature/app-investor-dashboard-overview-real-data-bri-171-s01-documentation`
- Tipo: feature multi-slice
- Estado de este artefacto: listo para revisión documental

## Contexto
La ruta `Investor Dashboard / Overview` vive en `/protected` y hoy renderiza `components/dashboard/overview-module.tsx`.

Ese módulo aún muestra métricas locales/mock:

- `Valor invertido`
- `Número de Fracciones`
- `Rentas acumuladas`
- `Rentas claimables`
- estado general
- gráficos genéricos

Después de BRI-5, BRI-6 y BRI-170 ya existen fuentes reales suficientes para diseñar este dashboard sin mock data:

- sesión protegida y wallet autenticada desde `resolveAppAuthContext`
- perfil/KYC/compliance en `user_profiles` y repositorios de compliance
- compras/mints reconciliados en `purchase_attempts`, con asset verification cuando aplica
- inventario BRIDS server-side desde wallet + DAS, filtrado por `marketplace_entries` y `asset_mint_snapshots`
- estado `Stake / Unstake` desde BRI-170
- historial persistido de `user_profile_stake_events` desde BRI-5/BRI-170
- preparación de distribuciones desde BRI-6 en `distribution_runs` y `distribution_items`

## Problema
El Overview es una superficie sensible porque resume valor, propiedad, elegibilidad y actividad del inversionista. Si sigue usando mock data, el usuario puede ver saldos, rentas o cantidades que no corresponden a su wallet real.

El problema no es solo visual. También existe un riesgo de confianza:

- mostrar activos que la wallet ya no posee
- mezclar datos de perfil con datos de otra wallet
- presentar rentas como claimables cuando solo son distribuciones preparadas
- calcular métricas monetarias en el cliente
- usar la wallet conectada del navegador como autoridad sin validación server-side
- duplicar lógica que ya existe en Stake, Historial, Compras y Distribuciones

## Objetivo
Reemplazar el Overview mock por una lectura real, server-authoritative y audit-friendly para el inversionista autenticado.

El resultado esperado es que `/protected` muestre un resumen real de:

- perfil y compliance del usuario
- wallet autenticada y estado de vínculo de cuenta
- NFTs BRIDS actualmente poseídos por esa wallet
- valor invertido confirmado desde compras persistidas
- estado operativo de los NFTs: disponibles, frozen/staked, sync pending o no soportados
- actividad reciente de stake/unstake validada o pendiente de reconciliación
- distribuciones preparadas/finalizadas de BRI-6 cuando existan

## Fuente de verdad
La fuente de verdad v1 es compuesta, pero jerárquica.

1. La sesión protegida decide la identidad de cuenta.
2. La wallet autenticada server-side decide qué wallet puede consultarse.
3. La base de datos de perfil conserva información de usuario, KYC, compliance y proyecciones persistidas.
4. La base de datos de compras conserva intentos confirmados y assets verificados cuando el mint fue procesado por BRIDS.
5. DAS/RPC consultado desde servidor confirma posesión actual de NFTs BRIDS por la wallet.
6. BRI-5/BRI-170 conservan eventos `stake / unstake` validados en `user_profile_stake_events`.
7. BRI-6 conserva resultados de distribución preparados o finalizados en `distribution_runs` y `distribution_items`.

La UI no es fuente de verdad. El navegador solo presenta el DTO devuelto por el servidor.

## Reglas de seguridad y confianza
- El endpoint debe derivar `walletPublicKey` desde sesión/cookies server-side, no desde query params enviados por cliente.
- Si hay sesión federada sin wallet vinculada, el Overview debe mostrar estado de cuenta incompleto, no métricas de wallet.
- Si hay conflicto entre sesión WorkOS y wallet, no se consulta data de inversión.
- No se aceptan métricas monetarias enviadas por el cliente.
- No se presentan NFTs que no estén actualmente en la wallet autenticada.
- No se presentan NFTs que no pertenezcan al inventario BRIDS validado por servidor.
- No se usa data mock como fallback de producción.
- Helius/DAS pueden observar inventario, pero el servidor filtra contra las colecciones/candy machines BRIDS verificadas.
- Los valores monetarios se expresan en unidades menores o formatos derivados server-side; no se calcula dinero con floating point en UI.

## Métricas v1 propuestas
Las métricas deben nombrarse según el contrato real de datos, no según promesas futuras.

### Valor invertido
Fuente principal:

- `purchase_attempts` confirmados por `wallet_public_key`
- `prepared_price_lamports` o precio persistido equivalente
- `quantity`
- `property_id`, `collection_address`, `candy_machine_address`

Regla:

- contar solo compras confirmadas/reconciliadas
- excluir intentos fallidos, preparados o submitted no confirmados
- si el asset fue transferido fuera de la wallet, el monto puede seguir apareciendo como histórico invertido, pero debe diferenciarse de holdings actuales

### Fracciones actualmente poseídas
Fuente principal:

- inventario server-side de wallet vía DAS/RPC
- filtro contra `marketplace_entries`
- filtro contra `asset_mint_snapshots.verification_status = 'verified'`

Regla:

- contar solo NFTs BRIDS actualmente poseídos por la wallet autenticada
- no usar supply esperado de la Candy Machine como cantidad poseída
- no mostrar NFTs de colecciones no verificadas en BRIDS

### Estado operativo de fracciones
Fuente principal:

- contrato de `listStakeAssetsForWallet`
- BRI-170 visible states: `ready_to_stake`, `ready_to_unstake`, `sync_pending`, `disabled_unsupported`

Regla:

- reutilizar o extraer el read-model de Stake para evitar duplicar validación de owner freeze delegate
- mostrar `sync_pending` explícitamente cuando la acción on-chain fue exitosa pero la persistencia de perfil aún no cerró

### Actividad reciente
Fuente principal:

- `user_profile_stake_events` por `owner_wallet`
- orden por `COALESCE(block_time, observed_at) DESC`

Regla:

- separar `validated`, `pending`, `reconcile_pending` y `rejected`
- no presentar eventos pendientes como finalizados

### Distribuciones / rentas preparadas
Fuente principal:

- `distribution_items.wallet_public_key`
- join con `distribution_runs`
- solo corridas `finalized` o estados explícitos definidos por BRI-6

Regla:

- no llamar “claimable” a una distribución si no existe ledger o contrato de claim que lo respalde
- en v1, el Overview puede mostrar `Distribuciones preparadas` o `Rentas registradas`, según el estado real
- si BRI-6 aún no está migrado en el ambiente, el módulo debe degradar esta sección sin romper todo el Overview

## Estados UX requeridos
- `loading`: skeletons del Overview sin valores inventados
- `wallet_required`: cuenta autenticada pero sin wallet operativa para inversiones
- `empty`: wallet válida sin NFTs BRIDS elegibles
- `partial`: datos principales cargan, pero alguna fuente secundaria está degradada
- `ready`: todas las fuentes principales responden
- `sync_pending`: hay acciones de stake/unstake confirmadas on-chain pendientes de persistencia
- `error`: falla de lectura no recuperable

## Alcance v1
- Crear un servicio server-side `InvestorOverview` que agregue datos existentes.
- Crear endpoint protegido para `/api/protected/overview` o equivalente.
- Reemplazar mock data de `OverviewModule`.
- Reutilizar contratos existentes de Stake, Historial, Compras, Perfil y BRI-6 cuando sea posible.
- Definir DTO explícito para que la UI solo presente datos ya calculados.
- Cubrir estados de carga, vacío, error, parcial y sync pending.
- Mantener i18n actual.
- Mantener responsive QA del dashboard protegido.

## Fuera de alcance v1
- Programa Anchor nuevo.
- Nueva fuente on-chain de verdad.
- Cambios a mint/deploy de Candy Machines.
- Cambios al plugin FreezeDelegate.
- Claim final o payout.
- Cálculo financiero en cliente.
- Reportes fiscales o statements descargables.
- Reemplazo completo de Portfolio, Rentas o Historial.
- Mostrar rentas claimables si aún no existe ledger de claim.

## Dependencias
- BRI-5: modelo de eventos `stake / unstake` y persistencia de perfil.
- BRI-6: preparación de distribuciones y tablas `distribution_*`.
- BRI-170: inventario server-side, estados de Stake y validación de owner freeze delegate.
- Módulo de perfil/KYC: `user_profiles`, `kyc_cases`, compliance.
- Módulo de compras/mint: `purchase_attempts`, asset verification y reconciliación.

## Riesgos
- La migración de BRI-6 debe estar aplicada en el ambiente antes de depender de `distribution_*`.
- El inventario por wallet puede cambiar entre lecturas; el servicio debe tolerar datos parcialmente desactualizados.
- Si se mezclan holdings actuales con inversión histórica, el copy debe distinguirlos.
- Si una fuente secundaria falla, el Overview no debe caer a mock data.
- Consultas DAS/RPC pueden introducir latencia; el servicio debe tener límites, timeouts o degradación clara.
- Reutilizar lógica de Stake sin extraer read-model puede generar duplicación.

## Criterios de aceptación documental
1. El problema de mock data en Overview queda explícito.
2. La fuente de verdad queda alineada con BRI-5, BRI-6 y BRI-170.
3. El diseño distingue DB, wallet actual y datos derivados.
4. El diseño no llama claimable a datos que no tengan ledger de claim.
5. Los estados UX cubren wallet sin activos, sync pending, partial data y errores.
6. Los slices están definidos con TDD antes de implementación.
7. No hay implementación hasta revisión del documento.

## Preguntas abiertas para revisión
- ¿El primer release debe mostrar “Valor invertido histórico” aunque el NFT haya sido vendido/transferido fuera de la wallet?
- ¿Preferimos nombrar la métrica de BRI-6 como “Rentas registradas”, “Distribuciones preparadas” o “Rentas finalizadas”?
- ¿El Overview debe incluir CTA a Stake/Unstake cuando existan assets `ready_to_stake` o solo resumir el estado?
- ¿La sección de actividad reciente debe limitarse a Stake/Unstake o incluir compras confirmadas?

## EN

## Status
- Parent issue: `BRI-171`
- Linear URL: `https://linear.app/brids-app/issue/BRI-171/feature-investor-dashboard-overview-real-data`
- Canonical initiative branch: `initiative/bri-171-investor-dashboard-overview-real-data`
- Current slice: `feature/app-investor-dashboard-overview-real-data-bri-171-s01-documentation`
- Type: multi-slice feature
- Artifact status: ready for documentation review

## Context
The `Investor Dashboard / Overview` route lives at `/protected` and currently renders `components/dashboard/overview-module.tsx`.

That module still shows local/mock metrics:

- `Invested value`
- `Number of Fractions`
- `Accumulated yield`
- `Claimable yield`
- general status
- generic charts

After BRI-5, BRI-6, and BRI-170, enough real sources exist to design this dashboard without mock data:

- protected session and authenticated wallet from `resolveAppAuthContext`
- profile/KYC/compliance in `user_profiles` and compliance repositories
- reconciled purchases/mints in `purchase_attempts`, with asset verification when applicable
- server-side BRIDS inventory from wallet + DAS, filtered by `marketplace_entries` and `asset_mint_snapshots`
- `Stake / Unstake` state from BRI-170
- persisted `user_profile_stake_events` history from BRI-5/BRI-170
- distribution preparation from BRI-6 in `distribution_runs` and `distribution_items`

## Problem
Overview is a sensitive surface because it summarizes investor value, ownership, eligibility, and activity. If it keeps using mock data, the user can see balances, yield, or counts that do not belong to the real wallet.

The problem is not only visual. It is also a trust risk:

- showing assets the wallet no longer owns
- mixing profile data with another wallet
- presenting yield as claimable when it is only a prepared distribution
- calculating money metrics in the client
- treating the browser-connected wallet as authority without server-side validation
- duplicating logic that already exists in Stake, History, Purchases, and Distributions

## Goal
Replace the mock Overview with a real, server-authoritative, audit-friendly read for the authenticated investor.

The expected result is for `/protected` to show a real summary of:

- user profile and compliance
- authenticated wallet and account-link status
- BRIDS NFTs currently owned by that wallet
- confirmed invested value from persisted purchases
- operational NFT state: available, frozen/staked, sync pending, or unsupported
- recent validated or reconciliation-pending stake/unstake activity
- prepared/finalized BRI-6 distributions when available

## Source of Truth
The v1 source of truth is composite, but hierarchical.

1. The protected session decides account identity.
2. The server-authenticated wallet decides which wallet can be queried.
3. The profile database stores user information, KYC, compliance, and persisted projections.
4. The purchase database stores confirmed attempts and verified assets when the mint was processed by BRIDS.
5. Server-side DAS/RPC confirms current BRIDS NFT ownership by wallet.
6. BRI-5/BRI-170 store validated `stake / unstake` events in `user_profile_stake_events`.
7. BRI-6 stores prepared or finalized distribution results in `distribution_runs` and `distribution_items`.

The UI is not a source of truth. The browser only presents the DTO returned by the server.

## Security And Trust Rules
- The endpoint must derive `walletPublicKey` from server-side session/cookies, not client query params.
- If there is a federated session without a linked wallet, Overview shows incomplete account state, not investment metrics.
- If there is a WorkOS/wallet session conflict, investment data is not queried.
- Client-submitted money metrics are never accepted.
- NFTs not currently owned by the authenticated wallet are not shown.
- NFTs outside server-validated BRIDS inventory are not shown.
- Production never falls back to mock data.
- Helius/DAS can observe inventory, but the server filters against verified BRIDS collections/candy machines.
- Money values use minor units or server-derived formatting; the UI does not calculate money with floating point.

## Proposed v1 Metrics
Metric names must match the real data contract, not future promises.

### Invested Value
Primary source:

- confirmed `purchase_attempts` by `wallet_public_key`
- `prepared_price_lamports` or equivalent persisted price
- `quantity`
- `property_id`, `collection_address`, `candy_machine_address`

Rule:

- count only confirmed/reconciled purchases
- exclude failed, prepared, or submitted-but-unconfirmed attempts
- if the asset was transferred out of the wallet, the amount may still appear as historical invested value, but must be distinguished from current holdings

### Currently Owned Fractions
Primary source:

- server-side wallet inventory through DAS/RPC
- filter against `marketplace_entries`
- filter against `asset_mint_snapshots.verification_status = 'verified'`

Rule:

- count only BRIDS NFTs currently owned by the authenticated wallet
- do not use expected Candy Machine supply as owned quantity
- do not show NFTs from collections not verified by BRIDS

### Operational Fraction State
Primary source:

- `listStakeAssetsForWallet` contract
- BRI-170 visible states: `ready_to_stake`, `ready_to_unstake`, `sync_pending`, `disabled_unsupported`

Rule:

- reuse or extract the Stake read model to avoid duplicating owner freeze delegate validation
- show `sync_pending` explicitly when the on-chain action succeeded but profile persistence has not closed yet

### Recent Activity
Primary source:

- `user_profile_stake_events` by `owner_wallet`
- order by `COALESCE(block_time, observed_at) DESC`

Rule:

- separate `validated`, `pending`, `reconcile_pending`, and `rejected`
- do not present pending events as finalized

### Prepared Distributions / Yield
Primary source:

- `distribution_items.wallet_public_key`
- join with `distribution_runs`
- only `finalized` runs or explicit states defined by BRI-6

Rule:

- do not call a distribution “claimable” if no claim ledger or claim contract backs it
- in v1, Overview may show `Prepared distributions` or `Registered yield`, depending on the real state
- if BRI-6 is not migrated in the environment yet, this section must degrade without breaking the whole Overview

## Required UX States
- `loading`: Overview skeletons without invented values
- `wallet_required`: authenticated account but no operational investment wallet
- `empty`: valid wallet without eligible BRIDS NFTs
- `partial`: primary data loaded, but some secondary source is degraded
- `ready`: all primary sources respond
- `sync_pending`: there are on-chain-confirmed stake/unstake actions pending profile persistence
- `error`: non-recoverable read failure

## v1 Scope
- Create a server-side `InvestorOverview` service that aggregates existing data.
- Create a protected endpoint for `/api/protected/overview` or equivalent.
- Replace mock data in `OverviewModule`.
- Reuse existing Stake, History, Purchases, Profile, and BRI-6 contracts where possible.
- Define an explicit DTO so the UI only presents precomputed data.
- Cover loading, empty, error, partial, and sync pending states.
- Keep current i18n.
- Keep protected dashboard responsive QA.

## Out of Scope
- New Anchor program.
- New on-chain source of truth.
- Candy Machine mint/deploy changes.
- FreezeDelegate plugin changes.
- Final claim or payout.
- Client-side financial calculation.
- Tax reports or downloadable statements.
- Full replacement of Portfolio, Yield, or History.
- Showing claimable yield when no claim ledger exists yet.

## Dependencies
- BRI-5: `stake / unstake` event model and profile persistence.
- BRI-6: distribution preparation and `distribution_*` tables.
- BRI-170: server-side inventory, Stake states, and owner freeze delegate validation.
- Profile/KYC module: `user_profiles`, `kyc_cases`, compliance.
- Purchase/mint module: `purchase_attempts`, asset verification, and reconciliation.

## Risks
- The BRI-6 migration must be applied in the environment before relying on `distribution_*`.
- Wallet inventory can change between reads; the service must tolerate partially stale data.
- If current holdings and historical investment are mixed, copy must distinguish them.
- If a secondary source fails, Overview must not fall back to mock data.
- DAS/RPC queries can add latency; the service needs limits, timeouts, or clear degradation.
- Reusing Stake logic without extracting a read model can create duplication.

## Documentation Acceptance Criteria
1. The Overview mock-data problem is explicit.
2. The source of truth is aligned with BRI-5, BRI-6, and BRI-170.
3. The design distinguishes DB data, current wallet ownership, and derived data.
4. The design does not call data claimable without a claim ledger.
5. UX states cover no wallet assets, sync pending, partial data, and errors.
6. Slices are defined with TDD before implementation.
7. No implementation starts until the document is reviewed.

## Open Questions For Review
- Should the first release show “Historical invested value” even when the NFT was sold/transferred out of the wallet?
- Should the BRI-6 metric be named “Registered yield”, “Prepared distributions”, or “Finalized yield”?
- Should Overview include CTAs to Stake/Unstake when assets are `ready_to_stake`, or only summarize state?
- Should recent activity be limited to Stake/Unstake, or include confirmed purchases too?
