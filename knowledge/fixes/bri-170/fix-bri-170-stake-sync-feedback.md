---
type: Fix Spec
title: Fix BRI- 170 Stake Sync Feedback
description: Fix BRI- 170 Stake Sync Feedback - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-bri-170-stake-sync-feedback.md
---

# fix: BRI-170 Stake sync feedback and reconciliation polling

## Espanol

## Contexto

En `brids.io`, el usuario pudo firmar Stake para el asset `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`.

La UI mostro primero:

- `Sync pending`
- `On-chain action succeeded, but profile persistence is still syncing.`

Despues de refrescar manualmente la pagina, el mismo asset mostro:

- `Ready to unstake`
- `Asset is currently frozen and can be unfrozen from this wallet.`
- `Unstake`

Esto prueba que el estado on-chain ya habia cambiado, pero la UI no tenia un mecanismo suficientemente claro para indicar progreso por ordinal ni para refrescar el estado sin reload manual.

## Problema

- Falta un loader especifico en el card/boton del ordinal que esta sincronizando.
- La UI no hace polling acotado mientras un asset esta en `sync_pending`.
- El estado local `sync_pending` puede permanecer encima del estado remoto si no se limpia cuando el backend ya responde `ready_to_unstake` o `ready_to_stake`.
- Si la reconciliacion canonica corre antes de que RPC tenga `block_time`, el intento puede quedar en `reconcile_pending` sin retry posterior.

## Reutilizacion desde BRI-5

Este fix no introduce un modelo nuevo. Reutiliza el contrato ya definido en BRI-5:

- `sync_pending` es el estado visible cuando la transaccion ya existe o fue observada, pero la persistencia derivada del perfil aun no cierra validacion o reconciliacion.
- Helius y los webhooks son observadores; la autoridad final es la transaccion confirmada y revalidada por RPC canonico.
- La base de datos es una proyeccion derivada para perfil e historial, no la fuente operativa que decide si un NFT esta congelado.
- Si existe desfase entre cadena y DB, la UI debe hacerlo explicito, bloquear acciones duplicadas y refrescar hasta que el backend devuelva un estado remoto resuelto.
- La reconciliacion por firma para `submitted` y `reconcile_pending` es obligatoria antes de tratar la proyeccion de perfil como cerrada.

## Evidencia BRI-170

- Asset: `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`
- Firma: `5ub9mqZEsDP3T1NU15Bmx6Ts5d5jSygiijzWt4UFPNXS1GEh9jxjEGbyvyi21WFSwGWf1vSbnprYiZBz63auLYNR`
- RPC devnet: `finalized`, `err: null`, slot `467252031`
- Block time: `2026-06-05T05:07:52.000Z`
- Intento DB: `972a9d93-a821-49ec-81c0-4493a71535f0`
- Estado DB observado: `reconcile_pending`
- `attempt.updated_at`: `2026-06-05T05:08:09.670Z`
- Latencia de block time a primer estado de reconciliacion: ~17.7s
- Evento de perfil: no existia al momento de la inspeccion; no se pudo medir latencia final de persistencia porque el evento no fue creado.

## Alcance

S01 - Artefacto y evidencia

- Documentar el problema, la medicion y los slices.
- Asociar el trabajo a `BRI-170`.

S02 - Feedback visual por ordinal

- Mostrar spinner en el card/boton del asset mientras su estado efectivo sea `sync_pending`, `pending_stake` o `pending_unstake`.
- Mantener el card operativamente bloqueado para acciones duplicadas.
- No bloquear toda la pagina despues de que `/submit` ya respondio.

S03 - Polling y reconciliacion de estado

- Hacer polling acotado de `/api/protected/stake/assets` mientras exista al menos un asset en `sync_pending`.
- Limpiar estado local cuando el backend devuelva un estado remoto resuelto.
- Reintentar reconciliacion canonica de intentos `submitted` o `reconcile_pending` con firma antes de calcular el estado visible de assets.

S04 - Pruebas y cierre

- Tests de componente para loader por card y auto-refresh sin reload manual.
- Tests de servicio para retry de reconciliacion pendiente.
- `npm run validate`.
- Actualizacion de Linear `BRI-170`.

## Fuera de alcance

- WebSocket/SSE dedicado.
- Cambios en el programa on-chain.
- Cambios de schema o migraciones.
- Mainnet.

## English

## Context

On `brids.io`, the user signed Stake for asset `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`.

The UI first showed:

- `Sync pending`
- `On-chain action succeeded, but profile persistence is still syncing.`

After a manual refresh, the same asset showed:

- `Ready to unstake`
- `Asset is currently frozen and can be unfrozen from this wallet.`
- `Unstake`

This proves the on-chain state had already changed, but the UI did not have clear enough per-ordinal progress feedback or a refresh mechanism that avoids manual reload.

## Problem

- The specific ordinal card/button needs its own loader while it is syncing.
- The UI does not run bounded polling while an asset is in `sync_pending`.
- Local `sync_pending` state can stay layered over the remote state unless it is cleared once the backend returns `ready_to_unstake` or `ready_to_stake`.
- If canonical reconciliation runs before RPC exposes `block_time`, the attempt can remain `reconcile_pending` without a later retry.

## Reuse From BRI-5

This fix does not introduce a new model. It reuses the contract already defined in BRI-5:

- `sync_pending` is the visible state when the transaction already exists or was observed, but derived profile persistence has not closed validation or reconciliation yet.
- Helius and webhooks are observers; the final authority is the confirmed transaction revalidated through canonical RPC.
- The database is a derived projection for profile and history, not the operational source that decides whether an NFT is frozen.
- If chain and DB temporarily diverge, the UI must make that lag explicit, block duplicate actions, and refresh until the backend returns a resolved remote state.
- Signature reconciliation for `submitted` and `reconcile_pending` is mandatory before treating the profile projection as closed.

## BRI-170 Evidence

- Asset: `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`
- Signature: `5ub9mqZEsDP3T1NU15Bmx6Ts5d5jSygiijzWt4UFPNXS1GEh9jxjEGbyvyi21WFSwGWf1vSbnprYiZBz63auLYNR`
- Devnet RPC: `finalized`, `err: null`, slot `467252031`
- Block time: `2026-06-05T05:07:52.000Z`
- DB attempt: `972a9d93-a821-49ec-81c0-4493a71535f0`
- Observed DB state: `reconcile_pending`
- `attempt.updated_at`: `2026-06-05T05:08:09.670Z`
- Latency from block time to first reconciliation state: ~17.7s
- Profile event: missing at inspection time; final persistence latency could not be measured because the event was not created.

## Scope

S01 - Artifact and evidence

- Document the problem, measurement, and slices.
- Associate the work with `BRI-170`.

S02 - Per-ordinal visual feedback

- Show a spinner in the asset card/button while its effective state is `sync_pending`, `pending_stake`, or `pending_unstake`.
- Keep the card operationally blocked against duplicate actions.
- Do not block the whole page after `/submit` has already responded.

S03 - Polling and state reconciliation

- Run bounded polling of `/api/protected/stake/assets` while at least one asset is `sync_pending`.
- Clear local state when the backend returns a resolved remote state.
- Retry canonical reconciliation for `submitted` or `reconcile_pending` attempts with signatures before computing visible asset state.

S04 - Tests and closeout

- Component tests for card loader and auto-refresh without manual reload.
- Service tests for pending reconciliation retry.
- `npm run validate`.
- Linear `BRI-170` update.

## Out of Scope

- Dedicated WebSocket/SSE.
- On-chain program changes.
- Schema changes or migrations.
- Mainnet.
