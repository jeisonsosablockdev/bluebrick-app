---
type: Feature Spec
title: Feature EPIC- 010 STORY- 05 Structured Data Json Ld Layer
description: Feature EPIC- 010 STORY- 05 Structured Data Json Ld Layer - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-010-story-05-structured-data-json-ld-layer.md
---

# Feature: EPIC-010 STORY-010-05 Structured Data JSON-LD Layer

## Summary
Implementacion de capa JSON-LD tipada y reusable por tipo de template para mejorar semantica machine-readable.

## Scope Delivered
- Libreria central de schema en `lib/schema`:
  - tipos y contratos: `types.ts`
  - validadores de campos minimos: `validators.ts`
  - emitters base: `emitters.ts`
  - emitters por template: `template-emitters.ts`
  - export barrel: `index.ts`
- Inyeccion reusable de JSON-LD:
  - `components/seo/json-ld-script.tsx`
- Integracion en rutas/template pages:
  - Home (`Organization`, `WebSite`, `WebPage`)
  - Institutional pages (`WebPage` + `BreadcrumbList`)
  - Knowledge hub (`WebPage` + `BreadcrumbList`)
  - FAQ (`FAQPage` + `BreadcrumbList`)
  - Article (`TechArticle` + `BreadcrumbList`)
  - Definition (`DefinedTerm` + `BreadcrumbList`)
  - Resource (`Article` + `BreadcrumbList`)
- Validacion automatizada:
  - `tests/lib/schema-emitters.test.ts`
  - `tests/lib/schema-template-emitters.test.ts` (+ snapshots)
  - `package.json` con script `validate:schema` y gate en `validate`

## Notes
- Se evito JSON-LD ad-hoc por vista; toda emision pasa por contratos tipados + validacion.
- BreadcrumbList reutiliza la navegacion ya renderizada para minimizar drift.

## RFC Traceability
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story: `STORY-010-05-structured-data-json-ld-layer`
- Linear: `BRI-55`
