---
type: Feature Spec
title: Fix App Favicon BRI- 67
description: Fix App Favicon BRI- 67 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-63/fix-app-favicon-bri-67.md
---

# BRI-67 — Favicon del website con `B.svg`

## Resumen
- Se configuró el favicon global del sitio para usar `public/favicon.svg`.
- El archivo fuente corresponde al asset definido en el issue BRI-67 (`B.svg`).

## Cambios
- Se agregó `public/favicon.svg`.
- Se actualizó `lib/seo/metadata.ts` para exponer íconos globales en metadata raíz:
  - `icons.icon` con `image/svg+xml`
  - `icons.shortcut`

## Alcance
- Cambio acotado a branding visual del favicon.
- Sin impacto en lógica funcional ni flujos de negocio.
