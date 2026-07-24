---
type: Feature Spec
title: Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5
description: Feature Discovery BRI-ef Anchor Notary And Freeze Control BRI- 5 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-discovery-brief-anchor-notary-and-freeze-control-bri-5.md
---

# BRI-5 - Brief de discovery para Stake / Unstake con persistencia segura derivada desde Helius

## ES

## Estado
- Slice documental
- Issue padre: `BRI-5`
- Tipo de iniciativa: `feature/*`
- Rama de integracion: `discovery-brief-anchor-notary-and-freeze-control-bri-5`
- Slice actual: `discovery-brief-anchor-notary-and-freeze-control-bri-5-s01-documentation`

## Resumen
- `BRI-5` queda definido por el camino minimo: usar desde la UI el `freeze / unfreeze` ya disponible en los NFTs mintados por BRIDS.
- `stake` significa `freeze`.
- `unstake` significa `unfreeze`.
- `v1` no crea programa Anchor, no crea PDAs, no crea whitelist on-chain y no crea eventos on-chain propios.
- Helius observara las transacciones exitosas y BRIDS persistira esos datos en la base de datos actual como proyeccion derivada exclusiva del perfil del usuario.
- La persistencia debe cumplir un modelo estricto de seguridad: autenticacion de ingestion, deduplicacion, validacion canonica por firma y reconciliacion obligatoria.

## Contexto actual del repo
- La ruta `/protected/stake` ya existe como superficie de producto.
- El flujo de mint ya agrega `FreezeDelegate` con autoridad `Owner` a los NFTs que deben soportar este comportamiento.
- El repo ya usa Postgres server-side, guard de migraciones, TLS endurecido para `pg`, y patrones reales de idempotencia/dedupe de webhooks.
- Eso significa que BRIDS ya tiene la capacidad on-chain necesaria para que el owner haga `freeze` y `unfreeze`, y tambien tiene una base tecnica suficiente para persistir observaciones derivadas sin introducir otra base de datos.

## Problema
- La capacidad on-chain existe, pero la UI todavia no esta cerrada como flujo real de wallet para ejecutar `stake / unstake`.
- Tampoco esta cerrado el contrato de persistencia segura para que los datos observados desde Helius vivan de manera durable y audit-ready en la base de datos de BRIDS.
- Si agregamos ahora un programa propio, PDAs o una whitelist on-chain, aumentariamos complejidad sin necesidad para el objetivo inmediato.

## Objetivo
- Implementar la experiencia de `Stake / Unstake` como accion real de wallet sobre MPL Core.
- Dejar explicito que la fuente de verdad del acto sigue siendo la transaccion confirmada en Solana.
- Persistir en base de datos, a partir de Helius, un historial durable y seguro de `stake / unstake` para lecturas del perfil del usuario, historial del perfil y calculos off-chain.

## Decisiones cerradas

### 1. `v1` usa el camino minimo en cadena
- La feature se resuelve con UI + composicion de transacciones + confirmacion on-chain.
- No se introduce un programa notarial.
- No se introduce una capa adicional de estado on-chain propia de BRIDS.

### 2. `stake` y `unstake` son solo semantica de producto
- En blockchain:
  - `stake` = `freeze`
  - `unstake` = `unfreeze`
- El estado real del asset lo sigue gobernando MPL Core y sus plugins ya instalados.

### 3. No se crean artefactos on-chain nuevos para `v1`
- No hay PDAs nuevos.
- No hay whitelist on-chain.
- No hay eventos on-chain emitidos por un programa propio.
- No hay cuentas historicas propias de BRIDS en cadena.

### 4. Helius es observador, no autoridad final
- La fuente de verdad sigue siendo la transaccion confirmada en Solana.
- Helius actua como capa de observacion/indexacion.
- Un webhook o payload observado no basta por si solo para declarar un evento como autoritativo en la base de datos.

### 5. La base de datos actual es suficiente si se usa con guardrails estrictos
- No se necesita otra base de datos.
- Se reutiliza el Postgres actual del repo.
- La persistencia debe permanecer server-side y nunca exponerse al browser como canal de escritura directa.
- La conexion a DB debe seguir usando la postura endurecida del repo para `pg`.

