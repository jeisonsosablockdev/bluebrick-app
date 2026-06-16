---
type: Feature Spec
title: Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5 Implementation
description: Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5 Implementation - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5-implementation.md
---

# implementation(feature): Stake / Unstake UI con persistencia segura derivada desde Helius

## ES

## Estado
- Artefacto de solucion
- Fase actual: solo slice documental
- Rama de integracion: `discovery-brief-anchor-notary-and-freeze-control-bri-5`
- Slice actual: `discovery-brief-anchor-notary-and-freeze-control-bri-5-s01-documentation`
- Depende de:
  - `docs/features/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5.md`
  - `lib/core-candy-machine-admin.ts`
  - `app/protected/stake/page.tsx`
  - `components/dashboard/stake-module.tsx`
  - patrones de persistencia relacional ya presentes en el repo

## Objetivo
- Definir una arquitectura ejecutable para `v1` sin programa nuevo.
- Implementar `Stake / Unstake` como integracion de UI y wallet sobre el `freeze / unfreeze` ya habilitado en los NFTs de BRIDS.
- Persistir en la base de datos actual, desde Helius, un historial durable y seguro de eventos observados para lecturas del perfil del usuario y calculos off-chain.

## Arquitectura cerrada de `v1`

### 1. La capacidad on-chain ya existe
- El flujo de mint ya agrega `FreezeDelegate` con autoridad `Owner`.
- `v1` reutiliza esa capacidad y no cambia el modelo de control del asset.
- Semantica del producto:
  - `stake` = `freeze`
  - `unstake` = `unfreeze`

### 2. `v1` no introduce runtime propio
- No hay programa Anchor.
- No hay PDAs.
- No hay whitelist on-chain.
- No hay eventos on-chain emitidos por BRIDS.
- No hay cuentas historicas propias en cadena.

### 3. La UI ejecuta la accion real
- Cuando el usuario pulsa `Stake`, el cliente construye la instruccion real de `freeze`.
- Cuando el usuario pulsa `Unstake`, el cliente construye la instruccion real de `unfreeze`.
- La wallet del owner firma y envia la transaccion.
- La transaccion confirmada es la fuente de verdad del cambio.

### 4. Helius observa y el backend persiste
- Helius actua como capa de observacion/indexacion del resultado on-chain.
- El backend de BRIDS traduce esa observacion a persistencia segura en la base actual.
- La base de datos se convierte en una proyeccion durable exclusiva para el perfil del usuario, su historial y sus vistas derivadas dentro del producto.

### 5. Blockchain truth primero, base de datos despues
- La blockchain es la fuente de verdad del acto.
- Helius es la capa de lectura/indexacion.
- La base de datos es una proyeccion derivada y persistida para consumo del perfil del usuario.
- Si hubiera divergencia entre capas, la referencia final es la transaccion confirmada en cadena.

### 6. No hay logica de distribucion ni cortes temporales en `v1`
- `v1` persiste eventos observados y validados.
- No calcula ventanas mensuales, inicios/cierres de periodo ni settlement.
- Esa logica pertenece al microservicio posterior y queda fuera de este diseño.

## Superficies de implementacion
- Ruta protegida:
  - `/protected/stake`
- UI principal:
  - `components/dashboard/stake-module.tsx`
- Superficie cliente a crear o adaptar:
  - modulo de composicion de transacciones `freeze / unfreeze`
- Superficie de ingestion server-side:
  - consumidor Helius por webhook y/o reconciliacion por firma
- Superficie de persistencia:
  - reutilizacion de `webhook_events` para ingreso deduplicado crudo
  - migracion SQL nueva para historial derivado de perfil
  - repositorio de lectura/escritura para historial derivado de perfil
- Superficies consumidoras:
  - perfil
  - historial del perfil

## Requerimientos estrictos de seguridad

### Autenticacion de ingreso
- La ruta de ingestion Helius debe exigir autenticacion configurada.
- El secreto o auth header no es opcional para este flujo sensible.
- Un request sin credenciales validas debe ser rechazado antes de cualquier efecto de persistencia.

### Dedupe e idempotencia
- La observacion cruda debe deduplicarse por:
  - `provider + event_id` cuando exista
  - `provider + event_fingerprint` como fallback
