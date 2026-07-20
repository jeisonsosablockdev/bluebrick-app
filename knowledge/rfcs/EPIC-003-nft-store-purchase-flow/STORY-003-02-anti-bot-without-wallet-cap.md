---
type: RFC
title: STORY- 003 02 Anti Bot Without Wallet Cap
description: STORY- 003 02 Anti Bot Without Wallet Cap - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-003-nft-store-purchase-flow/STORY-003-02-anti-bot-without-wallet-cap.md
---

# STORY-003-02-anti-bot-without-wallet-cap

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-02-anti-bot-without-wallet-cap`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-20`

## Pre-Start Validation Gate (Mandatory Before Starting)
- Esta historia **no puede iniciar implementación anti-bot** hasta validar y aprobar el hardening de naming/URI para Candy Machine.
- Orden obligatorio previo:
  1. Generación automática server-side de `collectionName` y `assetNamePrefix` desde fuentes de entrada definidas (sin control final editable en dashboard para campos críticos).
  2. Enforcements estrictos de longitud/estructura para evitar `ExceededLengthError` y desbordes de configuración.
  3. Renombrado técnico de archivos antes de pinning en Pinata (no usar nombre final del usuario).
- Gate de aprobación:
  - Debe existir validación de reglas y evidencia de pruebas antes de ejecutar cualquier otro punto de `STORY-003-02`.
  - Si este gate no pasa, la historia se considera bloqueada/no iniciada.
- Estado del gate:
  - `2026-03-20`: gate técnico completado en código con validaciones server-side de naming/URI, campos críticos read-only en panel y renombrado técnico previo a Pinata.

## Context
- Problem:
  SIW autentica identidad/sesion, pero no evita automatizacion agresiva de intentos de compra.
- Why now:
  Se definio que anti-bot entra desde MVP para proteger conversion y disponibilidad.
- Constraints:
  - No usar limite acumulado por wallet.
  - No habilitar `mintLimit` por wallet como regla de negocio.
  - Mantener SIW como base de autenticacion.
  - Devnet only.
- Affected paths:
  - `app/api` (challenge, purchase authorization, rate-limit)
  - `lib` (nonce lifecycle, verificacion firma adicional, anti-replay)
  - `db` (registro de challenge/attempt para auditoria minima)

## Proposal
- Approach summary:
  Agregar capa anti-bot transaccional (independiente de SIW) sin imponer topes acumulados de compra por wallet.
- Technical design:
  - Nonce de compra de vida corta (TTL) emitido por backend.
  - Firma de intencion de compra con wallet sobre payload canonico (`wallet`, `candyMachine`, `quantity`, `nonce`, `expiresAt`).
  - Verificacion server-side de firma + expiracion + anti-replay.
  - Rate limit por ventana de tiempo (IP y wallet), sin cap total historico.
  - `thirdPartySigner` es **mandatorio** en Candy Machine de venta pública.
  - El backend opera como `thirdPartySigner` y solo firma mint args si el intento pasa validación off-chain (challenge/score anti-bot).
  - Si no hay firma válida de `thirdPartySigner`, la transacción debe fallar en programa y persistirse como rechazo de seguridad.
  - Se mantiene explícitamente fuera de alcance cualquier límite acumulado por wallet (`mintLimit`).
- Alternatives considered:
  - Confiar solo en SIW: rechazado (no protege suficientemente el endpoint de compra).
  - `mintLimit` por wallet: rechazado por requerimiento de negocio.
- Tradeoffs:
  - Mayor complejidad de backend y UX (challenge adicional).
  - Mejor control de abuso sin restringir a usuarios legitimos por cantidad acumulada.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Debe quedar explicito que no hay limite acumulado por wallet.
2. Anti-bot no debe romper UX de compra legitima.
3. Rate-limit debe ser configurable por entorno.
- Blocking concerns:
  Definir umbrales iniciales (requests/min por wallet e IP).

## Resolution
- Final approach after critique:
  Mantener SIW + challenge + rate-limit y elevar `thirdPartySigner` a requisito obligatorio para venta pública.
- Changes accepted:
  - Anti-replay con nonce de corta vida.
  - `thirdPartySigner` obligatorio para venta pública.
  - Limites por ventana temporal.
  - Configuracion por entorno.
- Changes rejected (with rationale):
  - Limite acumulado por wallet: contradice requerimiento funcional.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-20`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. El uso mandatorio de `thirdPartySigner` es la decisión correcta para la seguridad de una venta pública.

## Status
- Current status: `implemented`
- Next action:
  Iniciar `STORY-003-03` sobre este baseline (`challenge + anti-replay + thirdPartySigner` ya estabilizado).
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Pre-start validation gate passed
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de nonce TTL/anti-replay.
  - Verificacion de firma de wallet para payload de compra.
- Integration tests:
  - Flujo completo challenge -> sign -> purchase.
  - Casos bloqueados por rate-limit.
  - Compra sin firma válida de `thirdPartySigner` es rechazada en devnet.
- Devnet validation (if applicable):
  - Compra real permitida para usuario legitimo bajo limites.
  - Evidencia:
    - `attemptId`: `d7fea17a-e917-4f6b-b541-465243992547`
    - `txSignature`: `41sSb8Gxbh2ZXW1XFVKmuaBBViaFiKECaQMzXtpmMh1qjYFiYh9zd7XTkF9rXYfYzNmbSJ8Umb45j67QZfXsjv8F`
    - Explorer: `https://solscan.io/tx/41sSb8Gxbh2ZXW1XFVKmuaBBViaFiKECaQMzXtpmMh1qjYFiYh9zd7XTkF9rXYfYzNmbSJ8Umb45j67QZfXsjv8F?cluster=devnet`
    - Estado RPC: `finalized` (slot `449827222`)
- Responsive QA (if applicable):
  - Mensajes de challenge/error anti-bot en mobile y desktop.

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s): `#44`
- Final commit hash(es): `b0f8ae9`, `43d15e3`, `0ae1fa7`