### 6. La persistencia se separa en dos capas logicas dentro de la misma DB
- Capa 1:
  - ingreso crudo deduplicado de webhook o señal observada
  - puede reutilizar la infraestructura existente de `webhook_events`
- Capa 2:
  - historial derivado de `stake / unstake` validado canonicamente para el perfil del usuario
  - tabla dedicada para consumo del perfil del usuario
- Esto no es “duplicar la base de datos”; es separar ingestión bruta de proyección de negocio dentro del mismo Postgres.

### 7. No hay cortes mensuales ni politica de liquidacion en este scope
- `v1` persiste eventos observados y validados.
- Las ventanas de inicio/fin, cortes mensuales, distribucion y reglas de settlement quedan fuera de este slice.
- Ese trabajo pertenece al microservicio posterior.

### 8. La elegibilidad de producto no se fuerza on-chain en esta version
- Si BRIDS quiere listar solo ciertos NFTs en la UI, ese filtro vive server-side y se apoya en la base de datos actual del producto.
- Esta version no ancla esa elegibilidad en un programa ni en cuentas propias.
- Si luego se necesita enforcement on-chain, eso sera otra iniciativa y no parte de este slice.

### 9. La fuente de elegibilidad BRIDS sale de la base de datos de Candy Machines y collections generadas por nosotros
- La UI no debe mostrar cualquier NFT arbitrario de la wallet conectada.
- Un NFT solo puede aparecer si pertenece a una collection o Candy Machine generada por BRIDS y persistida server-side en la base de datos.
- La fuente de verdad de esa pertenencia debe salir de registros propios de BRIDS como `asset_mint_snapshots` y sus relaciones derivadas, no de datos enviados por el browser.

### 10. La UI solo muestra NFTs actualmente poseidos por la wallet conectada
- La lista visible de `Stake / Unstake` debe limitarse a NFTs actualmente poseidos por la wallet conectada.
- Un NFT no debe aparecer en la UI solo por ser historicamente relevante, elegible por collection o conocido por la base de datos del perfil.
- La persistencia derivada del perfil del usuario no autoriza por si sola la aparicion de activos de terceros en la UI.
- Si un NFT valido de BRIDS sigue poseido por la wallet conectada y su estado actual es `staked` / `freeze`, la UI debe mostrarlo como candidato a `Unstake`.

### 11. La UI debe cubrir todos los estados visibles sin ambiguedad
- La fuente primaria del estado accionable es el estado actual del NFT en cadena, combinado con propiedad actual de la wallet conectada y pertenencia valida a BRIDS.
- La persistencia derivada del perfil solo alimenta historial y superficies de perfil; no puede sobreescribir el estado accionable visible del NFT.
- Los estados minimos de producto para `v1` son:
  - `hidden_non_brids`: el NFT no pertenece a una Candy Machine o collection generada por BRIDS; no se muestra en la UI.
  - `hidden_not_owned`: el NFT pertenece al dominio BRIDS pero ya no es poseido por la wallet conectada; no se muestra en la UI operativa.
  - `disabled_unsupported`: el NFT pertenece a BRIDS y esta en la wallet, pero no soporta `freeze / unfreeze`; puede ocultarse o mostrarse sin accion operativa, pero nunca ofrecer una accion invalida.
  - `ready_to_stake`: el NFT pertenece a BRIDS, esta en la wallet y su estado actual permite `freeze`; la accion visible es `Stake`.
  - `ready_to_unstake`: el NFT pertenece a BRIDS, esta en la wallet y su estado actual es `staked` / `freeze`; la accion visible es `Unstake`.
  - `pending_stake`: el usuario ya firmo o envio una operacion de `Stake` y la UI debe bloquear acciones duplicadas hasta resolucion.
  - `pending_unstake`: el usuario ya firmo o envio una operacion de `Unstake` y la UI debe bloquear acciones duplicadas hasta resolucion.
  - `sync_pending`: la transaccion ya existe o fue observada, pero la persistencia derivada del perfil aun esta pendiente de validacion o reconciliacion; la UI no debe inventar un estado opuesto al de la cadena y debe explicitar el desfase.
  - `action_error`: la accion fallo por rechazo de wallet, falta de autoridad, error RPC o fallo de composicion; la UI debe preservar el ultimo estado valido conocido y mostrar el error.
