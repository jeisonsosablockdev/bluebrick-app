# STORY-010-03-route-architecture-and-reusable-templates

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-03-route-architecture-and-reusable-templates`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-23`

## Context
- Problem:
  - Falta arquitectura de URLs semántica y templates reutilizables para escalar contenido.
- Why now:
  - Definir rutas temprano evita migraciones costosas de enlaces/indexación.
- Constraints:
  - Sin contenido final, solo infraestructura.
- Affected paths:
  - `/app/(public)`
  - `/app/knowledge`
  - `/components/templates`

## Proposal
- Approach summary:
  - Definir rutas canónicas y layouts por tipo de documento con navegación contextual.
- Technical design:
  - Rutas previstas: `/`, `/about`, `/platform`, `/knowledge`, `/knowledge/articles/[slug]`, `/knowledge/faq`, `/knowledge/definitions/[slug]`, `/resources/[slug]`.
  - Templates mínimos: institutional, article, faq, definition, knowledge hub, resource page.
  - Infra de contextual navigation: breadcrumbs, prev/next, related content placeholders.
  - Sistema de anchors profundos y TOC reusable.
- Alternatives considered:
  - Rutas planas sin jerarquía.
  - Template único para todos los documentos.
- Tradeoffs:
  - Mayor trabajo inicial en estructura, mejor SEO y mantenibilidad.

## Critique
- Reviewer(s): `Staff Engineer critique incorporated via epic review`
- Critical findings:
1. Riesgo de rigidizar estructura demasiado pronto.
2. Riesgo de colisión entre slugs de tipos distintos.
3. Riesgo de acoplar navegación contextual a data incompleta.
- Blocking concerns:
  - Definir política de slug namespace.

## Resolution
- Final approach after critique:
  - Namespacing por tipo + utilidades de route generation centralizadas.
- Changes accepted:
  - Templates especializados con shell compartido.
- Changes rejected (with rationale):
  - URL no semántica basada en IDs internos.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Habilita crecimiento ordenado de conocimiento institucional.

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
  - Generación de rutas canónicas.
- Integration tests:
  - Resolución de rutas dinámicas por tipo.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - Validación de templates a 320/375/768/1024.

## Executable Acceptance Checklist
- [x] Arquitectura de rutas definida y documentada.
- [x] Templates base implementables por tipo documental.
- [x] Breadcrumbs y navegación contextual disponibles como infraestructura.
- [x] Sin colisiones de slugs cross-type.

## Requirement Mapping
- `R04`, `R11`, `R12`, `R13`

## Traceability
- Related issue(s): `BRI-50`, `BRI-53`
- Related PR(s): `#106`
- Final commit hash(es): `ccfa17e`
