---
type: Feature Spec
title: Fix App Feature Icons And Copy
description: Fix App Feature Icons And Copy - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/fix-app-feature-icons-and-copy.md
---

# Feature Note: Feature Cards Icons + Copy Tweak

## Objective
Ajustar microcopy y símbolo visual de las tarjetas de `Features` en Home:
- Reemplazar `•` por emoticons por feature.
- Actualizar título/descripcion del tercer bloque en ES a:
  - `Inversion Flexible`
  - `Compra fracciones con reglas de mercado transparentes.`

## Files Updated
- `components/sections/features.tsx`
- `app/data/home.json`
- `app/data/home.en.json`
- `app/data/home.pt.json`
- `app/data/index.ts`

## Notes
- Cambio de UI/copy sin impacto en autenticación SIWS, sesiones, ni validación server-side.
