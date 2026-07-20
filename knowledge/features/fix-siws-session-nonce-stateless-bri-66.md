---
type: Feature Spec
title: Fix Siws Session Nonce Stateless BRI- 66
description: Fix Siws Session Nonce Stateless BRI- 66 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/fix-siws-session-nonce-stateless-bri-66.md
---

# fix-siws-session-nonce-stateless-bri-66

## Context
Se detecto un flujo SIWS inconsistente:
- Error transitorio `Current wallet does not support message signing.` tras `connect()`.
- `Invalid or expired nonce.` en primer intento de firma.
- Sesion parcial donde `/api/auth/me` y secciones protegidas no siempre reflejaban estado autenticado.

## Root Cause
1. Carrera de estado en frontend: `signMessage` podia no estar hidratado inmediatamente despues de `connect()`.
2. Acoplamiento de nonce/sesion a memoria de proceso (`globalThis`), sensible a cambios de instancia.

## Implemented Changes
- `components/WalletModal.tsx`
  - Se agrego resolucion + espera de capacidad de firma (`waitForSignMessage`) antes de iniciar SIWS.
- `app/api/auth/nonce/route.ts`
  - Emite nonce y escribe cookie `siws_nonce` firmada (`httpOnly`).
- `app/api/auth/verify/route.ts`
  - Verifica nonce de mensaje contra nonce de cookie firmada.
  - Limpia `siws_nonce` en exito y error para forzar nonce fresco por intento.
- `lib/auth-store.ts`
  - Sesion SIWS migrada a token firmado (stateless) con expiracion.
  - Nonce cookie firmada (`createNonceToken`/`readNonceFromToken`).
  - `revokeSession` mantiene revocacion in-process para logout local.
- `lib/auth.ts`
  - Verificacion SIWS ajustada a nonce esperado desde cookie.
  - Helpers para set/clear/get de cookie de nonce.
- `.env.example`
  - Nueva variable: `SIWS_TOKEN_SECRET`.

## Security Notes
- En produccion `SIWS_TOKEN_SECRET` es obligatorio y debe ser estable entre replicas.
- Se mantiene validacion server-side de dominio, `issuedAt`, y firma criptografica.
- Se elimina dependencia de nonce/sesion en memoria para validacion cross-instance.

## Validation
- Unit tests:
  - `npm run test -- tests/lib/auth-store.test.ts tests/lib/auth.test.ts`
- Full gate:
  - `npm run validate`

## Traceability
- Linear: `BRI-66`
