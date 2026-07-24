---
type: Feature Spec
title: Feature App Home Copy BRI- 39
description: Feature App Home Copy BRI- 39 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-app-home-copy-bri-39.md
---

# Feature Note: Home Copy Refresh + Transparency Mapping (BRI-39)

## Objective
Actualizar la narrativa principal de Home para BRIDS/RIDS y alinear los CTA con rutas reales del producto:
- `Marketplace` para exploracion de propiedades e inversion.
- `Transparencia` para contenido explicativo del modelo.
- `Wallet` para inicio de onboarding autenticado.

## Product Changes
- Hero:
  - Copy principal actualizado.
  - CTA principal a `/marketplace`.
  - CTA secundario a `/transparencia`.
- Features:
  - Copy actualizado a:
    - Fraccionamiento Seguro
    - Ingresos Recurrentes
    - Liquidez Flexible
  - Todos los CTA de features van a `/transparencia`.
  - Nota de roadmap agregada: liquidez flexible completa queda para fases futuras.
- New sections:
  - `TokenizationProcessSection`: explica el proceso de tokenizacion.
  - `AppOverviewSection`: explica que hace la app hoy y que queda para roadmap.
- Promo banner:
  - CTA "Conocer mas" ahora navega a `/transparencia`.
- First investment:
  - CTA "Invierte Ahora" ahora navega a `/marketplace`.
- Process:
  - CTA "Empieza con una cuenta gratis" navega a `/protected/perfil`.
- FAQ:
  - Se agrega etiqueta de contexto (`Wallet` / `Transparencia`) por item.

## Files Updated
- `app/page.tsx`
- `app/data/home.json`
- `app/data/home.en.json`
- `app/data/home.pt.json`
- `app/data/index.ts`
- `components/sections/hero.tsx`
- `components/sections/features.tsx`
- `components/sections/tokenization-process.tsx`
- `components/sections/app-overview.tsx`
- `components/sections/promo-banner.tsx`
- `components/sections/first-investment.tsx`
- `components/sections/process.tsx`
- `components/sections/faq.tsx`
- `knowledge/auth-flow.md`
- `knowledge/session-model.md`

## Notes
- Cambio de frontend/copy sin impacto en flujo criptografico SIWS.
- No se alteran nonce, cookies, verificacion de firma ni autoridad server-side.

## Compliance Copy Review Evidence
- Referencia base aplicada:
  - `BRIDS — Guia de Comunicacion para UI (Anexo de Compliance para UI)` (fuente de Linear compartida en issue).
- Resultado de validacion:
  - Removidas expresiones promocionales/agresivas (urgencia, promesa implícita de rendimiento, lenguaje de captacion).
  - BRIDS descrito como plataforma tecnologica, capa de visualizacion e integracion con terceros.
  - CTA normalizados a verbos neutrales:
    - `Explorar`
    - `Revisar`
    - `Ver`
    - `Continuar`
    - `Conectar`
  - Se agrego disclaimer de metricas referenciales en listado de proyectos.
  - FAQ de distribucion ajustada para indicar dependencia de estructura de proyecto y terceros.

## Checklist de Cumplimiento (Landing)
- [x] Sin promesas de retorno, sin recomendaciones de inversion.
- [x] Sin presentacion de BRIDS como actor regulado/custodio/asesor.
- [x] Mencion explicita de procesos operados por terceros en zonas aplicables.
- [x] CTA funcionales y neutrales.
- [x] Representacion del producto como infraestructura digital y trazabilidad.
