# STORY-011-05-collections-index-ui

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-05-collections-index-ui`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-17`

## Context
- Problem:
  `app/admin/collections/page.tsx` sigue siendo un placeholder y no expresa visualmente qué proyectos están listos para editar ni qué parte viene de blockchain.
- Why now:
  El index es la entrada operativa al módulo y debe ofrecer entendimiento inmediato al admin.
- Constraints:
  - Mantener lenguaje visual actual.
  - Mobile-first.
  - Sin overflow horizontal.
  - CTA claros y touch targets >= 44px.
  - Usar referencias visuales externas solo como inspiración de layout/jerarquía, nunca como clon visual.
- Affected paths:
  - `app/admin/collections/page.tsx`
  - `components/admin/*`
  - `e2e/*`

## Proposal
- Approach summary:
  Reemplazar el placeholder por un dashboard/listado visual de colecciones propias, con tarjetas ricas y estados operativos.
- Technical design:
  - Hero discreto alineado al admin shell.
  - Listado/card grid con:
    - cover read-only
    - título
    - ciudad/país
    - badges de estado
    - “editable sections”
    - CTA `Manage project`
  - Empty state y degraded state.
  - Mantener los estilos actuales de cards, badges y tipografía.
  - Inspiración permitida desde referencias:
    - distribución tipo dashboard con panel protagonista y grid de colecciones
    - combinación de tarjetas operativas + métricas compactas
    - affordances claras para entender qué entry requiere acción
- Visual references considered:
  - referencia 1: collections dashboard con grid visual de proyectos
  - referencia 3: ledger/document repository como ejemplo de paneles operativos y ritmo visual
- Non-goals:
  - no replicar colores, fondos, glow, tipografía ni spacing exactos de las referencias
  - no cambiar el lenguaje visual base de `AdminShell`
- Alternatives considered:
  - Tabla densa estilo backoffice puro.
    - Rechazado: baja claridad visual para gestión de media/proyecto.
- Tradeoffs:
  - Cards ricas cuestan más que una tabla, pero alinean mejor con el contenido visual del módulo.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta decidir densidad de info por card.
2. Falta definir si habrá filtros iniciales.
3. Falta decidir comportamiento de states inconsistentes en el grid.
- Blocking concerns:
  - No aprobar si la UI rompe consistencia visual del admin shell.

## Resolution
- Final approach after critique:
  Aprobado. Las entries inconsistentes no se mostrarán como editables aquí; se indicará su estado o se filtrarán hacia la vista de health (`STORY-011-10`).
- Changes accepted:
  - Vista tipo dashboard/listado visual.
  - Inspiración compositiva desde referencias externas, manteniendo la identidad visual actual.
- Changes rejected (with rationale):
  - Rechazado copiar layouts externos literalmente.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobada la propuesta UI y su delegación de casos complejos al health panel.

## Status
- Current status: `approved`
- Next action:
  Construir listado visual conectado con endpoint de read model.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - No prioritarios salvo helpers de mapping visual.
- Integration tests:
  - Render de empty/error/success states.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
