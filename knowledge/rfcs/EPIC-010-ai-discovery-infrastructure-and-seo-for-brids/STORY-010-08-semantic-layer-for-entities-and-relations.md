---
type: RFC
title: STORY- 010 08 Semantic Layer For Entities And Relations
description: STORY- 010 08 Semantic Layer For Entities And Relations - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-010-ai-discovery-infrastructure-and-seo-for-brids/STORY-010-08-semantic-layer-for-entities-and-relations.md
---

# STORY-010-08-semantic-layer-for-entities-and-relations

## Metadata
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story ID: `STORY-010-08-semantic-layer-for-entities-and-relations`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-23`

## Context
- Problem:
  - No existe modelado semántico explícito para entidades, conceptos y relaciones clave de BRIDS.
- Why now:
  - Es crítico para consistencia narrativa humana y consumibilidad por AI systems.
- Constraints:
  - Sin vector DB en esta fase.
- Affected paths:
  - `/content/entities`
  - `/lib/knowledge-graph`
  - `/app/knowledge`

## Proposal
- Approach summary:
  - Definir capa semántica declarativa con entidades, aliases, términos definidos y relaciones cruzadas.
- Technical design:
  - Modelo base: `entity`, `concept`, `definedTerm`, `alias`, `relation(type, source, target)`.
  - Relación automática de cross-links en rendering.
  - Bloques de related concepts y navegación prev/next contextual.
- Alternatives considered:
  - Cross-link manual en contenido.
- Tradeoffs:
  - Mayor complejidad de modelado, mayor coherencia semántica.

## Critique
- Reviewer(s): `Staff Engineer critique incorporated via epic review`
- Critical findings:
1. Riesgo de taxonomía excesiva y difícil de mantener.
2. Riesgo de enlaces erróneos por aliases ambiguos.
3. Riesgo de performance al resolver relaciones en runtime.
- Blocking concerns:
  - Resolver relaciones en build cuando sea posible.

## Resolution
- Final approach after critique:
  - Taxonomía mínima viable + resolución build-first.
- Changes accepted:
  - Modelado explícito con alias controlados.
- Changes rejected (with rationale):
  - Auto-linking ciego sin whitelist.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  - Cubre base de claridad conceptual institucional.

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
  - Resolución de entidades y relaciones.
- Integration tests:
  - Cross-links y bloques related consistentes.
- Devnet validation (if applicable):
  - N/A.
- Responsive QA (if applicable):
  - Validar bloques related en móvil/escritorio.

## Executable Acceptance Checklist
- [x] Modelo semántico mínimo definido y versionado.
- [x] Relación de conceptos aplicable a rendering.
- [x] Sistema de aliases controlado.
- [x] Navegación contextual conectada a relaciones.

## Requirement Mapping
- `R10`, `R11`

## Traceability
- Related issue(s): `BRI-58`
- Related PR(s): `#113`
- Final commit hash(es): `1c639d2`
