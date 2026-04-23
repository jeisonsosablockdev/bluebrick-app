# STORY-011-01-kickoff

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-01-kickoff`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-17`

## Context
- Problem:
  `/admin/collections` es actualmente un placeholder, aunque el sistema ya cuenta con piezas parciales del flujo:
  - `/admin/assets/new` captura y sube media/documentos,
  - `POST /api/admin/marketplace/entries` crea la entrada de marketplace,
  - `asset_mint_snapshots` persiste `form_snapshot` y evidencia de deploy/mint,
  - `marketplace_entries.created_by` ya registra ownership.
  El gap es que no existe un modelo operativo para editar después la entrada del marketplace de forma segura y visual.
- Why now:
  Ya se aclaró el comportamiento esperado del producto:
  - si el admin sube imágenes/documentos en `/admin/assets/new`, eso debe verse reflejado en la entrada del marketplace,
  - lo que sigue no es crear otra vez el asset sino un sistema para editar esas entradas del marketplace con restricciones explícitas.
- Constraints:
  - La carátula no es editable desde admin collections; se toma de candy machine/metadata.
  - `galleryImages` y `propertyImages` son grupos distintos y no deben consolidarse implícitamente.
  - Todo cambio de auth/ownership debe seguir siendo server-side.
  - Este story no toca `/programs`; es app/backend off-chain.
  - El módulo debe respetar el estilo visual actual del admin console y además cumplir responsive QA obligatorio.
  - No se puede producir implementación final del epic sin `Decision = approved`.
- Affected paths:
  - `app/admin/collections/page.tsx`
  - `app/api/admin/marketplace/entries/route.ts`
  - `lib/property-marketplace-server.ts`
  - `lib/core-candy-machine-snapshot-repository.ts`
  - `components/admin/*`
  - `tests/api/*`
  - `e2e/*`
  - `docs/features/*.md`
  - `docs/auth-flow.md`

## Proposal
- Approach summary:
  Tratar `/admin/collections` como una consola de mantenimiento de entries existentes de marketplace, no como un nuevo flujo de creación. La consola listará solo proyectos pertenecientes al admin autenticado y separará claramente contenido read-only derivado de blockchain vs contenido editable off-chain.
- Technical design:
  - Ownership:
    - Filtrar por `marketplace_entries.created_by = adminPubkey`.
    - Validar además que exista `asset_mint_snapshots.created_by = adminPubkey` y coherencia de `collection_address` / `candy_machine_address`.
  - Read model:
    - Construir una consulta/listado para `Collections` basada en entries existentes y su evidencia on-chain asociada.
  - Editable scope:
    - Permitido: `Fractional investment summary`, `Property information`, `documents`, `gallery images`.
    - Prohibido: cover/carátula.
  - Persistencia:
    - Crear una capa de persistencia editable por `marketplace_entry_id` para galería y bloques descriptivos, sin reutilizar `marketplace_entries.image_url` como campo mutable.
    - Mantener compatibilidad con uploads existentes y con los documentos que hoy se construyen desde `brochureFile`, `legalDocs[]` y `financialDocs[]`.
  - UI:
    - Index visual en `/admin/collections`.
    - Detalle/editor por proyecto con paneles diferenciados para resumen, property info, gallery y documents.
    - Mensajería visual que indique “Managed from Candy Machine” para el cover.
- Alternatives considered:
  - Reusar `/admin/assets/new` como editor:
    - Rechazado porque mezcla creación, mint/deploy y edición posterior, y vuelve ambiguo qué campos son on-chain vs off-chain.
  - Permitir editar `marketplace_entries.image_url`:
    - Rechazado porque contradice la restricción funcional definida para la carátula.
  - Persistir toda edición solo dentro de `asset_mint_snapshots.form_snapshot`:
    - Rechazado porque `form_snapshot` es evidencia del estado al momento del deploy/snapshot, no un modelo vivo de edición del marketplace.
- Tradeoffs:
  - Agregar una capa nueva de persistencia editable incrementa complejidad, pero evita corromper la semántica de snapshot y mantiene límites claros entre blockchain y contenido editorial.
  - Validar ownership por doble fuente (entry + snapshot) es más estricto, pero reduce riesgo de edición indebida o estados huérfanos.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta decidir el modelo exacto de persistencia para galería y bloques editables: tabla dedicada vs extensión del modelo actual.
2. Falta definir si la galería distinguirá visualmente `propertyImages` y `galleryImages` o si se unificarán.
3. Falta fijar el contrato final de lectura para entries inconsistentes: ocultarlas, mostrarlas con warning, o bloquear edición con estado degradado.
- Blocking concerns:
  - No implementar UI ni API final hasta cerrar el modelo de persistencia editable.
  - No permitir ninguna ruta que modifique la carátula.
  - No aprobar implementación sin contrato explícito de ownership y consistencia entre snapshot y marketplace entry.

## Resolution
- Final approach after critique:
  Aprobado. Se confirma la separación de creación vs edición, la inmutabilidad del cover on-chain y la implementación de persistencia off-chain dedicada, tal como lo exige el Epic.
- Changes accepted:
  - Se acepta que uploads del formulario inicial deben terminar reflejándose en la entrada de marketplace.
  - Se acepta que `/admin/collections` es un sistema de edición/mantenimiento de entries existentes.
  - Se acepta conservar estilo visual actual, elevando la claridad visual del flujo.
  - Se acepta que `galleryImages` y `propertyImages` permanecen como grupos separados en datos y UX.
- Changes rejected (with rationale):
  - Rechazado editar la carátula desde admin collections: la fuente de verdad es on-chain/metadata.
  - Rechazado usar `/admin/assets/new` como editor posterior: su rol sigue siendo creación/bootstrap.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba el kickoff sentando las bases inmutables del Epic: ownership estricto, cover read-only y gestión de contenido off-chain explícito.

## Status
- Current status: `approved`
- Next action:
  Proceder con el desglose y ejecución de las historias dependientes.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  consolidar inventario de fuentes de verdad (`marketplace_entries`, `asset_mint_snapshots`, uploads, authorities, plugin docs)
- Slice B:
  definir contrato de ownership y estados inconsistentes
- Slice C:
  definir límites de edición vs lectura read-only
- Slice D:
  consolidar decisiones del epic y dependencias entre stories

## Test and Validation Plan
- Unit tests:
  - Validación de ownership admin sobre collections list/detail.
  - Validación de cover inmutable.
  - Validación de bootstrap/merge de `documents` y galería desde fuentes existentes.
- Integration tests:
  - `GET /api/admin/collections` devuelve solo proyectos válidos del admin.
  - `PATCH /api/admin/collections/:id` actualiza solo campos permitidos.
  - Entries inconsistentes retornan estado controlado o bloqueo explícito según contrato final.
- Devnet validation (if applicable):
  - No aplica ejecución on-chain nueva en este story; se reutiliza evidencia existente de snapshot/deploy para ownership y consistencia.
- Responsive QA (if applicable):
  - Sí aplica para el módulo final del epic: 320px, 375px, 768px, 1024px; sin overflow y con acciones >= 44px.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