- La persistencia derivada del evento de negocio debe ser idempotente.
- Reintentos de Helius o reprocesos internos no deben generar filas funcionales duplicadas.

### Validacion canonica obligatoria
- Ningun evento de negocio se considera autoritativo solo por haber llegado en el payload de Helius.
- Antes de persistir el historial derivado de perfil, el backend debe revalidar la transaccion por `tx_signature`.
- La validacion minima debe comprobar:
  - la firma esperada
  - que la transaccion este resuelta exitosamente
  - `slot`
  - la accion real (`freeze` o `unfreeze`)
  - el asset involucrado
  - el owner o autoridad relevante cuando aplique

### Reconciliacion obligatoria
- Webhook-first no significa webhook-only.
- Si la validacion canonica no puede cerrarse en el primer intento, el evento debe entrar en estado de reconciliacion pendiente.
- Debe existir replay o backfill por firma para cerrar incertidumbre operacional.

### Persistencia append-only de negocio
- El historial derivado de `stake / unstake` debe tratarse como un historial de perfil del usuario.
- No se deben reescribir eventos historicos para “corregir” negocio.
- Las correcciones se resuelven via nuevos eventos, estados de validacion o reprocesos controlados.

## Modelo de persistencia propuesto

### Capa 1: ingreso crudo deduplicado
- Reutilizar `webhook_events` del repo cuando sea compatible.
- Objetivo:
  - retener evidencia cruda de ingreso
  - absorber duplicados
  - registrar estado de procesamiento
- Esta capa no define por si sola el historial final de perfil consumible por negocio.

### Capa 2: historial derivado de perfil
- Tabla sugerida:
  - `user_profile_stake_events`
- Rol:
  - guardar el historial durable de acciones observadas desde Helius y validadas canonicamente para el perfil del usuario
  - servir como fuente de consulta del perfil sin depender de lecturas en vivo cada vez

### Campos minimos sugeridos para `user_profile_stake_events`
- `id`
- `webhook_event_id`
- `asset_address`
- `owner_wallet`
- `collection_address`
- `candy_machine_address`
- `product_action`
  - `stake`
  - `unstake`
- `blockchain_action`
  - `freeze`
  - `unfreeze`
- `tx_signature`
- `instruction_index`
- `slot`
- `canonical_timezone`
- `block_time`
- `observed_at`
- `validation_status`
  - `pending`
  - `validated`
  - `reconcile_pending`
  - `rejected`
- `validation_error`

### Restricciones minimas sugeridas
- unicidad idempotente del ingreso crudo:
  - reutilizar la proteccion existente de `webhook_events`
- unicidad idempotente del historial derivado de perfil:
  - `UNIQUE (tx_signature, asset_address, blockchain_action, instruction_index)`
- indices de consulta:
  - `asset_address`
  - `owner_wallet`
  - `collection_address`
  - `block_time`
  - `validation_status`

### Politica de verdad
- Se persisten eventos observados y validados, no un estado agregado obligatorio en `v1`.
- El estado actual puede derivarse del ultimo evento validado conocido por asset.
- Si luego hace falta una proyeccion materializada de estado actual o reglas de distribucion, eso va en otro slice.

## Modelo de validacion

### Validacion de origen BRIDS en server-side DB
- La UI solo debe considerar NFTs cuya collection o Candy Machine pertenezca al inventario generado por BRIDS y persistido server-side.
- La fuente de verdad para esa pertenencia debe salir de la base de datos actual del repo, no del browser.
- La referencia primaria debe ser evidencia server-authoritative como `asset_mint_snapshots` y relaciones derivadas compatibles.

### Validacion de propiedad visible en UI
- La UI solo debe listar NFTs actualmente poseidos por la wallet conectada.
- La elegibilidad BRIDS no basta si el asset ya no pertenece a la wallet activa.
- Datos historicos persistidos del perfil no deben reinyectar en la UI activos actualmente poseidos por terceros.
- Si un NFT BRIDS valido sigue poseido por la wallet conectada y su estado actual es `staked` / `freeze`, la UI debe presentarlo con accion disponible `Unstake`.