- Regla de precedencia:
  - propiedad actual + elegibilidad BRIDS deciden si el NFT aparece
  - estado actual del NFT y su capacidad real deciden si la accion visible es `Stake`, `Unstake` o ninguna
  - persistencia derivada del perfil solo complementa historial, badges de sincronizacion y superficies informativas
- Si existe discrepancia temporal entre cadena y base derivada de perfil, la UI debe priorizar la cadena para el estado operativo y marcar la persistencia como pendiente o degradada, no mostrar una accion contradictoria.

## Flujo funcional esperado
1. El usuario entra a `/protected/stake`.
2. La UI lista solo los NFTs que cumplen ambas condiciones:
   - actualmente pertenecen a la wallet conectada
   - pertenecen a una Candy Machine o collection generada por BRIDS y persistida en la base de datos server-side
3. Cuando el usuario pulsa `Stake`, el cliente construye la instruccion real de `freeze`.
4. Cuando el usuario pulsa `Unstake`, el cliente construye la instruccion real de `unfreeze`.
5. El owner firma y envia la transaccion.
6. Una transaccion confirmada en devnet es la fuente de verdad del cambio de estado.
7. Helius observa la transaccion.
8. El backend registra la observacion cruda bajo deduplicacion.
9. El backend revalida canonicamente la transaccion por firma antes de persistir el historial derivado de perfil.
10. Si la validacion no puede cerrarse de inmediato, el evento entra a reconciliacion obligatoria y no se considera final para negocio.

## Requerimientos estrictos de seguridad
- Autenticacion obligatoria de ingestion Helius mediante secreto o header configurado.
- Dedupe obligatorio por `provider + event_id` y fallback por `provider + event_fingerprint`.
- Validacion canonica obligatoria por `tx_signature` antes de persistir el evento de negocio.
- Persistencia append-only o equivalente para el historial derivado del perfil; no se reescriben eventos historicos arbitrariamente.
- Reconciliacion obligatoria para eventos pendientes, retrasados, duplicados o ambiguos.
- La base de datos es una proyeccion derivada de perfil; si hay divergencia, la referencia ultima sigue siendo la cadena.
- La referencia temporal de producto para perfil de usuario debe normalizarse a horario de Bogota (`America/Bogota`).
- Si `block_time` no esta disponible, el evento no debe considerarse temporalmente cerrado para negocio hasta reconciliar un tiempo canónico suficiente o quedar marcado de forma degradada y auditable.
- El orden deterministico minimo de lectura debe usar `slot` + `instruction_index`; los timestamps derivados no desplazan ese orden.

## Alcance de `v1`
- Integracion de la UI `Stake / Unstake` con wallet real
- Composicion, envio y confirmacion de transacciones `freeze / unfreeze`
- Ingestion server-side de datos observados desde Helius
- Persistencia en base de datos del historial derivado de `stake / unstake` para el perfil del usuario
- Dedupe, validacion canonica e idempotencia
- Estados UX de carga, exito y error
- Contrato funcional para consumo posterior desde superficies del perfil del usuario

## Fuera de alcance de `v1`
- Programa Anchor propio
- PDAs
- Whitelist on-chain
- Eventos on-chain propios de BRIDS
- Calculo on-chain de duracion congelada
- Freeze administrativo, recovery flow o multisig operativo
- Enforcement on-chain de elegibilidad BRIDS
- Cortes mensuales, settlement, distribucion o politica de ventanas

## Riesgos y limites reconocidos
- Solo funcionaran los NFTs que realmente tengan habilitado `FreezeDelegate` con autoridad `Owner`.
- Esta version no fuerza elegibilidad BRIDS en cadena; ese filtro queda fuera del runtime on-chain.
- La capa de ingestion debe reconocer correctamente las transacciones reales de `freeze` y `unfreeze`.
- La base de datos es una proyeccion derivada; puede requerir reconciliacion si hay retrasos, reintentos o fallos de ingestion.
- Si luego se quiere semantica BRIDS-especifica en cadena, habra que abrir una iniciativa distinta.

