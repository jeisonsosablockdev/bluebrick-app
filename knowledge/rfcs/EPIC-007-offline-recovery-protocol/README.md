# EPIC-007-offline-recovery-protocol

## Metadata
- Epic ID: `EPIC-007`
- Title: `Offline NFT Recovery Protocol (Identity, Legal, Dispute, Compliance)`
- Status: `draft`
- Owner: `jaymusicmachine`
- Created: `2026-03-29`
- Last Updated: `2026-03-29`

## Scope
- Problem statement:
  El recovery de NFTs es una capacidad de alto riesgo que requiere un protocolo legal-operativo robusto y auditable antes de ejecutar transferencias on-chain.
- Business goal:
  Reducir fraude y riesgo regulatorio en recuperaciones de wallet perdida.
- Technical goal:
  Definir y operar flujo offline-first integrado con Stripe Identity, documentación notarial, compliance review, disputa y ejecución final multisig.
- Out of scope:
  - Implementación de nuevos plugins on-chain.
  - Cambios de UX para operaciones de compra/mint regulares.

## Success Criteria
- [ ] Flujo de recovery definido end-to-end con estados y responsables.
- [ ] Reglas de evidencia documental y aceptación legal definidas.
- [ ] Mecanismo de disputa y SLA de 90 días formalizados.
- [ ] Integración operativa con ejecución final por Squads multisig.
- [ ] Tabla de casos en admin con trazabilidad completa.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-007-01 | Recovery Workflow Specification | `STORY-007-01-recovery-workflow-specification.md` | `draft` | `TBD` | Define estados, evidencia, escalamiento, disputa y SLA |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-29 | STORY-007-01 | Se crea epic dedicado para separar protocolo de recuperación del diseño de plugins | jaymusicmachine | `README.md` |

## Risks and Dependencies
- Risks:
  - Ingeniería social y fraude documental.
  - Errores humanos de compliance.
  - Exposición legal por decisiones de custodia/transferencia.
- Dependencies:
  - Stripe Identity.
  - Equipo interno de compliance.
  - Soporte legal/notarial por jurisdicción.
  - Squads multisig para ejecución final on-chain.

## Traceability
- Issue(s): `TBD`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