### Modelo de estados visibles en UI
- La UI debe resolver cada NFT dentro de un conjunto finito y explicito de estados.
- La persistencia derivada del perfil no decide el estado operativo del NFT; solo complementa historial y sincronizacion visible.
- Los estados minimos de `v1` son:
  - `hidden_non_brids`
  - `hidden_not_owned`
  - `disabled_unsupported`
  - `ready_to_stake`
  - `ready_to_unstake`
  - `pending_stake`
  - `pending_unstake`
  - `sync_pending`
  - `action_error`
- Contrato por estado:
  - `hidden_non_brids`: no renderizar el asset en la UI operativa.
  - `hidden_not_owned`: no renderizar el asset en la UI operativa aunque exista historial derivado.
  - `disabled_unsupported`: no ofrecer `Stake` ni `Unstake`; si se muestra, debe quedar como no operable.
  - `ready_to_stake`: renderizar CTA `Stake`.
  - `ready_to_unstake`: renderizar CTA `Unstake`.
  - `pending_stake`: bloquear interaccion duplicada, mostrar estado transitorio y conservar referencia a la firma si ya existe.
  - `pending_unstake`: bloquear interaccion duplicada, mostrar estado transitorio y conservar referencia a la firma si ya existe.
  - `sync_pending`: mostrar que el historial/perfil aun no cierra sincronizacion, pero sin contradecir el ultimo estado on-chain conocido.
  - `action_error`: mantener el ultimo estado valido conocido y mostrar el error sin mutar artificialmente a la accion opuesta.
- Regla de precedencia para resolver el estado:
  - ownership actual y origen BRIDS deciden visibilidad
  - capacidad real del asset y ultimo estado on-chain conocido deciden la accion operativa
  - persistencia derivada solo agrega informacion de historial, confirmacion y sincronizacion
- Si hay divergencia entre cadena y base derivada del perfil, gana la cadena para el estado operativo.

### Validacion de actor
- El signer debe ser el owner del NFT o la wallet con capacidad valida para ejecutar la accion esperada.
- Si la wallet no tiene autoridad efectiva, la transaccion debe fallar y la UI debe surfacer el error.

### Validacion de capacidad del asset
- El NFT debe tener habilitado el plugin necesario para `freeze / unfreeze` bajo autoridad `Owner`.
- Si el asset no soporta esa operacion, la UI no debe ofrecer la accion o debe manejar el rechazo de forma clara.
- Si el asset soporta `unfreeze` y su ultimo estado valido conocido es `staked` / `freeze`, la accion primaria visible debe ser `Unstake`.

### Validacion de persistencia derivada
- El backend no debe inventar eventos.
- Solo deben persistirse acciones observadas desde Helius que correspondan a transacciones efectivamente resueltas y revalidadas.
- Payloads irrelevantes o ambiguos deben terminar en `rejected` o `reconcile_pending`, no en `validated`.

### Validacion temporal
- `v1` no genera timestamps propios.
- El tiempo util para auditoria se toma desde la observacion de la transaccion confirmada:
  - `slot`
  - `block_time` cuando exista
  - `observed_at` como metrica operativa de ingestion, no como verdad blockchain
- La referencia temporal de producto debe normalizarse a `America/Bogota`.
- Si `block_time` llega `null`, el evento no pasa a lectura final de perfil como temporalmente cerrado hasta reconciliacion o marca degradada auditable.
- El orden deterministico minimo de lectura es:
  - `slot`
  - `instruction_index`
  - `tx_signature`

## Flujo cliente / wallet / persistencia
1. La UI lista los NFTs elegibles bajo reglas de producto de BRIDS.
   - solo si actualmente pertenecen a la wallet conectada
   - solo si pertenecen a una Candy Machine o collection generada por BRIDS y persistida server-side
2. El usuario selecciona un asset en `/protected/stake`.
3. Si pulsa `Stake`, el cliente construye la operacion de `freeze`.
4. Si pulsa `Unstake`, el cliente construye la operacion de `unfreeze`.
5. La wallet firma y envia la transaccion.
6. El cliente espera confirmacion y conserva la firma de la transaccion.
7. Helius observa la transaccion resultante.
8. El backend persiste primero la observacion cruda deduplicada.
9. El backend ejecuta validacion canonica por firma.
10. Si valida correctamente, hace upsert idempotente del evento en `user_profile_stake_events` con estado `validated`.
11. Si no puede validar de inmediato, registra `reconcile_pending`.
12. Perfil, historial del perfil u otras superficies equivalentes leen despues solo desde la capa derivada aprobada para negocio.

