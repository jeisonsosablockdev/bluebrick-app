# EPIC-001-admin-asset-create-form

## Metadata
- Epic ID: `EPIC-001`
- Title: `Admin Asset Create Form`
- Status: `draft`
- Owner: `jaymusicmachine`
- Created: `2026-03-13`
- Last Updated: `2026-03-13`

## Scope
- Problem statement:
  El formulario de creacion de activos en `/admin/assets/new` tiene friccion operativa, campos poco claros y reglas de negocio no automatizadas, lo que aumenta errores de carga para el administrador.
- Business goal:
  Reducir tiempo y errores al crear activos/NFTs, estandarizar metadata y mejorar calidad de datos desde el primer mint.
- Technical goal:
  Redisenar el flujo de formulario para soportar carga multiple de archivos, autocompletado inteligente, validaciones de negocio y entrada masiva via CSV/Excel.
- Out of scope:
  Cambios de tokenomics fuera de la creacion inicial, cambios de arquitectura de wallet auth, y migraciones historicas de activos ya publicados.

## Success Criteria
- [ ] El admin puede subir multiples archivos en `gallery`, `propertyImages`, `legalDocs` y `financialDocs` con validaciones claras.
- [ ] `collectionSymbol` y `collectionName` se proponen automaticamente usando `slug` e `internalCode` y siguen siendo editables con override manual.
- [ ] El formulario mantiene consistencia entre `fundingGoal` (fijo), `totalUnits` y `nftCost` mediante recalculo automatico.
- [ ] Se define semantica de estados (`draft`, `published`, `sold_out`, `paused`, `closed`) para la etapa de creacion y post-mint.
- [ ] Se habilita importacion de datos por archivo (CSV/XLSX) y pegado tabular desde Excel, con preview y reporte de errores por celda.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-001-01 | Admin Asset Form V2 | `STORY-001-01-kickoff.md` | `draft` | `TBD` | Form UX + reglas de negocio + importacion |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-13 | STORY-001-01 | RFC inicial creado para revision | jaymusicmachine | `STORY-001-01-kickoff.md` |

## Risks and Dependencies
- Risks:
  Ambiguedad funcional en estados de activo, reglas financieras inconsistentes, y errores de importacion masiva.
- Dependencies:
  Definicion de reglas de negocio para estados y pricing, componentes UI de calendario, y parser CSV/XLSX.
- Mitigations:
  RFC con decision explicita previa a implementacion, validaciones server-side, previsualizacion de importacion y tests unitarios de reglas.

## Open Questions
- [ ] En la regla de 3, cuando hay decimales: cual es la politica oficial de redondeo para `nftCost` y `totalUnits`?
- [ ] `metadataBaseUri` sera un prefijo global por entorno o configurable por activo?
- [ ] Para `exitStrategy`, se usara catalogo cerrado (enum) o texto libre?

## Traceability
- Issue(s): `TBD`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
