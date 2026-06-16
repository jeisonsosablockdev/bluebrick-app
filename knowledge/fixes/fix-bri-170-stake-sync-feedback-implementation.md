---
type: Fix Spec
title: Fix BRI- 170 Stake Sync Feedback Implementation
description: Fix BRI- 170 Stake Sync Feedback Implementation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-bri-170-stake-sync-feedback-implementation.md
---

# implementation(fix): BRI-170 Stake sync feedback and reconciliation polling

## Espanol

## Slices

### S01 - Artefacto y evidencia

Estado: completado.

Objetivo:

- Registrar el caso productivo observado para `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`.
- Dejar claro que la transaccion llego a estado finalizado on-chain, pero la persistencia derivada quedo incompleta.

Evidencia inicial:

- Firma: `5ub9mqZEsDP3T1NU15Bmx6Ts5d5jSygiijzWt4UFPNXS1GEh9jxjEGbyvyi21WFSwGWf1vSbnprYiZBz63auLYNR`
- RPC: `finalized`, `err: null`
- Block time: `2026-06-05T05:07:52.000Z`
- DB intento: `reconcile_pending`
- Diferencia `attempt.updated_at - block_time`: ~17.7s
- Evento de perfil: ausente al momento de la inspeccion.

Reutilizacion BRI-5:

- Mantener `sync_pending` como estado de desfase entre accion on-chain y persistencia derivada de perfil.
- Mantener cadena/RPC canonico como autoridad operativa.
- Mantener DB como proyeccion derivada de perfil, no como fuente de verdad on-chain.
- Convertir la reconciliacion por firma de `submitted` y `reconcile_pending` en retry obligatorio durante el listado de assets.

### S02 - Feedback visual por ordinal

Estado: completado.

Cambios esperados:

- Agregar un spinner pequeño y accesible en el boton/card del ordinal cuando el estado efectivo sea de procesamiento.
- Mantener texto localizado.
- No cambiar el overlay global usado durante firma de wallet.

Implementado:

- Card y badge muestran spinner local para `pending_stake`, `pending_unstake` y `sync_pending`.
- El boton del ordinal muestra `Syncing profile...` durante `sync_pending` en vez de `No action available`.
- El overlay global se conserva solo para la firma/envio on-chain.

### S03 - Polling y reconciliacion de estado

Estado: completado.

Cambios esperados:

- Polling acotado mientras exista `sync_pending`.
- Limpieza de estado local cuando el backend ya devuelve estado resuelto.
- Retry canonico de intentos `submitted` y `reconcile_pending` con `tx_signature` al listar assets.

Implementado:

- Polling acotado cada `4s` hasta `120s` mientras exista `sync_pending`.
- Limpieza de estado local solo cuando el backend devuelve el estado remoto esperado, para evitar mostrar un estado viejo como si fuera resolucion.
- `/api/protected/stake/assets` reintenta reconciliacion canonica para firmas en `submitted` o `reconcile_pending` antes de calcular el estado visible.
- El retry esta acotado a 10 firmas por listado para no convertir la lectura de assets en un backfill completo.

### S04 - Pruebas y cierre

Estado: completado.

Validacion esperada:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/lib/stake-webhook-reconciliation.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

Validacion ejecutada:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-assets.test.ts tests/lib/stake-service-submit.test.ts tests/lib/stake-webhook-reconciliation.test.ts` - passed, 4 files / 10 tests.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.
- `git diff --check` - passed.

Clean-code:

- Sin hallazgos bloqueantes.
- Se separo la seleccion de firmas retryables de la ejecucion de reconciliacion para mantener funciones pequeñas y legibles.
- No se agregaron rutas viejas, fallback huerfano, migraciones ni cambios de schema.

## English

## Slices

### S01 - Artifact and evidence

Status: completed.

Goal:

- Record the production case observed for `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`.
- Make clear that the transaction reached finalized on-chain state, but derived persistence remained incomplete.

Initial evidence:

- Signature: `5ub9mqZEsDP3T1NU15Bmx6Ts5d5jSygiijzWt4UFPNXS1GEh9jxjEGbyvyi21WFSwGWf1vSbnprYiZBz63auLYNR`
- RPC: `finalized`, `err: null`
- Block time: `2026-06-05T05:07:52.000Z`
- DB attempt: `reconcile_pending`
- Difference `attempt.updated_at - block_time`: ~17.7s
- Profile event: missing at inspection time.

BRI-5 reuse:

- Keep `sync_pending` as the lag state between the on-chain action and derived profile persistence.
- Keep chain/canonical RPC as the operational authority.
- Keep the DB as a derived profile projection, not as on-chain truth.
- Convert signature reconciliation for `submitted` and `reconcile_pending` into a mandatory retry while listing assets.

### S02 - Per-ordinal visual feedback

Status: completed.

Expected changes:

- Add a small accessible spinner in the ordinal button/card while the effective state is processing.
- Keep localized copy.
- Do not change the global overlay used during wallet signature.

Implemented:

- The card and badge show a local spinner for `pending_stake`, `pending_unstake`, and `sync_pending`.
- The ordinal button shows `Syncing profile...` during `sync_pending` instead of `No action available`.
- The global overlay remains limited to wallet signing/on-chain submission.

### S03 - Polling and state reconciliation

Status: completed.

Expected changes:

- Bounded polling while any asset remains `sync_pending`.
- Clear local state once the backend returns a resolved state.
- Canonical retry for `submitted` and `reconcile_pending` attempts with `tx_signature` while listing assets.

Implemented:

- Bounded polling every `4s` up to `120s` while any asset remains `sync_pending`.
- Local state clears only when the backend returns the expected resolved remote state, avoiding old-state flicker.
- `/api/protected/stake/assets` retries canonical reconciliation for signatures in `submitted` or `reconcile_pending` before computing visible state.
- Retry is capped at 10 signatures per listing so asset reads do not become a full backfill job.

### S04 - Tests and closeout

Status: completed.

Expected validation:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-submit.test.ts tests/lib/stake-webhook-reconciliation.test.ts`
- `npm run lint`
- `npm run typecheck`
- `npm run validate`

Executed validation:

- `npx vitest run tests/components/stake-module.test.ts tests/lib/stake-service-assets.test.ts tests/lib/stake-service-submit.test.ts tests/lib/stake-webhook-reconciliation.test.ts` - passed, 4 files / 10 tests.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.
- `git diff --check` - passed.

Clean-code:

- No blocking findings.
- Retryable signature selection was separated from reconciliation execution to keep functions small and readable.
- No old routes, orphan fallback, migrations, or schema changes were added.