## Contrato de observabilidad off-chain
- La fuente de verdad es la transaccion exitosa ya incluida en la cadena.
- El consumidor de Helius debe poder resolver y persistir:
  - firma
  - asset
  - owner
  - accion (`freeze` o `unfreeze`)
  - equivalente de producto (`stake` o `unstake`)
  - `slot`
  - tiempo indexado
- `v1` no promete un evento BRIDS-especifico; promete que la accion real ocurre en cadena y luego se persiste como proyeccion durable y validada.

## No objetivos de `v1`
- Programa Anchor propio
- PDAs
- Whitelist on-chain
- Eventos on-chain propios
- Calculo on-chain de duracion congelada
- Enforcement on-chain de elegibilidad BRIDS
- Freeze administrativo o recovery flow
- Cortes mensuales, settlement o proyecciones de distribucion

## Riesgos tecnicos
- Si el NFT no tiene el plugin correcto, la accion no podra ejecutarse aunque la UI la muestre.
- La capa de ingestion debe reconocer correctamente las transacciones reales de `freeze / unfreeze`.
- Reintentos de Helius o reprocesos manuales requieren idempotencia estricta en persistencia.
- Como no hay whitelist on-chain en `v1`, cualquier filtro por collection o Candy Machine queda como responsabilidad de producto fuera del runtime.
- La base de datos puede quedar temporalmente por detras de la cadena si Helius o el pipeline de ingestion sufren retrasos.

## Plan de slices

### S01 - documentacion
- cerrar el camino minimo
- eliminar dependencias de programa propio
- fijar el contrato de persistencia segura derivada desde Helius

### S02 - cliente transaccional
- conectar `Stake / Unstake` con wallet real
- construir y enviar `freeze / unfreeze`
- manejar estados `idle`, `pending`, `success`, `error`
- conservar firma de transaccion para trazabilidad

### S03 - persistencia Helius -> DB
- decidir reutilizacion exacta de `webhook_events`
- definir migracion de `user_profile_stake_events`
- implementar repositorio, idempotencia y estados de validacion
- cablear ingestion Helius y reconciliacion obligatoria por firma

### S04 - integracion de producto
- actualizar superficies de perfil e historial de perfil para leer desde base de datos
- asegurar que la fuente de elegibilidad BRIDS salga de DB server-side (`asset_mint_snapshots` o read model derivado compatible)
- asegurar que `Stake / Unstake` solo renderiza activos actualmente poseidos por la wallet conectada
- resolver explicitamente todos los estados definidos de UI para evitar CTAs contradictorios o duplicados
- propagar estados de transaccion y trazabilidad a las superficies visibles
- refinar criterio de elegibilidad mostrado en UI

### S05 - pruebas y evidencia
- pruebas del flujo cliente
- pruebas de persistencia, idempotencia y dedupe
- validacion devnet con firmas reales
- evidencia de que Helius puede observar, BRIDS puede validar y BRIDS puede persistir

## Contrato de tests primero

### Pruebas de cliente
- no listar NFTs poseidos por la wallet si no pertenecen a Candy Machines/collections generadas por BRIDS
- no listar NFTs que no pertenezcan actualmente a la wallet conectada
- listar NFTs BRIDS actualmente poseidos y en estado `staked` / `freeze` con accion `Unstake`
- listar NFTs BRIDS actualmente poseidos y en estado elegible no congelado con accion `Stake`
- no ofrecer CTAs operativas a NFTs `disabled_unsupported`
- bloquear dobles envios mientras el asset este en `pending_stake` o `pending_unstake`
- mostrar `sync_pending` cuando exista desfase entre cadena y persistencia derivada sin invertir la accion operativa
- render de accion correcta segun estado del asset
- bloqueo de accion cuando no hay wallet o no hay capacidad valida
- composicion correcta de `freeze`
- composicion correcta de `unfreeze`
- manejo de errores de firma, envio y confirmacion
- actualizacion UX despues de exito o fallo

