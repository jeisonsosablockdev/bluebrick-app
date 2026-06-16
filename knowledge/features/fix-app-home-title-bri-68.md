---
type: Feature Spec
title: Fix App Home Title BRI- 68
description: Fix App Home Title BRI- 68 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-app-home-title-bri-68.md
---

# BRI-68 — Home title explícito `Home | BRIDS`

## Resumen
- Se ajustó el metadata de la página Home para que el título del documento sea explícitamente `Home | BRIDS`.

## Cambios
- Archivo actualizado: `app/page.tsx`
  - Se conserva la metadata SEO base de `createPageMetadata(...)`.
  - Se fuerza `title.absolute = "Home | BRIDS"` para evitar ambigüedad en el título final de la pestaña.

## Alcance
- Cambio acotado a metadata de la Home.
- Sin impacto en lógica de negocio ni en flujos on-chain.
