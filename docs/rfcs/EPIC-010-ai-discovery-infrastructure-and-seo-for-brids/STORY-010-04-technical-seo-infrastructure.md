# STORY-010-04-technical-seo-infrastructure

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-04-technical-seo-infrastructure`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-13`

## Context
- Problem:
  - No hay capa SEO técnica centralizada para indexación consistente.
- Why now:
  - Es prerequisito para publicación e indexación orgánica.
- Constraints:
  - Sin copy final; solo generadores/plantillas.
- Affected paths:
  - `/app`
  - `/lib/seo`
  - `/public`

## Proposal
- Approach summary:
  - Implementar infraestructura SEO reusable por tipo de página.
- Technical design:
  - Metadata dinámica por ruta.
  - Canonical resolver.
  - OG/Twitter card generators.
  - `robots.txt` dinámico por entorno.
  - `sitemap.xml` con secciones indexables.
  - Breadcrumbs estructurales.
  - Reglas de index/noindex por secciones.
- Alternatives considered:
  - SEO hardcoded por página.
- Tradeoffs:
  - Mayor abstracción inicial, menor inconsistencia futura.

## Critique
- Reviewer(s): `TBD`
- Critical findings:
1. Riesgo de duplicar canonical.
2. Riesgo de indexar drafts por error.
3. Riesgo de metadatos incompletos en rutas dinámicas.
- Blocking concerns:
  - Gating por status documental obligatorio.

## Resolution
- Final approach after critique:
  - Resolver único para metadata + política de indexación por estado.
- Changes accepted:
  - Reglas centralizadas en `lib/seo`.
- Changes rejected (with rationale):
  - Config SEO dispersa por componente.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Cubre baseline técnico de indexación.

## Status
- Current status: `approved`
- Next action:
  - Ejecutar STORY-010-05.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Canonical generation y flags index/noindex.
- Integration tests:
  - Validación de `robots.txt` y `sitemap.xml` en build.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - N/A.

## Executable Acceptance Checklist
- [ ] Metadata dinámica funcional por plantilla.
- [ ] Canonicals consistentes y únicos.
- [ ] Robots y sitemap generados automáticamente.
- [ ] Drafts/superseded no indexables por default.

## Requirement Mapping
- `R05`

## Traceability
- Related issue(s): `BRI-50`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