### Pruebas de persistencia
- request Helius sin auth valida devuelve `401`
- insercion deduplicada en `webhook_events`
- insercion de evento `stake` validado
- insercion de evento `unstake` validado
- deduplicacion por firma + asset + accion + `instruction_index`
- payload ambiguo termina en `reconcile_pending`
- payload irrelevante termina en `rejected`
- lectura ordenada por `block_time` y `slot`

### Validacion final
- pruebas dirigidas de cliente
- pruebas dirigidas de repositorio/persistencia
- transacciones reales en devnet para `freeze` y `unfreeze`
- firmas reales capturadas como evidencia
- verificacion de observabilidad posterior en Helius y lectura persistida en DB

## Tooling esperado
- `@metaplex-foundation/mpl-core`
- dependencias cliente ya presentes en el repo para wallet y transacciones
- Helius como capa de observacion
- Postgres del repo como capa de persistencia durable
- evidencia devnet real para aceptacion blockchain/NFT

## Criterios de salida para este slice
- Queda definido que `v1` no introduce programa ni cuentas on-chain propias.
- Queda definido que `Stake / Unstake` usa directamente la capacidad existente del NFT.
- Queda definido que la trazabilidad durable se persiste en la base de datos actual exclusivamente para el perfil del usuario a partir de Helius.
- Queda definido que la persistencia exige autenticacion, dedupe, validacion canonica y reconciliacion obligatoria.
- Queda definido que la base de datos es una proyeccion derivada y no la fuente de verdad ultima.
- Queda definido que cualquier enforcement BRIDS-especifico en cadena y cualquier logica de settlement quedan fuera de esta version.

## EN

## Status
- Solution artifact
- Current phase: documentation slice only
- Integration branch: `discovery-brief-anchor-notary-and-freeze-control-bri-5`
- Current slice: `discovery-brief-anchor-notary-and-freeze-control-bri-5-s01-documentation`
- Depends on:
  - `docs/features/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5.md`
  - `lib/core-candy-machine-admin.ts`
  - `app/protected/stake/page.tsx`
  - `components/dashboard/stake-module.tsx`
  - relational persistence patterns already present in the repo

## Goal
- Define an executable `v1` architecture without introducing a new program.
- Implement `Stake / Unstake` as a UI and wallet integration over the `freeze / unfreeze` capability already enabled on BRIDS NFTs.
- Persist, in the current database and from Helius observations, a durable and secure history of observed events for user-profile reads and off-chain calculations.

## Closed `v1` Architecture

### 1. The on-chain capability already exists
- The mint flow already adds an owner-authorized `FreezeDelegate`.
- `v1` reuses that capability and does not change the asset-control model.
- Product semantics:
  - `stake` = `freeze`
  - `unstake` = `unfreeze`

### 2. `v1` introduces no custom runtime
- No Anchor program.
- No PDAs.
- No on-chain whitelist.
- No BRIDS-emitted on-chain events.
- No BRIDS-owned historical accounts on-chain.

### 3. The UI executes the real action
- When the user clicks `Stake`, the client builds the real `freeze` instruction.
- When the user clicks `Unstake`, the client builds the real `unfreeze` instruction.
- The owner wallet signs and sends the transaction.
- The confirmed transaction is the source of truth for the state change.

### 4. Helius observes and the backend persists
- Helius acts as the observation/indexing layer for the on-chain result.
- The BRIDS backend translates that observation into secure persistence in the current database.
- The database becomes a durable projection dedicated exclusively to the user profile, its history, and derived in-product views.

### 5. Blockchain truth first, database second
- The blockchain is the source of truth for the act.
- Helius is the read/indexing layer.
- The database is a derived and persisted projection for user-profile consumption.
- If there is divergence between layers, the final reference is the confirmed on-chain transaction.

### 6. There is no distribution logic or temporal cut policy in `v1`
- `v1` persists observed and validated events.
- It does not calculate monthly windows, period opens/closes, or settlement.
- That logic belongs to the later microservice and stays outside this design.

## Implementation Surfaces
- Protected route:
  - `/protected/stake`
