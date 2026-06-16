---
type: Fix Spec
title: Fix BRI- 170 Stake Blockhash Expiry Retry
description: Fix BRI- 170 Stake Blockhash Expiry Retry - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-bri-170-stake-blockhash-expiry-retry.md
---

# fix: BRI-170 Stake blockhash expiry recovery

## Espanol

## Contexto

Durante `Unstake` del asset `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`, el primer intento fallo con:

- `Transaction simulation failed: Blockhash not found`

El segundo intento si paso. Esto indica que la transaccion firmada en el primer intento uso un blockhash que ya no era valido cuando el backend intento enviarla.

## Diagnostico Solana

Una transaccion firmada no puede refrescar su blockhash sin invalidar la firma. Si el blockhash expira, el flujo correcto es reconstruir la transaccion, pedir una firma nueva y reenviar.

## Problema en BRIDS

- El backend mapea el error como `TRANSACTION_FAILED` generico.
- La UI queda en `action_error`, que no ofrece una accion clara de retry en el card.
- El usuario necesita refrescar o repetir manualmente sin una explicacion precisa.

## Alcance

S01 - Artefacto

- Documentar el caso y la decision: error recuperable, no reintento automatico de una firma vieja.

S02 - API Stake Submit

- Detectar errores RPC de blockhash expirado.
- Marcar el intento como fallido con mensaje recuperable.
- Responder `409` con codigo `BLOCKHASH_EXPIRED` y `recoverable: true`.

S03 - UI Stake / Unstake

- Al recibir `BLOCKHASH_EXPIRED`, limpiar el estado local bloqueante.
- Mostrar mensaje localizado que indique que la ventana de firma expiro y que debe intentar de nuevo.
- Mantener disponible la accion original para generar una transaccion fresca.

S04 - Pruebas y cierre

- Tests de servicio para clasificar `Blockhash not found`.
- Tests de route para exponer `recoverable`.
- Tests de UI para permitir retry sin reload.
- `npm run validate`.

## Fuera de alcance

- Reintentar automaticamente con la firma vieja.
- Cambios on-chain.
- Cambios de schema o migraciones.
- Durable nonce.

## English

## Context

During `Unstake` for asset `12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt`, the first attempt failed with:

- `Transaction simulation failed: Blockhash not found`

The second attempt succeeded. This indicates the signed transaction in the first attempt used a blockhash that was no longer valid when the backend tried to send it.

## Solana Diagnosis

A signed transaction cannot refresh its blockhash without invalidating the signature. If the blockhash expires, the correct flow is to rebuild the transaction, request a fresh signature, and send again.

## BRIDS Problem

- The backend maps the error as generic `TRANSACTION_FAILED`.
- The UI remains in `action_error`, which does not offer a clear card-level retry action.
- The user has to refresh or retry manually without a precise explanation.

## Scope

S01 - Artifact

- Document the case and decision: recoverable error, not automatic retry with an old signature.

S02 - Stake Submit API

- Detect expired blockhash RPC errors.
- Mark the attempt failed with a recoverable message.
- Return `409` with code `BLOCKHASH_EXPIRED` and `recoverable: true`.

S03 - Stake / Unstake UI

- On `BLOCKHASH_EXPIRED`, clear the blocking local state.
- Show localized copy explaining that the signing window expired and the user must try again.
- Keep the original action available so the user can generate a fresh transaction.

S04 - Tests and closeout

- Service tests for classifying `Blockhash not found`.
- Route tests exposing `recoverable`.
- UI tests allowing retry without reload.
- `npm run validate`.

## Out of Scope

- Automatic retry with the old signature.
- On-chain changes.
- Schema changes or migrations.
- Durable nonce.
