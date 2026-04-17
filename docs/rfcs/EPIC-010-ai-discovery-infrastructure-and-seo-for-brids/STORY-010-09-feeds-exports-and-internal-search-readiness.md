# STORY-010-09-feeds-exports-and-internal-search-readiness

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-09-feeds-exports-and-internal-search-readiness`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-17`

## Context
- Problem:
  - No hay salidas de distribución ni base de búsqueda interna preparada.
- Why now:
  - Feed/export extiende alcance y evita retrabajo cuando entre contenido real.
- Constraints:
  - Sin motor de búsqueda complejo en esta fase.
- Affected paths:
  - `/app/feeds`
  - `/public/feeds`
  - `/lib/search`

## Proposal
- Approach summary:
  - Preparar feeds/extractos y un índice de búsqueda local generado en build.
- Technical design:
  - Generar RSS y JSON Feed.
  - Endpoint/listado de documentos recientes.
  - Export estructurado de knowledge entries.
  - Índice local básico (`title`, `slug`, `summary`, `tags`, `headings`).
- Alternatives considered:
  - Posponer feeds/search para fase de contenido.
- Tradeoffs:
  - Algo de trabajo upfront, alto beneficio de integración posterior.

## Critique
- Reviewer(s): `TBD`
- Critical findings:
1. Riesgo de incluir contenidos no publicados en feeds.
2. Riesgo de formatos inconsistentes entre exportaciones.
3. Riesgo de índice insuficiente para búsqueda futura.
- Blocking concerns:
  - Definir contrato de “published-only”.

## Resolution
- Final approach after critique:
  - Feed/export e índice limitados a contenido `published` y con contrato común.
- Changes accepted:
  - Generación centralizada desde pipeline.
- Changes rejected (with rationale):
  - Feeds construidos desde vistas UI.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Cierra distribución y discoverability técnica.

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
  - Serialización RSS/JSON feed.
- Integration tests:
  - Validación de archivos exportados e índice build.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - N/A.

## Executable Acceptance Checklist
- [x] RSS y JSON Feed generables en build.
- [x] Export estructurado disponible para consumo externo.
- [x] Índice local de búsqueda generado y versionable.
- [x] Política published-only aplicada.

## Requirement Mapping
- `R09`, `R16`

## Traceability
- Related issue(s): `BRI-50`
- Related issue(s): `BRI-59`
- Related PR(s): `#114`
- Final commit hash(es): `d8e0f1a`