## Resultado esperado
- El usuario puede hacer `Stake / Unstake` desde la UI con una wallet real.
- Cada accion exitosa queda registrada en la blockchain como transaccion real de `freeze` o `unfreeze`.
- Helius observa esas transacciones.
- BRIDS persiste un historial derivado validado para perfil en la base de datos actual, sin crear infraestructura on-chain adicional ni otra base de datos en `v1`.

## Aceptacion del slice documental
1. Queda definido que `v1` no crea programa Anchor.
2. Queda definido que `v1` no crea PDAs ni whitelist on-chain.
3. Queda definido que `Stake / Unstake` usa directamente `freeze / unfreeze` existentes.
4. Queda definido que Helius alimenta una persistencia durable en la base de datos actual.
5. Queda definido que la base de datos es una proyeccion derivada exclusiva del perfil del usuario y no reemplaza la fuente de verdad on-chain.
6. Queda definido que la persistencia exige autenticacion, dedupe, validacion canonica y reconciliacion obligatoria.
7. Queda definido que cortes mensuales y settlement quedan fuera de esta version.
8. Queda definido que la fuente de elegibilidad BRIDS sale de la base de datos server-side de Candy Machines/collections generadas por BRIDS.
9. Queda definido que la UI solo muestra NFTs actualmente poseidos por la wallet conectada.

## Notas de sincronizacion con Linear
- `BRI-5` debe reflejar este artefacto como fuente de verdad para:
  - camino minimo de implementacion
  - ausencia de programa propio en `v1`
  - persistencia segura derivada desde Helius hacia la base de datos actual

## EN

## Status
- Documentation slice
- Parent issue: `BRI-5`
- Initiative type: `feature/*`
- Integration branch: `discovery-brief-anchor-notary-and-freeze-control-bri-5`
- Current slice: `discovery-brief-anchor-notary-and-freeze-control-bri-5-s01-documentation`

## Summary
- `BRI-5` is defined by the minimum path: use the existing NFT `freeze / unfreeze` capability from the UI.
- `stake` means `freeze`.
- `unstake` means `unfreeze`.
- `v1` does not create an Anchor program, does not create PDAs, does not create an on-chain whitelist, and does not create custom on-chain events.
- Helius will observe successful transactions and BRIDS will persist that data in the existing database as a derived projection dedicated exclusively to the user profile.
- Persistence must satisfy a strict security model: authenticated ingestion, deduplication, canonical signature validation, and mandatory reconciliation.

## Current Repo Context
- The `/protected/stake` route already exists as a product surface.
- The mint flow already adds an owner-authorized `FreezeDelegate` to NFTs that should support this behavior.
- The repo already uses server-side Postgres, migration guards, hardened `pg` TLS behavior, and real webhook idempotency/dedupe patterns.
- That means BRIDS already has the required on-chain capability for the owner to perform `freeze` and `unfreeze`, and it also has a sufficient technical base to persist derived observations without introducing another database.

## Problem
- The on-chain capability exists, but the UI is not yet closed as a real wallet flow for `stake / unstake`.
- The secure persistence contract is also not yet closed so that Helius-observed data can live durably and audit-ready in the BRIDS database.
- If we add a custom program, PDAs, or an on-chain whitelist now, we would increase complexity without need for the immediate goal.

## Goal
- Implement the `Stake / Unstake` experience as a real wallet action over MPL Core.
- Make explicit that the source of truth for the act remains the confirmed Solana transaction.
- Persist, from Helius, a durable and secure `stake / unstake` history in the database for user-profile reads, profile history, and off-chain calculations.

## Closed Decisions

### 1. `v1` uses the minimum on-chain path
- The feature is solved through UI + transaction composition + on-chain confirmation.
- No notary program is introduced.
- No BRIDS-specific on-chain state layer is introduced.

### 2. `stake` and `unstake` are only product semantics
- On-chain:
  - `stake` = `freeze`
  - `unstake` = `unfreeze`
- The real asset state continues to be governed by MPL Core and its existing plugins.

### 3. No new on-chain artifacts are created for `v1`
- No new PDAs.
- No on-chain whitelist.
- No on-chain events emitted by a custom program.
- No BRIDS-owned historical accounts on-chain.