- Main UI:
  - `components/dashboard/stake-module.tsx`
- Client surface to create or adapt:
  - `freeze / unfreeze` transaction composition module
- Server-side ingestion surface:
  - Helius consumer by webhook and/or signature reconciliation
- Persistence surface:
  - reuse of `webhook_events` for deduplicated raw intake
  - new SQL migration for the derived profile history
  - read/write repository for derived profile history
- Consumer surfaces:
  - profile
  - profile history

## Strict Security Requirements

### Ingestion authentication
- The Helius ingestion route must require configured authentication.
- Secret or auth header is not optional for this sensitive flow.
- A request without valid credentials must be rejected before any persistence side effect.

### Dedupe and idempotency
- Raw observation must be deduplicated by:
  - `provider + event_id` when available
  - `provider + event_fingerprint` as fallback
- Derived business-event persistence must be idempotent.
- Helius retries or internal reprocessing must not generate duplicate functional rows.

### Mandatory canonical validation
- No business event becomes authoritative only because it arrived in a Helius payload.
- Before persisting the derived profile history, the backend must revalidate the transaction by `tx_signature`.
- Minimum validation must check:
  - the expected signature
  - that the transaction resolved successfully
  - `slot`
  - the real action (`freeze` or `unfreeze`)
  - the asset involved
  - the owner or relevant authority when applicable

### Mandatory reconciliation
- Webhook-first does not mean webhook-only.
- If canonical validation cannot be closed on the first attempt, the event must enter `reconcile_pending`.
- Replay or backfill by signature must exist to close operational uncertainty.

### Append-only business persistence
- The derived `stake / unstake` history must be treated as user-profile history.
- Historical business events must not be arbitrarily rewritten.
- Corrections must be handled through new events, validation states, or controlled reprocessing.

## Proposed Persistence Model

### Layer 1: deduplicated raw intake
- Reuse repo `webhook_events` where compatible.
- Purpose:
  - retain raw intake evidence
  - absorb duplicates
  - record processing state
- This layer alone does not define the final user-profile history consumable by the business layer.

### Layer 2: derived profile history
- Suggested table:
  - `user_profile_stake_events`
- Role:
  - store durable history of Helius-observed actions that have been canonically validated for the user profile
  - serve user-profile reads without depending on live chain reads every time

### Suggested minimum fields for `user_profile_stake_events`
- `id`
- `webhook_event_id`
- `asset_address`
- `owner_wallet`
- `collection_address`
- `candy_machine_address`
- `product_action`
  - `stake`
  - `unstake`
- `blockchain_action`
  - `freeze`
  - `unfreeze`
- `tx_signature`
- `instruction_index`
- `slot`
- `canonical_timezone`
- `block_time`
- `observed_at`
- `validation_status`
  - `pending`
  - `validated`
  - `reconcile_pending`
  - `rejected`
- `validation_error`

### Suggested minimum constraints
- raw intake idempotency:
  - reuse the existing `webhook_events` protections
- derived profile-history idempotency:
  - `UNIQUE (tx_signature, asset_address, blockchain_action, instruction_index)`
- query indexes:
  - `asset_address`
  - `owner_wallet`
  - `collection_address`
  - `block_time`
  - `validation_status`

### Truth policy
- Persist observed and validated events, not a mandatory aggregated state in `v1`.
- Current state can be derived from the latest known validated event per asset.
- If a materialized current-state projection or distribution rules become necessary later, that belongs to another slice.

## Validation Model

### BRIDS-origin validation in server-side DB
- The UI must only consider NFTs whose collection or Candy Machine belongs to the inventory generated by BRIDS and persisted server-side.
- The source of truth for that membership must come from the current repo database, not from the browser.
- The primary reference should be server-authoritative evidence such as `asset_mint_snapshots` and compatible derived relations.

### Visible ownership validation in UI
- The UI must list only NFTs currently owned by the connected wallet.
- BRIDS eligibility alone is not sufficient if the asset no longer belongs to the active wallet.
- Persisted profile history must not re-inject into the UI assets currently owned by third parties.
- If a valid BRIDS NFT is still owned by the connected wallet and its current state is `staked` / `freeze`, the UI must present it with available `Unstake` action.

