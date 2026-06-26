# STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin

## Metadata
- Epic: `EPIC-006-deploy-freeze-delegate-inheritance`
- Story ID: `STORY-006-02-deploy-and-mint-permanent-transfer-delegate-plugin`
- Status: `implemented` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-03-28`
- Last Updated: `2026-04-02`

## Context
- Problem:
  Se necesita política formal de `Permanent Transfer Delegate` para recovery.
- Why now:
  Ya existe multisig de Squads para recuperación segura de NFTs.
- Constraints:
  - Devnet only.
  - Sin cambios en UI.
  - Autoridad de transfer controlada por backend + Squads multisig.
  - Recovery solo con protocolo offline documental (identificación + soporte legal/notarial + auditoría).
  - Debe existir mecanismo de disputas previo a ejecución de transferencia de recovery.
  - Validación primaria de identidad mediante Stripe Identity.
  - Contacto operativo con usuario solo por número telefónico previamente autenticado.
  - SLA máximo de respuesta por caso: `90 días`.
  - Custodia de claves multisig de alto nivel restringida a directivos con hardware wallets (`Trezor`).

## Proposal
- Approach summary:
  Usar `Permanent Transfer Delegate` como capa on-chain de recovery controlado, pero únicamente cuando un protocolo offline robusto valide la identidad y titularidad del solicitante.
- Technical design:
  1. Delegate de transfer fijado por configuración server-side y custodiado por política Squads multisig.
  2. Recovery inicia offline con expediente formal:
     - Stripe Identity `passed`.
     - Documento notariado de solicitud de recuperación.
     - Verificación de contacto por número telefónico autenticado.
  3. El caso escala a junta interna de compliance para decisión case-by-case.
  4. Se abre ventana de disputa antes de ejecución on-chain.
  5. Solo expedientes aprobados pasan a ejecución con transacción Squads multisig.
  6. Transferencia a wallet destino validada + registro auditable (quién aprobó, cuándo, bajo qué evidencia).
  7. Paso obligatorio post-transfer: `unfreeze` del asset vía `Permanent Freeze Delegate` con aprobación multisig para restaurar operatividad.
  8. Definir endpoint/runbook para rotación/revocación del transfer delegate bajo autoridad de colección.
  9. Emitir eventos de estado del caso para tabla de admin y reconciliación.

## Recovery Case Lifecycle (Admin)
- Estados propuestos:
  - `submitted`
  - `identity_pending`
  - `identity_passed`
  - `notary_pending`
  - `compliance_review`
  - `dispute_window`
  - `approved_for_multisig`
  - `multisig_executed`
  - `unfreeze_pending_multisig`
  - `closed`
  - `rejected`
- Requisitos de tabla en consola admin:
  - `case_id`
  - `asset_id`
  - `requester_wallet`
  - `target_wallet`
  - `stripe_identity_status`
  - `notary_doc_status`
  - `compliance_status`
  - `sla_due_at`
  - `current_status`
  - `updated_at`

## Critique
- Critical findings:
1. Definir relación entre freeze y transfer: freeze por `Permanent Freeze Delegate` + multisig, transfer de recovery por `Permanent Transfer Delegate` + multisig.
2. Definir reglas anti-abuso de recovery con protocolo de identidad y disputas.
3. Asegurar trazabilidad completa y cadena de custodia documental.
4. Definir rotación/revocación del delegado para evitar dependencia de clave perpetua.
5. Evaluar alternativas menos centralizadas y justificar decisión final.
- Blocking concerns:
  - El diseño actual sin protocolo offline documental completo sigue siendo riesgoso.
  - Sin ruta de rotación/revocación del delegado, el modelo sigue incompleto.

## Resolution
- Final approach after critique:
  El diseño original de recovery se considera insuficiente. Se reemplaza por enfoque estricto offline-first + ejecución on-chain multisig:
  - Recovery no se habilita por simple solicitud digital.
  - Recovery exige evidencia documental verificable + etapa de disputa.
  - Recovery se ejecuta exclusivamente vía Squads multisig.
  - Se incorpora requisito de rotación/revocación de delegado.
- Changes accepted:
  - Multisig de Squads como control obligatorio de ejecución.
  - Auditoría obligatoria por operación de recovery.
  - Marco offline de verificación de identidad/documentos.
  - Requisito de lifecycle de claves (rotación/revocación).
  - Recovery completo incluye `transfer + unfreeze` como secuencia estándar.
  - Integración explícita con Stripe Identity y proceso notarial.
  - SLA operativo de 90 días y seguimiento por estados en admin.
- Changes rejected (with rationale):
  - Recovery sin verificación documental robusta: rechazado por riesgo de fraude/ingeniería social.
  - Delegado permanente sin plan de actualización: rechazado por riesgo sistémico.

## Alternatives Considered
- Social recovery (guardianes designados por usuario):
  - Pro: menor centralización.
  - Contra: requiere rediseño profundo de producto y no existe infraestructura activa hoy.
- Time-lock recovery con ventana de cancelación por owner original:
  - Pro: reduce riesgo de ejecución abrupta.
  - Contra: no resuelve casos de wallet totalmente perdida sin canal de cancelación confiable.
- Partner externo especializado en recuperación de activos:
  - Pro: reduce riesgo operativo interno.
  - Contra: mayor complejidad legal/integración y dependencia de tercero.
- Decisión actual:
  - Mantener enfoque interno controlado (Stripe Identity + notarial + compliance + multisig), sujeto a reevaluación en EPIC dedicado.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-29`
- Decision owner: `staff-engineer`
- Approval notes:
  Aprobado. El diseño ahora es robusto, con un protocolo de recuperación claro y mitigaciones de riesgo adecuadas.

## Status
- Current status: `implemented`
- Next action:
  Mantener verificación de casos de recovery en ciclo operativo de EPIC-007.

## Observability Requirements
- Los eventos on-chain de transfer recovery y cambios de estado del asset deben reconciliarse vía Helius Webhooks.
- El backend debe persistir eventos en tabla auditable y reflejarlos en la tabla de casos de admin.
- Prohibido depender únicamente de polling para estado final del recovery.

## Traceability
- Related issue(s): `EPIC-006 / STORY-006-02`
- Related PR(s):
  - `#81` `feat(nft): add permanent transfer delegate support for core collection deploy`
- Final commit hash(es):
  - `3e893036692459219ad46853c63d0f1d1acc9e95` (merge commit PR #81)
