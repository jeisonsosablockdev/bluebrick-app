---
type: RFC
title: STORY- 008 01 Product Ux Blueprint And Sidebar Logic
description: STORY- 008 01 Product Ux Blueprint And Sidebar Logic - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/STORY-008-01-product-ux-blueprint-and-sidebar-logic.md
---

# STORY-008-01-product-ux-blueprint-and-sidebar-logic

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-01-product-ux-blueprint-and-sidebar-logic`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  El producto no tiene blueprint funcional de `Profile > Recargar cuenta` para usuarios CO, lo que impide una experiencia coherente de recarga recurrente.
- Why now:
  Todas las fases siguientes dependen de una narrativa UX clara y de bloques de estado consistentes.
- Constraints:
  - El tab solo aplica para `country=CO`.
  - La UX debe expresar claramente flujo no tecnico para usuario final.
  - Debe contemplar espacio para tutorial/video Littio.
  - Debe definir matriz unificada de errores UX (codigo backend + copy + accion sugerida) reutilizable por historias 02-09.
- Affected paths:
  - `app/**` (Profile / sidebar / recarga)
  - `docs/features/*.md`

## Sphere References (Story Scope)
- `/platform/onramper-accounts`
- `/platform/transfer-lifecycle`
- `/platform/supported-rails-currencies`

## Existing Infrastructure Reuse (Project)
- `docs/rfcs/EPIC-003-nft-store-purchase-flow/README.md` (contrato de errores y estado visible en UX)
- `docs/purchase-tracing.md` (estructura de trazabilidad visible para soporte)
- `docs/auth-flow.md` (gates y estados backend->UI ya estandarizados)

## Proposal
- Approach summary:
  Definir blueprint de producto y estructura visible en sidebar con 4 bloques funcionales.
- Technical design:
  - Bloque 1: estado de verificacion (`pending`, `in_review`, `approved`).
  - Bloque 2: wallet destino Solana (estado listo/no listo).
  - Bloque 3: cuenta de recarga (instrucciones ACH dedicadas).
  - Bloque 4: historial y estado operativo de recargas.
  - UI condicionada por `country=CO`.
  - Contenedor UI para tutorial/checklist de Littio.
  - Definir catalogo inicial de errores de producto (ej. `verification_required`, `wallet_not_ready`, `deposit_unmatched`, `under_review`, `refund_issued`) con copy accionable.
- Alternatives considered:
  - Boton aislado de compra: rechazado por no cubrir caso recurrente ni trazabilidad.
- Tradeoffs:
  - Mayor esfuerzo inicial de diseño, menor soporte operativo posterior.

## Critique
- Reviewer(s):
  - `product`
  - `frontend`
- Critical findings:
1. Copy y microcopy deben ser simples para usuarios no tecnicos.
2. Debe existir correspondencia uno-a-uno entre estados de backend y etiquetas UI.
3. Condicion `country=CO` no debe romper navegacion de otros paises.
4. Los mensajes de error deben ser consistentes en todo el journey, sin copy divergente por pantalla.
- Blocking concerns:
  Se bloquea Phase 2 si el blueprint no define con claridad estados visibles y transiciones.

## Resolution
- Final approach after critique:
  Aprobar blueprint con 4 bloques, gating `country=CO`, copy de producto y estructura de estados versionada en RFC.
- Changes accepted:
  - Flujo orientado a proceso recurrente y no a compra unica.
  - Sidebar/logica visible y consistente con estado de negocio.
  - Base comun de codigos de error + copy UX para historias siguientes.
- Changes rejected (with rationale):
  - Mezclar recarga recurrente con CTA de compra instantanea (rechazado por confusion UX).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere validacion final de producto sobre copy y orden de bloques.

## Status
- Current status: `draft`
- Next action:
  Aprobar blueprint para desbloquear `STORY-008-02`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validacion de render condicional por `country=CO`.
  - Validacion de mapping `error_code -> mensaje -> CTA`.
- Integration tests:
  - Navegacion Profile -> Recargar cuenta sin regresion de sidebar.
- Devnet validation (if applicable):
  - N/A en esta historia de blueprint.
- Responsive QA (if applicable):
  - Validar layout a 320/375/768/1024 para bloques definidos.

## Traceability
- Related issue(s): `BRI-28`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
