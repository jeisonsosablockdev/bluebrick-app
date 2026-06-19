---
type: RFC
title: STORY- 012 01 Access To Rewards And Sharing
description: STORY- 012 01 Access To Rewards And Sharing - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-012-referral-marketing-system-in-user-dashboard/STORY-012-01-access-to-rewards-and-sharing.md
---

# STORY-012-01-access-to-rewards-and-sharing

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-01-access-to-rewards-and-sharing`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  Los usuarios necesitan un centro de mando para generar, copiar y compartir su enlace de referidos de forma sencilla sin exponer su wallet ni dejar ambigua la atribución.

## Proposal
- Approach summary:
  El sistema usará un `referralCode` opaco y un modelo de atribución `Last-Touch` hasta el primer payload de autenticación del invitado. El código manual será un input visible y editable siempre, no solo un fallback oculto.
- Technical design:
  - La UI del referente expondrá `Copiar enlace`, `Compartir` y `mailto:` para el MVP.
  - El enlace público tendrá forma `?ref=<referralCode>`; nunca contendrá la wallet del referente.
  - Si el invitado aterriza con un código válido, el sistema lo guardará en cookie firmada cross-subdomain y prellenará el campo visible `Referral code`.
  - Si el invitado abre luego otro link válido antes del primer sign-in, el nuevo código sobrescribe al anterior en cookie y en el prefill. Ese es el contrato `Last-Touch`.
  - Si el usuario edita manualmente el campo antes del sign-in, el valor manual enviado en el primer payload auth prevalece sobre el cookie value.
  - Una vez enviado el primer payload auth y creado el binding backend, la atribución deja de ser mutable desde frontend.
- Alternatives considered:
  - `First-Touch`, donde el primer link gana para siempre.
  - Campo manual solo como fallback oculto.
  - Wallet pública del referente en la URL.
- Tradeoffs:
  - `Last-Touch` refleja mejor la intención final del invitado y evita disputas entre múltiples shares.
  - Mantener el campo manual siempre visible agrega un control extra en la UI, pero hace el sistema más resiliente frente a ITP, Brave y cambios de dispositivo.

## Critique (Staff Engineer)
- **Reviewer(s)**: `Gemini Code Assist (Staff Engineer)`
- **Critical findings**:
  1. **Privacidad del Referral ID**: El `referral_id` en la URL (`?ref=...`) NO debe ser la wallet cruda de Solana del referente. Esto expone un vector de scraping para correlacionar identidades. Debe ser un UUID o un código alfanumérico corto (ej. `nanoid`) mapeado en la base de datos a la wallet del usuario.
  2. **Estrategia de Persistencia**: El "TTL de 30 días" es frágil si dependemos únicamente de `localStorage`. Si el usuario aterriza en `marketing-site.com` pero el registro ocurre en `app.domain.com`, `localStorage` se perderá. Se recomienda usar una **Cookie** con `Domain=.domain.com` y `Secure; HttpOnly` para garantizar el tracking cross-subdomain.
  3. **Fallback Cross-Device**: Tal como se mencionó en el Epic, si el enlace se abre en el navegador in-app de Twitter (móvil) pero el usuario se registra en Desktop, la cookie se pierde. La UI de registro DEBE tener un input opcional "Código de referido" para que el usuario pueda ingresarlo manualmente si el enlace se rompe.
  4. **[STRICT] Modelo de Atribución No Definido**: Si el invitado hace clic en el enlace de Alice hoy, y en el de Bob mañana, y luego se registra... ¿Quién se lleva la recompensa? Se DEBE definir explícitamente en el RFC si usaremos `First-Touch` (el primer clic gana) o `Last-Touch` (el último enlace sobrescribe la cookie). En Web3, se recomienda `Last-Touch`.
  5. **[STRICT] Bloqueo ITP / Brave**: Confiar en cookies está obsoleto con las políticas anti-tracking actuales. El "código de referido manual" no puede ser solo un fallback, debe ser ciudadano de primera clase en la UI de registro, pre-llenado si la cookie sobrevivió, pero visible y editable siempre.

- **Blocking concerns**:
  - No avanzar hasta que se defina la estructura del código de referido (evitando exposición de wallets) y el mecanismo exacto de almacenamiento (Cookie vs LocalStorage).
  - Obligatorio definir la política First-Touch vs Last-Touch.

## Resolution
- Proposed approach after critique:
  - El link usará un `referralCode` opaco y corto, mapeado en backend al referente.
  - La política oficial del RFC es `Last-Touch until first auth payload`.
  - El campo `Referral code` será ciudadano de primera clase: visible, editable y prellenado si existe valor capturado.
  - La cookie firmada sigue siendo la ayuda principal de persistencia, pero el valor autoritativo para binding será el que viaje en el primer payload auth.
- Changes accepted:
  - `referralCode` opaco en la URL.
  - Cookie firmada cross-subdomain.
  - Campo manual siempre visible/editable.
  - `Last-Touch` como regla de atribución previa al binding.
- Changes rejected (with rationale):
  - `First-Touch`, porque haría prevalecer un click viejo aunque el invitado termine usando de forma explícita otro código/link más reciente.
  - Campo manual solo como fallback escondido, porque no resiste bien ITP/Brave ni el cambio de dispositivo.
  - Wallet cruda en URL, por privacidad y scraping.

## Decision
- Decision: `approved`
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action:
  Iniciar desarrollo del frontend para compartir links y la generación del `referral_codes` inicial en backend.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