### 4. Helius is an observer, not the final authority
- The source of truth remains the confirmed Solana transaction.
- Helius acts as the observation/indexing layer.
- A webhook or observed payload alone is not sufficient to declare a business event authoritative in the database.

### 5. The current database is sufficient if used with strict guardrails
- No second database is needed.
- The current repo Postgres is reused.
- Persistence must remain server-side and must never be exposed to the browser as a direct write channel.
- The DB connection must continue using the repo’s hardened `pg` posture.

### 6. Persistence is split into two logical layers inside the same DB
- Layer 1:
  - deduplicated raw webhook or observed-signal intake
  - can reuse the existing `webhook_events` infrastructure
- Layer 2:
  - canonically validated derived `stake / unstake` history for the user profile
  - dedicated table for user-profile consumption
- This is not “duplicating the database”; it is separating raw ingestion from business projection inside the same Postgres.

### 7. There are no monthly cuts or settlement policy in this scope
- `v1` persists observed and validated events.
- Start/end windows, monthly cuts, distribution, and settlement rules remain outside this slice.
- That work belongs to the later microservice.

### 8. Product eligibility is not enforced on-chain in this version
- If BRIDS wants to list only certain NFTs in the UI, that filter lives server-side and relies on the current product database.
- This version does not anchor that eligibility in a program or custom accounts.
- If on-chain enforcement is needed later, that will be a separate initiative and not part of this slice.

### 9. The BRIDS eligibility source comes from the database of Candy Machines and collections generated by us
- The UI must not show any arbitrary NFT from the connected wallet.
- An NFT may appear only if it belongs to a collection or Candy Machine generated by BRIDS and persisted server-side in the database.
- The source of truth for that membership must come from BRIDS-owned records such as `asset_mint_snapshots` and derived relations, not from browser-supplied data.

### 10. The UI only shows NFTs currently owned by the connected wallet
- The visible `Stake / Unstake` list must be limited to NFTs currently owned by the connected wallet.
- An NFT must not appear in the UI only because it is historically relevant, eligible by collection, or known by the profile database.
- Derived user-profile persistence alone does not authorize third-party assets to appear in the UI.
- If a valid BRIDS NFT is still owned by the connected wallet and its current state is `staked` / `freeze`, the UI must show it as an `Unstake` candidate.

### 11. The UI must cover all visible states without ambiguity
- The primary source of actionable state is the current on-chain NFT state, combined with current connected-wallet ownership and valid BRIDS membership.
- Derived profile persistence only feeds history and profile surfaces; it must not override the visible actionable NFT state.
- The minimum product states for `v1` are:
  - `hidden_non_brids`: the NFT does not belong to a BRIDS-generated Candy Machine or collection; it is not shown in the UI.
  - `hidden_not_owned`: the NFT belongs to the BRIDS domain but is no longer owned by the connected wallet; it is not shown in the operational UI.
  - `disabled_unsupported`: the NFT belongs to BRIDS and is in the wallet, but it does not support `freeze / unfreeze`; it may be hidden or shown without an operational action, but it must never offer an invalid action.
  - `ready_to_stake`: the NFT belongs to BRIDS, is in the wallet, and its current state allows `freeze`; the visible action is `Stake`.
  - `ready_to_unstake`: the NFT belongs to BRIDS, is in the wallet, and its current state is `staked` / `freeze`; the visible action is `Unstake`.
  - `pending_stake`: the user has already signed or sent a `Stake` operation and the UI must block duplicate actions until resolution.
  - `pending_unstake`: the user has already signed or sent an `Unstake` operation and the UI must block duplicate actions until resolution.
  - `sync_pending`: the transaction already exists or was observed, but derived profile persistence is still pending validation or reconciliation; the UI must not invent a state opposite to the chain and must make the lag explicit.
  - `action_error`: the action failed due to wallet rejection, missing authority, RPC failure, or composition error; the UI must preserve the last known valid state and surface the error.
- Precedence rule:
  - current ownership + BRIDS eligibility decide whether the NFT appears
  - current NFT state and real capability decide whether the visible action is `Stake`, `Unstake`, or none
  - derived profile persistence only complements history, sync badges, and informational surfaces
- If there is a temporary divergence between chain state and the derived profile database, the UI must prioritize the chain for operational state and mark persistence as pending or degraded rather than showing a contradictory action.

