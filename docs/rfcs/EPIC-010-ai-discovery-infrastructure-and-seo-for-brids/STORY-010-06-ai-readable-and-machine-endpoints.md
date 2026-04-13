# STORY-010-06-ai-readable-and-machine-endpoints

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-06-ai-readable-and-machine-endpoints`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-13`

## Context
- Problem:
  - No hay salidas machine-readable estables para agentes y LLM systems.
- Why now:
  - Es un objetivo principal de descubrimiento AI para BRIDS.
- Constraints:
  - Endpoints públicos limpios, sin exponer APIs internas.
- Affected paths:
  - `/app/api`
  - `/public`
  - `/lib/ai`

## Proposal
- Approach summary:
  - Definir y exponer endpoints/archivos AI-readable con contrato JSON estable.
- Technical design:
  - Archivos: `/llms.txt`, `/ai.txt` (feature flag), `/knowledge.json`.
  - APIs: `/api/knowledge`, `/api/entities`, `/api/definitions`.
  - Versionado de contrato (`schemaVersion`, `generatedAt`, `items`).
  - Sanitización y límites de campos para consumo automático.
- Alternatives considered:
  - Exponer solo HTML y confiar en scraping.
- Tradeoffs:
  - Más superficie pública; mejor interoperabilidad con agentes.

## Critique
- Reviewer(s): `TBD`
- Critical findings:
1. Riesgo de fuga de información no pública.
2. Riesgo de breaking changes en JSON contract.
3. Riesgo de inconsistencias entre endpoints.
- Blocking concerns:
  - Debe existir versionado explícito y filtros de publicación.

## Resolution
- Final approach after critique:
  - Contratos versionados + política strict de campos públicos.
- Changes accepted:
  - JSON schema contractual compartido entre endpoints.
- Changes rejected (with rationale):
  - Endpoints sin versionado ni políticas de backward compatibility.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Cubre capa AI-readable central del epic.

## Status
- Current status: `approved`
- Next action:
  - Ejecutar STORY-010-07.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Serialización JSON por endpoint.
- Integration tests:
  - Contrato estable + headers correctos + validación schema.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - N/A.

## Executable Acceptance Checklist
- [ ] Endpoints/archivos AI-readable definidos y documentados.
- [ ] Contrato JSON versionado.
- [ ] Solo contenido `published` se expone.
- [ ] No se exponen APIs internas/privadas.

## Requirement Mapping
- `R07`

## Traceability
- Related issue(s): `BRI-50`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
