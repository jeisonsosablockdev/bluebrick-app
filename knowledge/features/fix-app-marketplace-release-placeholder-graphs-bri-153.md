---
type: Feature Spec
title: Fix App Marketplace Release Placeholder Graphs BRI- 153
description: Fix App Marketplace Release Placeholder Graphs BRI- 153 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-app-marketplace-release-placeholder-graphs-bri-153.md
---

# fix(app): hide marketplace placeholder graphs in release (BRI-153 / s03)

## Summary

- Oculta los gráficos placeholder del marketplace en RC/release.
- Mantiene los gráficos visibles en desarrollo para soporte interno y revisión visual.
- Reutiliza la misma flag pública `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES` para reactivarlos cuando sea necesario.

## Scope

- `app/marketplace/page.tsx`
- `lib/release-module-visibility.ts`
- `tests/app/marketplace-page.test.ts`
- `tests/lib/release-module-visibility.test.ts`

## Acceptance

- En `development`, los gráficos placeholder del marketplace siguen visibles por defecto.
- En `production`/RC, los gráficos placeholder del marketplace no se renderizan.
- Si `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`, los gráficos placeholder del marketplace vuelven a renderizarse incluso en `production`/RC.
- El grid real del marketplace y sus filtros no se ocultan.
