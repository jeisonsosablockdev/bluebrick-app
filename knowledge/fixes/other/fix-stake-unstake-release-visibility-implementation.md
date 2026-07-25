---
type: Fix Spec
title: Fix Stake Unstake Release Visibility Implementation
description: Fix Stake Unstake Release Visibility Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/other/fix-stake-unstake-release-visibility-implementation.md
---

# implementation(fix): Stake / Unstake release visibility

## Espanol

## Objetivo

Sacar `/protected/stake` del conjunto de rutas `dev-only` sin abrir el resto de modulos protegidos ni debilitar las validaciones de wallet/NFT.

## Cambios requeridos

- remover `/protected/stake` de `PROTECTED_RELEASE_CONTROLLED_ROUTES`;
- remover el `notFound()` release gate de `app/protected/stake/page.tsx`;
- remover `releaseControlled` del item `Stake / Unstake` en `ProtectedShell`;
- mantener `/protected/portfolio`, `/protected/rentas`, `/protected/historial` y rutas admin internas detras de `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES`;
- actualizar tests de visibilidad y navegacion;
- actualizar docs canonicas de auth/session/NFT/release visibility.

## Pruebas

- `tests/lib/release-module-visibility.test.ts` debe probar que `/protected/stake` ya no es release-controlled.
- `tests/components/protected-shell-navigation.test.ts` debe probar que Stake / Unstake aparece en production-like builds.
- `tests/app/release-controlled-routes.test.ts` debe probar que la pagina Stake renderiza mientras las rutas que siguen controladas devuelven `notFound`.
- `npm run validate:docs-governance` debe pasar.
- `npm run validate` debe pasar antes de mergear.

## English

## Objective

Remove `/protected/stake` from the `dev-only` route set without opening the rest of the protected modules or weakening wallet/NFT validations.

## Required Changes

- remove `/protected/stake` from `PROTECTED_RELEASE_CONTROLLED_ROUTES`;
- remove the release-gate `notFound()` from `app/protected/stake/page.tsx`;
- remove `releaseControlled` from the `Stake / Unstake` item in `ProtectedShell`;
- keep `/protected/portfolio`, `/protected/rentas`, `/protected/historial`, and internal admin routes behind `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES`;
- update visibility and navigation tests;
- update canonical auth/session/NFT/release visibility docs.

## Tests

- `tests/lib/release-module-visibility.test.ts` must prove `/protected/stake` is no longer release-controlled.
- `tests/components/protected-shell-navigation.test.ts` must prove Stake / Unstake appears in production-like builds.
- `tests/app/release-controlled-routes.test.ts` must prove the Stake page renders while still-controlled routes return `notFound`.
- `npm run validate:docs-governance` must pass.
- `npm run validate` must pass before merge.