### Visible UI state model
- The UI must resolve each NFT into a finite and explicit set of states.
- Derived profile persistence does not decide the NFT operational state; it only complements visible history and sync status.
- The minimum `v1` states are:
  - `hidden_non_brids`
  - `hidden_not_owned`
  - `disabled_unsupported`
  - `ready_to_stake`
  - `ready_to_unstake`
  - `pending_stake`
  - `pending_unstake`
  - `sync_pending`
  - `action_error`
- State contract:
  - `hidden_non_brids`: do not render the asset in the operational UI.
  - `hidden_not_owned`: do not render the asset in the operational UI even if derived history exists.
  - `disabled_unsupported`: do not offer `Stake` or `Unstake`; if shown, it must remain non-operable.
  - `ready_to_stake`: render `Stake` CTA.
  - `ready_to_unstake`: render `Unstake` CTA.
  - `pending_stake`: block duplicate interaction, show transient status, and preserve the signature reference if already available.
  - `pending_unstake`: block duplicate interaction, show transient status, and preserve the signature reference if already available.
  - `sync_pending`: show that history/profile sync is not closed yet, without contradicting the latest known on-chain state.
  - `action_error`: keep the last known valid state and surface the error without artificially mutating to the opposite action.
- Precedence rule for resolving state:
  - current ownership and BRIDS origin decide visibility
  - real asset capability and the latest known on-chain state decide the operational action
  - derived persistence only adds history, confirmation, and synchronization information
- If there is divergence between chain state and the derived profile database, chain state wins for the operational state.

### Actor validation
- The signer must be the NFT owner or the wallet with valid authority to execute the expected action.
- If the wallet lacks effective authority, the transaction must fail and the UI must surface the error.

### Asset capability validation
- The NFT must have the required plugin enabled for owner-authorized `freeze / unfreeze`.
- If the asset does not support that operation, the UI should not offer the action or should handle the rejection clearly.
- If the asset supports `unfreeze` and its latest known valid state is `staked` / `freeze`, the primary visible action must be `Unstake`.

### Derived persistence validation
- The backend must not invent events.
- Only Helius-observed actions corresponding to effectively resolved and revalidated transactions may be persisted.
- Irrelevant or ambiguous payloads must end in `rejected` or `reconcile_pending`, never directly in `validated`.

### Temporal validation
- `v1` does not generate custom timestamps.
- Useful audit time comes from the observation of the confirmed transaction:
  - `slot`
  - `block_time` when available
  - `observed_at` as operational ingestion timing, not blockchain truth
- Product-facing temporal reference must be normalized to `America/Bogota`.
- If `block_time` is `null`, the event must not advance to final profile-read status as temporally closed until reconciliation or an auditable degraded mark.
- Minimum deterministic read order is:
  - `slot`
  - `instruction_index`
  - `tx_signature`

## Client / Wallet / Persistence Flow
1. The UI lists eligible NFTs under BRIDS product rules.
   - only if they are currently owned by the connected wallet
   - only if they belong to a BRIDS-generated Candy Machine or collection persisted server-side
2. The user selects an asset on `/protected/stake`.
3. If the user clicks `Stake`, the client builds the `freeze` operation.
4. If the user clicks `Unstake`, the client builds the `unfreeze` operation.
5. The wallet signs and sends the transaction.
6. The client waits for confirmation and preserves the transaction signature.
7. Helius observes the resulting transaction.
8. The backend first persists the deduplicated raw observation.
9. The backend runs canonical signature validation.
10. If validation succeeds, it performs an idempotent upsert into `user_profile_stake_events` with status `validated`.
11. If validation cannot complete immediately, it records `reconcile_pending`.
12. Profile, profile history, and equivalent surfaces later read only from the derived layer approved for business use.

## Off-Chain Observability Contract
- The source of truth is the successful transaction already included on-chain.
- The Helius consumer must be able to resolve and persist:
  - signature
  - asset
  - owner
  - action (`freeze` or `unfreeze`)
  - product equivalent (`stake` or `unstake`)
  - `slot`
  - indexed time
- `v1` does not promise a BRIDS-specific event; it promises that the real action occurs on-chain and is then persisted as a durable validated projection.

