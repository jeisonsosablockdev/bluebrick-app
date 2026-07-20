---
type: Guide
title: Json Ld Contracts
description: Json Ld Contracts - migrated from knowledge/
tags: [guides]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/guides/json-ld-contracts.md
---

# JSON-LD Contracts (Story 010-05)

## Goal
Definir contratos estables para emitir JSON-LD consistente por tipo de pagina, evitando payloads ad-hoc y drift semantico.

## Supported Schema Types
- `Organization`
- `WebSite`
- `WebPage`
- `Article`
- `TechArticle`
- `FAQPage`
- `DefinedTerm`
- `BreadcrumbList`

## Canonical Usage
1. Construir payloads via `lib/schema/emitters.ts` o `lib/schema/template-emitters.ts`.
2. Validar payload antes de render (`validateJsonLdPayloads` / `assertValidJsonLdSchema`).
3. Inyectar scripts con `components/seo/json-ld-script.tsx`.
4. No escribir JSON-LD inline manual en paginas nuevas.

## Required Fields (Minimum)
- `@context`: siempre `https://schema.org`
- `@type`: uno de los tipos soportados
- URLs: absolutas y validas (`https://...`)
- Campos de texto obligatorios no vacios (`name`, `headline`, `description`, etc.)
- `FAQPage.mainEntity`: minimo 1 `Question`
- `BreadcrumbList.itemListElement`: minimo 1 `ListItem`

## Template Mapping
- Institutional templates -> `WebPage` + `BreadcrumbList`
- Knowledge hub templates -> `WebPage` + `BreadcrumbList`
- Article templates -> `TechArticle` (o `Article`) + `BreadcrumbList`
- FAQ templates -> `FAQPage` + `BreadcrumbList`
- Definition templates -> `DefinedTerm` + `BreadcrumbList`
- Resource templates -> `Article` + `BreadcrumbList`

## Authoring Notes
- Si cambia `title`, `summary` o breadcrumbs de una pagina, revisar que el payload schema conserve coherencia.
- Los campos requeridos por contrato no deben ser vacios ni placeholders en estados `published`.
- Nuevos template types deben agregar:
  - emitter dedicado
  - test unitario
  - cobertura de snapshot/integracion

## CI Validation Gate
`npm run validate:schema` ejecuta:
- `tests/lib/schema-emitters.test.ts`
- `tests/lib/schema-template-emitters.test.ts`

Si falla este gate, no se considera completada la historia.
