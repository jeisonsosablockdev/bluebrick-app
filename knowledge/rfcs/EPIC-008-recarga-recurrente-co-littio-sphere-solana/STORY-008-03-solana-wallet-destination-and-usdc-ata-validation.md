---
type: RFC
title: STORY- 008 03 Solana Wallet Destination And Usdc Ata Validation
description: STORY- 008 03 Solana Wallet Destination And Usdc Ata Validation - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-03-solana-wallet-destination-and-usdc-ata-validation.md
---

# STORY-008-03-solana-wallet-destination-and-usdc-ata-validation

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-03-solana-wallet-destination-and-usdc-ata-validation`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Un usuario aprobado puede fallar al recibir USDC si la wallet destino no esta validada o si el ATA USDC no existe.
- Why now:
  Onramper y entrega final a Solana dependen de un destino verificado e idempotente.
- Constraints:
  - `blockedBy`: `STORY-008-02`.
  - Validaciones de ownership y consistencia deben ser server-side.
  - Politica devnet-only para pruebas transaccionales de acceptance.
  - Evidencia final debe registrarse en `docs/devnet-proof.md` con firmas reales y estado on-chain consultable.
- Affected paths:
  - `app/api/**` wallet/ata validation
  - `lib/**` utilidades Solana/USDC
  - `app/**` bloque wallet destino en recarga

## Sphere References (Story Scope)
- `/platform/wallets`
- `/api-reference/wallet/post`
- `/api-reference/wallet/get-id`

## Existing Infrastructure Reuse (Project)
- `lib/das-client.ts` (guardrails devnet-only para lecturas blockchain)
- `docs/devnet-proof.md` (formato oficial de evidencia on-chain del repositorio)
- `docs/auth-flow.md` (validaciones server-side y no confianza en cliente)

## Proposal
- Approach summary:
  Asegurar wallet destino vinculada y ATA USDC listo antes de habilitar pasos de recarga.
- Technical design:
  - Vincular wallet conectada al perfil del usuario con verificacion de ownership.
  - Verificar ATA USDC existente para la wallet.
  - Si no existe, crear ATA con flujo idempotente.
  - Exponer estado `wallet_ready` en bloque de recarga.
  - Manejar errores de red/firma con reintentos controlados.
  - Registrar eventos de preparacion wallet/ATA en log auditable para soporte y reconciliacion.
- Alternatives considered:
  - Crear ATA solo al final del flujo: rechazado por mayor tasa de fallo en acreditacion.
- Tradeoffs:
  - Paso extra de preparacion, a cambio de menos errores en entrega final.

## Critique
- Reviewer(s):
  - `blockchain`
  - `backend`
- Critical findings:
1. No confiar en address enviada por cliente sin validacion vinculada al usuario.
2. Flujo ATA debe ser idempotente y seguro ante concurrencia.
3. Debe existir observabilidad para fallos de provision de ATA.
- Blocking concerns:
  Sin wallet lista no se puede avanzar a `STORY-008-04`.

## Resolution
- Final approach after critique:
  Introducir preparacion obligatoria de wallet/ATA como prerequisito de cuenta de recarga.
- Changes accepted:
  - Validacion server-side de ownership.
  - Creacion ATA idempotente con logging operacional.
- Changes rejected (with rationale):
  - Delegar validacion de wallet a frontend (rechazado por seguridad).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere confirmar estrategia idempotente exacta en backend.

## Status
- Current status: `draft`
- Next action:
  Aprobar contrato de wallet readiness para desbloquear `STORY-008-04`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de ownership, mapeo de estados wallet y errores.
- Integration tests:
  - Provision ATA idempotente y reintento seguro.
- Devnet validation (if applicable):
  - Validar wallet lista + ATA existente en devnet con evidencia real.
  - Publicar en `docs/devnet-proof.md` la firma, slot, estado `finalized` y enlace explorer por caso validado.
- Responsive QA (if applicable):
  - Estado wallet listo/no listo visible en bloque de recarga.

## Traceability
- Related issue(s): `BRI-30`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
