---
type: RFC
title: STORY- 012 03 Invitee Arrival And Conversion
description: STORY- 012 03 Invitee Arrival And Conversion - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-03-invitee-arrival-and-conversion.md
---

# STORY-012-03-invitee-arrival-and-conversion

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-03-invitee-arrival-and-conversion`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El usuario invitado debe tener un flujo de llegada claro que lea el enlace de referido, capture la intención y lo asocie a su billetera durante el registro sin dejar atribuciones zombie.

## Proposal
- Approach summary:
  El binding del referral ocurrirá en el primer payload de autenticación/creación de usuario. Desde ese momento, la atribución queda activa por una ventana de `30 días` para que el invitado complete `KYC + compras NFT elegibles`. Si no cumple, la atribución expira y libera la wallet para un nuevo referral futuro.
- Technical design:
  - Middleware/handler de llegada captura `?ref=` y prellena el campo `Referral code` en la pantalla de sign-up.
  - El primer payload auth incluirá `referralCode`, `attributionSource` y metadatos básicos de llegada.
  - Backend crea `referral_attributions` con estado `bound_pending_kyc`, `bound_at` y `eligibility_window_ends_at = bound_at + 30 days`.
  - La tabla de atribuciones usará unicidad solo sobre atribuciones activas, por ejemplo mediante un índice parcial sobre estados vivos, en lugar de bloquear históricamente toda la wallet para siempre.
  - Si antes de `eligibility_window_ends_at` no existe `kyc_approved_at` ni compras NFT elegibles, un job de limpieza marca la atribución como `expired_no_kyc` o `expired_no_qualification` y la wallet queda liberada para un nuevo binding futuro.
  - Si el usuario vuelve con otro código válido después de la expiración y aún no tiene recompensas generadas, se permite una nueva atribución activa siguiendo la regla `Last-Touch`.
  - Si `referrer_wallet == invitee_wallet`, el binding se rechaza silenciosamente como `rejected_self_referral`.
  - Los deep links móviles deben preservar `ref` en la URL de retorno para no perder el código antes del primer auth.
- Alternatives considered:
  - Mantener la wallet bloqueada para siempre aunque nunca haya KYC ni compras.
  - Hacer el binding después del sign-in completo/KYC.
  - Permitir múltiples atribuciones activas para la misma invitee wallet.
- Tradeoffs:
  - Liberar la wallet tras expirar evita basura y permite recuperación de usuarios que abandonaron onboarding.
  - La expiración requiere un cleanup job adicional, pero resuelve de raíz el problema de estados zombie.

## Critique (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **Critical findings**:
  1. **Momento Exacto del Binding (Asociación)**: El `ref` (código del referente) debe enviarse en el **primer payload de creación del usuario** (cuando se hace la verificación de firma / Sign-In with Solana o Web3Auth). Si la wallet se crea sin el código y luego intentamos hacer el "attach", abrimos la puerta a condiciones de carrera o pérdida de atribución si el usuario cierra la pestaña.
  2. **Compatibilidad Mobile Wallet**: Los enlaces referidos compartidos en Telegram/Twitter a menudo se abren en webviews restrictivos. Si el usuario intenta usar Phantom Deep Links (`phantom://`), el deep link DEBE propagar el parámetro `?ref=` en la URL de retorno, de lo contrario se perderá al cambiar de la app social a la app de la wallet.
  3. **Validación de Auto-Referencia**: El frontend y backend deben verificar instantáneamente que el referente no sea el mismo que el invitado. Si `referrer_wallet == invitee_wallet`, la atribución debe ser silenciosamente descartada.
  4. **[STRICT] Estados de Abandono (Drop-off)**: Si el binding ocurre al hacer el Sign-in, pero el usuario no pasa el KYC (EPIC-004), la atribución quedará en un estado zombie. El backend debe contemplar un TTL o limpieza automática para atribuciones que nunca superaron el KYC, liberando a la wallet para ser referida por otro (o bloqueándola para siempre, según se defina).

- **Execution Risks**:
  - Perder parámetros UTM o `ref` durante los redireccionamientos de OAuth (si hubiera integración social) o redireccionamientos de deep-links de wallets móviles.
  - Ensuciar la base de datos con atribuciones huérfanas de wallets que nunca completaron el onboarding real.

## Resolution
- Proposed approach after critique:
  - El binding ocurre en el primer payload auth y crea una atribución activa con ventana de elegibilidad de `30 días`.
  - Si no hay `KYC + compras NFT elegibles` antes de expirar la ventana, la atribución se cierra automáticamente y libera la wallet para un nuevo referral futuro.
  - La base no usará un `UNIQUE` histórico simple sobre `invitee_wallet_address`, sino unicidad sobre atribuciones activas para evitar bloquear permanentemente wallets sin conversión.
  - Los deep links móviles deben preservar `ref` y el backend descarta auto-referidos de forma autoritativa.
- Changes accepted:
  - `first auth payload wins` como punto de binding.
  - Cleanup automático de atribuciones no calificadas.
  - Rebinding permitido solo después de expiración y solo si no existieron recompensas generadas.
  - Rechazo explícito de auto-referidos.
- Changes rejected (with rationale):
  - Wallet bloqueada para siempre aunque no haya KYC ni compras, porque deja zombies operativos y mala UX.
  - Binding diferido hasta fases posteriores del onboarding, porque aumenta pérdidas de atribución y carreras.
  - Multiplicidad de atribuciones activas por wallet invitada, porque rompe consistencia.

## Decision
- Decision: `approved`
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action:
  Implementar el middleware de login para ingerir el `referralCode` en `lib/referrals/ReferralService.ts`.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
