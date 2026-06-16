---
type: RFC
title: STORY- 010 02 Content As Code And Editorial Contracts
description: STORY- 010 02 Content As Code And Editorial Contracts - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-02-content-as-code-and-editorial-contracts.md
---

# STORY-010-02-content-as-code-and-editorial-contracts

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-02-content-as-code-and-editorial-contracts`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-23`

## Context
- Problem:
  - Falta contrato técnico para contenido versionado (MD/MDX) con validación y tipos.
- Why now:
  - Sin contrato editorial, SEO y endpoints AI serían frágiles.
- Constraints:
  - No se ingresa contenido definitivo en esta fase.
  - El flujo editorial es `code-only` (Git/PR/CI), sin interfaz para non-code editors.
- Affected paths:
  - `/content`
  - `/lib/content`
  - `/schemas`

## Proposal
- Approach summary:
  - Implementar content-as-code con frontmatter obligatorio, validación de schema y tipado runtime/compile-time.
- Technical design:
  - Definir tipos documentales: institutional page, article, kb, faq, glossary term, changelog.
  - Definir frontmatter base: `id`, `slug`, `title`, `summary`, `status`, `version`, `updatedAt`, `tags`, `canonicalPath`.
  - Validación con schema (ej. Zod) y check de slugs únicos.
  - Loader único de contenido y mapeo a tipos de dominio.
  - Estados documentales: `draft | published | superseded`.
- Alternatives considered:
  - CMS externo.
  - Markdown sin validación.
- Tradeoffs:
  - Más rigor inicial, menor costo operativo de crecimiento.

## Critique
- Reviewer(s): `Staff Engineer critique incorporated via epic review`
- Critical findings:
1. Riesgo de fricción al crear documentos sin toolchain de soporte.
2. Riesgo de acoplar schema a rendering.
3. Riesgo de incompatibilidad futura con i18n.
- Blocking concerns:
  - Debe existir guía simple de authoring técnico (developer-facing).

## Resolution
- Final approach after critique:
  - Contratos estrictos + utilidades de authoring mínimas + docs internas.
- Changes accepted:
  - Schema por tipo documental.
  - Loader desacoplado del renderer.
- Changes rejected (with rationale):
  - Frontmatter opcional (rompe consistencia).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Define base para ingestión estable y auditable.

## Status
- Current status: `implemented`
- Next action:
  - Mantenimiento y validación de consistencia RFC.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Parse/validate por tipo documental.
  - Detección de slugs duplicados.
- Integration tests:
  - Build falla si schema obligatorio no se cumple.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - N/A.

## Executable Acceptance Checklist
- [x] Frontmatter obligatorio documentado y validado.
- [x] Existen tipos de documento y estado documental versionable.
- [x] Loader tipado devuelve contratos estables.
- [x] CI bloquea contenido inválido.
- [x] Flujo de preview documentado vía PR preview/staging (sin CMS UI).
- [x] Estrategia de redirects definida para `renamed/superseded`.

## Requirement Mapping
- `R02`, `R03`, `R14`, `R15`

## Traceability
- Related issue(s): `BRI-50`, `BRI-52`
- Related PR(s): `#105`
- Final commit hash(es): `e9d3d98`
