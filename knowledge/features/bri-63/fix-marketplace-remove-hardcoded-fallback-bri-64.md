---
type: Feature Spec
title: Fix Marketplace Remove Hardcoded Fallback BRI- 64
description: Fix Marketplace Remove Hardcoded Fallback BRI- 64 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-marketplace-remove-hardcoded-fallback-bri-64.md
---

# Fix: marketplace fallback condicional para entradas hardcoded (BRI-64)

## Summary
El marketplace ahora usa fallback hardcoded **solo** cuando no existen entradas reales en `marketplace_entries`.

## Scope
- Actualizado `lib/property-marketplace-server.ts`.
- Regla de lectura:
  - Si DB tiene entradas -> mostrar únicamente DB.
  - Si DB está vacía -> usar fallback in-memory heredado.
- Se evita mezclar DB + hardcoded al mismo tiempo.

## Why
Necesidad de conservar experiencia inicial cuando no hay datos cargados, pero evitar que datos hardcoded contaminen el marketplace cuando ya existen registros reales.

## Validation
- `npm run validate`

## Related
- Linear: BRI-64
