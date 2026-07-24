---
type: RFC
title: STORY- 005 03 Auth Signature And Anti Bot Migration
description: STORY- 005 03 Auth Signature And Anti Bot Migration - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-005-full-migration-from-solana-web3-js-to-solana-kit/STORY-005-03-auth-signature-and-anti-bot-migration.md
---

# STORY-005-03-auth-signature-and-anti-bot-migration

## Metadata
- Epic: `EPIC-005-full-migration-from-solana-web3-js-to-solana-kit`
- Story ID: `STORY-005-03-auth-signature-and-anti-bot-migration`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-02`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Los flujos de auth/firma/verificacion y anti-bot dependen de primitives `web3.js` y son superficies de alto riesgo funcional y de seguridad.
- Why now:
  Estos flujos sostienen trust boundaries del sistema. Deben migrarse temprano con controles estrictos para minimizar riesgo acumulado.
- Constraints:
  - Mantener SIWS y verificacion server-side sin cambios de seguridad.
  - No confiar estado cliente para autoridad/autenticacion.
  - No mocks en validacion de caminos criticos.
- Affected paths:
  - `lib/auth.ts`
  - `lib/purchase-anti-bot.ts`
  - `tests/lib/auth.test.ts`
  - `tests/lib/purchase-anti-bot.test.ts`
  - `e2e/helpers/siws-local-wallet.ts`

## Proposal
- Approach summary:
  Reemplazar uso directo de `PublicKey`/`Keypair` de `web3.js` por primitives del stack moderno y/o adapter temporal minimo, conservando semantica de verificacion criptografica.
- Technical design:
  - Migrar parseo/normalizacion de clave publica a capa foundation.
  - Migrar helpers de firmas para SIWS y anti-bot sin alterar formato de mensajes ni validacion `nacl`.
  - Actualizar fixtures/tests para cubrir casos validos/invalidos, replay y errores de formato.
  - Mantener herramientas de E2E de wallet con boundary controlado si una dependencia externa requiere objetos legacy.
- Alternatives considered:
  - Postergar auth para el final: rechazado por riesgo de regresion tardia en un area critica.
- Tradeoffs:
  - Mayor esfuerzo de pruebas tempranas, a cambio de seguridad de rollout y deteccion rapida de regresiones.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. La migracion no debe alterar nonce lifecycle ni cookie/session policy.
2. Debe existir cobertura de pruebas para firmas invalidas y public keys malformed.
3. Cualquier compat adapter en auth debe estar aislado y con fecha de retiro.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se aprueba migracion temprana de auth con hardening de tests y sin modificar semantica de seguridad.
- Changes accepted:
  - Cobertura reforzada de verificacion de firmas y formatos.
  - Boundary temporal documentado si algun helper E2E requiere compat.
- Changes rejected (with rationale):
  - Cambiar payload SIWS/mensajes de firma durante esta historia (rechazado para evitar regresion funcional).

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Historia aprobada con prioridad alta por impacto en seguridad y autenticacion.

## Status
- Current status: `approved`
- Next action:
  Ejecutar `STORY-005-04` para migrar pipelines transaccionales.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - `lib/auth` y `lib/purchase-anti-bot` con casos positivos/negativos de firma.
- Integration tests:
  - Endpoints de auth y anti-bot con sesiones reales de test.
- Devnet validation (if applicable):
  - Verificacion de flujo auth/firma en devnet en caminos criticos.
- Responsive QA (if applicable):
  - Validar formulario/CTA de login en anchos criticos si hay impacto UI.

## Traceability
- Related issue(s): `EPIC-005`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
