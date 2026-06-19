---
type: RFC
title: STORY- 004 06 Staff Review And Verdict
description: STORY- 004 06 Staff Review And Verdict - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-004-user-profile-kyc-aml/STORY-004-06-staff-review-and-verdict.md
---

# STORY-004-06-staff-review-and-verdict

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-06-staff-review-and-verdict`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `staff-review`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problem:
  La arquitectura propuesta originalmente en `STORY-004-01` a `STORY-004-05` se basaba en una estrategia tipo `Build`, donde nuestra app capturaba y almacenaba PII/documentos KYC sensibles.
- Scope:
  Este RFC documenta la critica formal y el veredicto de arquitectura para todo el `EPIC-004`.

## Proposal
- La propuesta original era construir in-house:
  1. Captura de PII por formularios locales.
  2. Almacenamiento privado de documentos de identidad.
  3. Revision manual de PII/documentos por admins internos.
  4. Handoff manual a proveedor externo como paso principal.

## Critique
### 3 Critical Weaknesses
1. **Riesgo critico de seguridad/compliance**: Almacenar PII y documentos nos convierte en objetivo de alto valor y eleva drastica la responsabilidad legal y operativa.
2. **Handoff manual no escala**: Asume todo el riesgo de custodiar datos sensibles sin los beneficios de una integracion especializada.
3. **Gap AML**: El epic KYC/AML no cubria screening AML real para wallets.

### Execution Risks
- Brecha de datos con impacto legal/reputacional severo.
- Cuello de botella operativo en revision manual.

### Stack Alignment
- Enfoque recomendado:
  - KYC: proveedor especializado (Stripe Identity u equivalente).
  - AML: proveedor de analisis wallet (Helius en este plan).

### Mandatory Tests (for revised proposal)
1. E2E KYC: usuario completa Stripe flow y webhook actualiza `kyc_status` sin almacenar PII local.
2. Integracion AML: wallet de alto riesgo/sancionada queda marcada `aml_flagged` o equivalente.
3. Data minimization: prueba automatizada valida ausencia de columnas/tablas PII sensibles.

### Verdict
`Verdict: reject` (para estrategia Build original)

## Resolution
- Final approach after critique:
  Se rechaza de forma completa la estrategia `Build + Manual Handoff`.
- Mandatory changes applied:
  1. Eliminar almacenamiento local de PII/documentos de identidad.
  2. Integrar KYC con proveedor externo (Stripe Identity).
  3. Integrar AML con proveedor externo (Helius).
  4. Reescribir `STORY-004-02` a `STORY-004-05` en enfoque integration-first.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba el veredicto de staff review y se adopta oficialmente el pivot de arquitectura a `Buy`.

## Status
- Current status: `implemented`
- Next action:
  Mantener monitoreo operativo de Stripe/Helius y ajustar umbrales AML por telemetria real.
- Exit criteria:
- [x] Critique formal registrada
- [x] Veredicto aceptado por owner
- [x] RFCs impactados reescritos al nuevo enfoque
- [x] Implementacion completada (fuera de este RFC)

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `#55`, `#56`, `#58`
- Final commit hash(es): `467ee31`, `8986aed`, `0ff7653`
