# STORY-005-05-cleanup-dependency-removal-and-final-regression

## Metadata
- Epic: `EPIC-005-full-migration-from-solana-web3-js-to-solana-kit`
- Story ID: `STORY-005-05-cleanup-dependency-removal-and-final-regression`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Tras migraciones parciales, puede persistir deuda residual (imports sueltos, adapters sin retirar, dependencia legacy en `package.json`).
- Why now:
  El epic solo cierra cuando se elimina dependencia directa de `@solana/web3.js` y no hay regresion funcional.
- Constraints:
  - Sin romper flujos criticos (`wallet/auth`, `firma/verificacion`, `mint/purchase`, consultas RPC clave).
  - Mantener evidencia de pruebas y devnet.
  - Cumplir gobernanza de docs y trazabilidad en RFC/PR.
- Affected paths:
  - `package.json`
  - `app/**`
  - `components/**`
  - `lib/**`
  - `tests/**`
  - `e2e/**`
  - `docs/**` (actualizacion de evidencia y arquitectura)

## Proposal
- Approach summary:
  Ejecutar cleanup final con criterio objetivo de cierre, remover dependencia legacy y correr suite completa de validacion/regresion.
- Technical design:
  - Criterio de limpieza:
    - `rg -l "@solana/web3\\.js" app lib components tests e2e` debe retornar vacio (codigo de producto).
  - Retiro de compat:
    - eliminar adapters temporales no necesarios.
    - mantener solo adapters estrictamente requeridos por dependencias externas activas, con justificacion documentada.
  - Dependencias:
    - remover `@solana/web3.js` de `package.json` si no existen referencias directas pendientes.
  - Validacion final obligatoria:
    - `npm run validate`
    - `npm test`
    - `npm run e2e:playwright`
    - `npm run e2e:synpress`
    - pruebas de flujos criticos en devnet con firmas reales.
- Alternatives considered:
  - Cerrar epic sin remover dependencia legacy: rechazado por incumplir objetivo tecnico.
- Tradeoffs:
  - Mayor costo de validacion final, a cambio de cierre limpio y menor deuda futura.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. La remocion de dependencia debe ser posterior a limpieza completa para evitar ruptura prematura.
2. El cierre requiere evidencia reproducible de regresion y devnet, no solo compilacion.
3. La trazabilidad RFC/PR/commit debe quedar completa al marcar `implemented`.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se aprueba cierre con `grep zero`, remocion de dependencia y gates completos de validacion.
- Changes accepted:
  - Criterio objetivo de cierre tecnicamente verificable.
  - Evidencia final de pruebas y devnet como requisito de cierre.
- Changes rejected (with rationale):
  - Cierre parcial sin evidencia E2E/devnet (rechazado por riesgo de regresion silenciosa).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Historia aprobada como gate de salida del EPIC-005.

## Status
- Current status: `approved`
- Next action:
  Ejecutar implementacion y actualizar estado a `implemented` con trazabilidad completa.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - `npm test` sin regresiones.
- Integration tests:
  - Cobertura de endpoints/servicios migrados y contratos de payload.
- Devnet validation (if applicable):
  - Evidencia de flujos criticos en devnet con firmas reales confirmadas on-chain.
- Responsive QA (if applicable):
  - Checklist corto en PR final para vistas impactadas.

## Traceability
- Related issue(s): `EPIC-005`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
