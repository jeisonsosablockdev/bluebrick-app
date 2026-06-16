---
type: RFC
title: STORY- 010 05 Structured Data Json Ld Layer
description: STORY- 010 05 Structured Data Json Ld Layer - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-05-structured-data-json-ld-layer.md
---

# STORY-010-05-structured-data-json-ld-layer

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-05-structured-data-json-ld-layer`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-23`

## Context
- Problem:
  - No existe infraestructura JSON-LD por tipo de página.
- Why now:
  - BRIDS requiere narrativa institucional y semántica explícita para motores tradicionales y generativos.
- Constraints:
  - Sin datos finales, pero con contratos listos.
- Affected paths:
  - `/lib/schema`
  - `/app/*`

## Proposal
- Approach summary:
  - Crear emitters JSON-LD tipados y reutilizables por template.
- Technical design:
  - Schemas base: `Organization`, `WebSite`, `WebPage`, `Article`, `TechArticle`, `FAQPage`, `DefinedTerm`, `BreadcrumbList`.
  - Validador de payloads schema.org.
  - Hook/helper para inyectar JSON-LD por tipo de página.
- Alternatives considered:
  - JSON-LD inline ad-hoc por vista.
- Tradeoffs:
  - Mayor consistencia con menor flexibilidad local.

## Critique
- Reviewer(s): `Staff Engineer critique incorporated via epic review`
- Critical findings:
1. Riesgo de drift entre contenido y schema.
2. Riesgo de tipo incorrecto de schema por template.
3. Riesgo de datos vacíos en campos obligatorios.
- Blocking concerns:
  - Validación estricta en CI.

## Resolution
- Final approach after critique:
  - Emitters por tipo + validación mínima requerida antes de render.
- Changes accepted:
  - Librería central `lib/schema`.
- Changes rejected (with rationale):
  - Schemas libres sin contratos.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Define capa semántica estandarizada.

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
  - Validación de shape por schema type.
- Integration tests:
  - Snapshot de JSON-LD por template.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - N/A.

## Executable Acceptance Checklist
- [x] Emitters JSON-LD implementables por tipo.
- [x] Validación de campos mínimos activa.
- [x] BreadcrumbList integrado a navegación.
- [x] Contratos documentados para autores.

## Requirement Mapping
- `R06`

## Traceability
- Related issue(s): `BRI-55`
- Related PR(s): `#108`
- Final commit hash(es): `66c9d29`