## Non-Goals For `v1`
- Custom Anchor program
- PDAs
- On-chain whitelist
- Custom on-chain events
- On-chain frozen-duration calculation
- On-chain enforcement of BRIDS eligibility
- Administrative freeze or recovery flow
- Monthly cuts, settlement, or distribution projections

## Technical Risks
- If the NFT does not have the correct plugin, the action cannot execute even if the UI shows it.
- The ingestion layer must correctly recognize the real `freeze / unfreeze` transactions.
- Helius retries or manual reprocessing require strict persistence idempotency.
- Because there is no on-chain whitelist in `v1`, any collection or Candy Machine filtering remains a product responsibility outside the runtime.
- The database may temporarily lag behind the chain if Helius or the ingestion pipeline is delayed.

## Slice Plan

### S01 - documentation
- close the minimum path
- remove dependency on a custom program
- lock the secure derived persistence contract from Helius

### S02 - transactional client
- connect `Stake / Unstake` to a real wallet
- build and send `freeze / unfreeze`
- handle `idle`, `pending`, `success`, `error` states
- preserve transaction signature for traceability

### S03 - Helius -> DB persistence
- decide exact reuse shape of `webhook_events`
- define the `user_profile_stake_events` migration
- implement repository, idempotency, and validation states
- wire Helius ingestion and mandatory signature reconciliation

### S04 - product integration
- update profile surfaces and profile history to read from the database
- ensure the BRIDS eligibility source comes from server-side DB (`asset_mint_snapshots` or a compatible derived read model)
- ensure `Stake / Unstake` only renders assets currently owned by the connected wallet
- explicitly resolve all defined UI states to avoid contradictory or duplicated CTAs
- propagate transaction states and traceability to visible surfaces
- refine the eligibility criteria shown in the UI

### S05 - tests and evidence
- client flow tests
- persistence, idempotency, and dedupe tests
- devnet validation with real signatures
- evidence that Helius can observe, BRIDS can validate, and BRIDS can persist

## Tests-First Contract

### Client tests
- do not list wallet-owned NFTs if they do not belong to BRIDS-generated Candy Machines/collections
- do not list NFTs that are not currently owned by the connected wallet
- list currently owned BRIDS NFTs in `staked` / `freeze` state with `Unstake` action
- list currently owned BRIDS NFTs in eligible non-frozen state with `Stake` action
- do not offer operational CTAs to `disabled_unsupported` NFTs
- block double submissions while the asset is in `pending_stake` or `pending_unstake`
- show `sync_pending` when there is lag between chain state and derived persistence without inverting the operational action
- render the correct action for each asset state
- block the action when there is no wallet or no valid capability
- correct `freeze` composition
- correct `unfreeze` composition
- signature, send, and confirmation error handling
- UX updates after success or failure

### Persistence tests
- Helius request without valid auth returns `401`
- deduplicated insertion into `webhook_events`
- insert validated `stake` event
- insert validated `unstake` event
- deduplicate by signature + asset + action + `instruction_index`
- ambiguous payload ends in `reconcile_pending`
- irrelevant payload ends in `rejected`
- ordered reads by `block_time` and `slot`

### Final validation
- focused client tests
- focused repository/persistence tests
- real devnet transactions for `freeze` and `unfreeze`
- real signatures captured as evidence
- verification of later observability in Helius and persisted DB reads

## Expected Tooling
- `@metaplex-foundation/mpl-core`
- existing client-side wallet and transaction dependencies already present in the repo
- Helius as the observation layer
- repo Postgres as the durable persistence layer
- real devnet evidence for blockchain/NFT acceptance

## Exit Criteria For This Slice
- It is explicit that `v1` introduces no custom program or on-chain accounts.
- It is explicit that `Stake / Unstake` directly uses the NFT's existing capability.
- It is explicit that durable traceability is persisted in the current database exclusively for the user profile from Helius observations.
- It is explicit that persistence requires authentication, dedupe, canonical validation, and mandatory reconciliation.
- It is explicit that the database is a derived projection and not the ultimate source of truth.
- It is explicit that any BRIDS-specific on-chain enforcement and any settlement logic stay outside this version.