## Expected Functional Flow
1. The user enters `/protected/stake`.
2. The UI lists only NFTs that satisfy both conditions:
   - they are currently owned by the connected wallet
   - they belong to a BRIDS-generated Candy Machine or collection persisted in the server-side database
3. When the user clicks `Stake`, the client builds the real `freeze` instruction.
4. When the user clicks `Unstake`, the client builds the real `unfreeze` instruction.
5. The owner signs and sends the transaction.
6. A confirmed devnet transaction becomes the source of truth for the state change.
7. Helius observes the transaction.
8. The backend records the raw observation under deduplication.
9. The backend canonically revalidates the transaction by signature before persisting the derived profile history.
10. If validation cannot be closed immediately, the event enters mandatory reconciliation and is not considered final for business use.

## Strict Security Requirements
- Mandatory Helius ingestion authentication through configured secret or auth header.
- Mandatory dedupe by `provider + event_id` with fallback by `provider + event_fingerprint`.
- Mandatory canonical validation by `tx_signature` before persisting the business event.
- Append-only or equivalent persistence for the derived profile history; historical events are not arbitrarily rewritten.
- Mandatory reconciliation for pending, delayed, duplicated, or ambiguous events.
- The database is a derived profile projection; if divergence exists, the chain remains the ultimate reference.
- Product-facing temporal reference for the user profile must be normalized to Bogota time (`America/Bogota`).
- If `block_time` is unavailable, the event must not be considered temporally closed for business use until reconciliation obtains sufficient canonical time or marks it as degraded and auditable.
- Minimum deterministic read order must use `slot` + `instruction_index`; derived timestamps do not override that order.

## `v1` Scope
- `Stake / Unstake` UI integration with a real wallet
- `freeze / unfreeze` transaction composition, sending, and confirmation
- Server-side ingestion of Helius-observed data
- Database persistence of the derived `stake / unstake` history for the user profile
- Dedupe, canonical validation, and idempotency
- UX loading, success, and error states
- Functional contract for later consumption by user-profile surfaces

## Out Of Scope For `v1`
- Custom Anchor program
- PDAs
- On-chain whitelist
- BRIDS custom on-chain events
- On-chain frozen-duration calculation
- Administrative freeze, recovery flow, or operational multisig
- On-chain enforcement of BRIDS eligibility
- Monthly cuts, settlement, distribution, or window policy

## Recognized Risks And Limits
- Only NFTs that actually have an owner-authorized `FreezeDelegate` will work.
- This version does not enforce BRIDS eligibility on-chain; that filter stays outside the runtime.
- The ingestion layer must correctly recognize the real `freeze` and `unfreeze` transactions.
- The database is a derived projection and may require reconciliation when ingestion is delayed, retried, or fails.
- If BRIDS later wants chain-level BRIDS-specific semantics, that will require a separate initiative.

## Expected Outcome
- The user can perform `Stake / Unstake` from the UI with a real wallet.
- Each successful action is recorded on-chain as a real `freeze` or `unfreeze` transaction.
- Helius observes those transactions.
- BRIDS persists a validated derived profile history in the current database, without creating additional on-chain infrastructure or a second database in `v1`.

## Documentation Slice Acceptance
1. It is explicit that `v1` does not create an Anchor program.
2. It is explicit that `v1` does not create PDAs or an on-chain whitelist.
3. It is explicit that `Stake / Unstake` directly uses the existing `freeze / unfreeze` capability.
4. It is explicit that Helius feeds durable persistence in the current database.
5. It is explicit that the database is a derived projection dedicated to the user profile and does not replace on-chain source of truth.
6. It is explicit that persistence requires authentication, dedupe, canonical validation, and mandatory reconciliation.
7. It is explicit that monthly cuts and settlement stay outside this version.
8. It is explicit that the BRIDS eligibility source comes from the server-side database of BRIDS-generated Candy Machines/collections.
9. It is explicit that the UI only shows NFTs currently owned by the connected wallet.

## Linear Sync Notes
- `BRI-5` should reflect this artifact as the source of truth for:
  - the minimum implementation path
  - the absence of a custom program in `v1`
  - secure persistence derived from Helius into the current database
