---
type: Feature Spec
title: Feature EPIC- 010 STORY- 04 Technical Seo Infrastructure
description: Feature EPIC- 010 STORY- 04 Technical Seo Infrastructure - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-010/feature-epic-010-story-04-technical-seo-infrastructure.md
---

# Feature: EPIC-010 STORY-010-04 Technical SEO Infrastructure

## Summary
Implementacion de la capa SEO tecnica centralizada para metadata, canonical, robots, sitemap y politica de indexacion/noindex por seccion.

## Scope Delivered
- Nueva infraestructura SEO reusable:
  - `lib/seo/site.ts`
  - `lib/seo/policy.ts`
  - `lib/seo/metadata.ts`
  - `lib/seo/robots.ts`
  - `lib/seo/sitemap.ts`
  - `lib/seo/index.ts`
- Compatibilidad con estructura previa:
  - `lib/core/seo/index.ts` ahora reexporta desde `lib/seo`
- Integracion en App Router:
  - `app/layout.tsx` con metadata root centralizada
  - metadata por ruta publica y dinamica (`about`, `platform`, `software`, `regulatory`, `knowledge`, `faq`, `articles/[slug]`, `definitions/[slug]`, `resources/[slug]`, `marketplace`, `marketplace/[id]`, `transparencia`, `home`)
  - noindex reforzado para superficies sensibles (`/admin`, `/protected`, `/checkout`, `/403`)
- Endpoints SEO tecnicos:
  - `app/robots.ts`
  - `app/sitemap.ts`
- Validacion automatizada:
  - `tests/lib/seo-metadata.test.ts`
  - `tests/lib/seo-routes.test.ts`
  - `package.json` -> `validate:seo` agregado a `validate`

## Notes
- La politica central evita duplicacion de canonical por pagina y consolida decision de indexacion en un solo punto.
- `robots.txt` es dinamico por entorno:
  - non-prod: `Disallow: /`
  - prod: allow publico + disallow de namespaces privados.
- `sitemap.xml` consume lista publica indexable y excluye rutas restringidas por politica.

## RFC Traceability
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story: `STORY-010-04-technical-seo-infrastructure`
- Linear: `BRI-54`
