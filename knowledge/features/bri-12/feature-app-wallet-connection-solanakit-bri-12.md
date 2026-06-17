---
type: Feature Spec
title: Feature App Wallet Connection Solanakit BRI- 12
description: Feature App Wallet Connection Solanakit BRI- 12 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-wallet-connection-solanakit-bri-12.md
---

# BRI-12: Wallet Connection Migration to `@solana/kit`

## Scope
- Migrar la superficie de conexion/auth de wallet para eliminar uso directo de `@solana/web3.js` en este flujo.
- Endurecer persistencia de estado de autenticacion entre pestañas/ventanas.

## Changes
- `lib/auth.ts`
  - Reemplaza conversion de `PublicKey` de `@solana/web3.js` por `address(...)` + `getAddressEncoder()` de `@solana/kit`.
  - Conserva verificacion criptografica SIWS en servidor con `tweetnacl`.
- `components/WalletModal.tsx`
  - Fortalece resolucion de `publicKey` tras `connect()` para evitar carreras de estado.
  - Agrega sincronizacion cross-window via `BroadcastChannel` y `storage` event.
  - Revalida sesion en `focus` y `visibilitychange`.
  - Emite eventos de sync en `login` y `logout`.
- `lib/auth-sync.ts`
  - Nuevo canal de sincronizacion (`AUTH_SYNC_BROADCAST_CHANNEL`) y parser robusto para payloads de canal/storage.
- `tests/lib/auth.test.ts`
  - Migra fixtures de firma a primitives de `@solana/kit` (`generateKeyPairSigner`, `createSignableMessage`).
- `eslint.config.mjs`
  - Endurece allowlist: se retiran `lib/auth.ts`, `lib/solana.ts`, `tests/lib/auth.test.ts`, `tests/lib/solana.test.ts`.

## Validation
- Unit tests ejecutados:
  - `tests/lib/auth.test.ts`
  - `tests/lib/auth-sync.test.ts`
  - `tests/lib/solana.test.ts`
- Lint/typecheck enfocados en archivos modificados del flujo auth/wallet.

## Risks / Notes
- La sincronizacion entre pestañas es UX-only: la autorizacion final sigue dependiendo de cookie `httpOnly` + verificacion server-side.
- No se modifican reglas RBAC, nonce lifecycle ni trust boundaries del backend.
