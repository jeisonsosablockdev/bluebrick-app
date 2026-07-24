---
type: Feature Spec
title: Refactor Terminology
description: Refactor Terminology - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/refactor-terminology.md
---

# Feature Plan: Refactor NFT Terminology

## Objective
Reemplazar la palabra "NFT" por "Fracción" (o "Fraccion") en toda la interfaz (UI) de cara al usuario para hacer el producto más amigable a inversionistas tradicionales, alineando el desarrollo a la narrativa de "Capital estructurado".

## Scope & Target Paths
1. **Frontend / App (`/app`, `/components`)**
   - Rastrear apariciones de "NFT", "NFTs" o variaciones a lo largo del frontend.
   - Reemplazar en textos i18n (`en`, `es`, `pt` según aplique: "Fraction" en Inglas, "Fracao" en Portugués).
   - Componentes clave detectados iniciales: 
     - `/app/marketplace/page.tsx`
     - `/app/admin/collections/page.tsx`
     - `/components` (donde se rendericen las tarjetas de activo).
2. **Backend / API (`/app/api`)**
   - El cambio es estéticamente de narrativa para el usuario; verificaremos con `grep_search` si reemplazamos errores o etiquetas superficiales, manteniendo las rutas API internas que digan `nft` funcionales a nivel técnico, a no ser de que requieran ser expuestas tal cual.

## Gitflow & Macros
- **Branch**: `refactor/nft-to-fraction` (Creado ✅)
- **Macro a ejecutar**: `@frontend-cycle` (ya que es un cambio de App/UI y textos).
- Todos los cambios deben ser validados en entorno local (Devnet) una vez hechos para no quebrar las rutas JSON ni i18n.

## Status Tracking
---
**Commit #**: `837edf3`
**Status**: Completed

