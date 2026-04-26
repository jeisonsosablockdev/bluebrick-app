# EPIC-011-admin-collections-console

## Metadata
- Epic ID: `EPIC-011`
- Title: `Admin Collections Console`
- Status: `approved`
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-26`

## Scope
- Problem statement:
  El proyecto ya permite crear entradas de marketplace desde `/admin/assets/new` y persistir evidencia de deploy/snapshot de Core Candy Machine, pero `/admin/collections` sigue siendo un placeholder. Hoy no existe una consola para que un admin gestione las entradas de marketplace que le pertenecen y mantenga actualizado el contenido editable del proyecto sin romper la fuente de verdad on-chain.
- Business goal:
  Permitir que cada admin gestione visualmente sus proyectos publicados en marketplace, reduciendo fricción operativa y evitando que el equipo tenga que rehacer entradas manualmente cuando cambian fotos secundarias, documentos o descripciones comerciales.
- Technical goal:
  Implementar un módulo real en `/admin/collections` que:
  1. liste solo las entradas de marketplace validadas para el admin autenticado,
  2. use la evidencia existente (`marketplace_entries.created_by`, `asset_mint_snapshots.created_by`, `collection_address`, `candy_machine_address`) para ownership y consistencia,
  3. permita editar solo campos off-chain autorizados,
  4. preserve la carátula como read-only derivada de la candy machine/metadata.
- Out of scope:
  - Reemplazar manualmente la carátula/cover image.
  - Cambios en `/programs` o contratos on-chain.
  - Cambios a la autoridad de update/mint/collection.
  - Rediseñar por completo `AdminShell` o introducir un lenguaje visual ajeno al producto actual.
  - Soporte para admins editando proyectos creados por otro admin.

## Success Criteria
- [ ] `/admin/collections` muestra únicamente proyectos cuya entrada de marketplace y snapshot on-chain pertenecen al admin autenticado y pasan validación de consistencia.
- [ ] El admin puede editar `Fractional investment summary`, `Property information`, `documents` y galería secundaria del proyecto, y esos cambios se reflejan en la entrada del marketplace.
- [ ] La carátula del proyecto no se puede reemplazar desde la consola; el sistema la trata como fuente read-only proveniente de candy machine/metadata.
- [ ] El módulo conserva el estilo visual actual del admin console, incorporando una UX más visual para entender qué puede cambiarse en cada proyecto.
- [ ] La funcionalidad queda cubierta por tests server-side y E2E responsivos para 320px, 375px, 768px y 1024px.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-011-01 | Kickoff and contract definition | `STORY-011-01-kickoff.md` | `approved` | `TBD` | Define ownership, edit boundaries, and data contract |
| STORY-011-02 | Admin collections read model | `STORY-011-02-admin-collections-read-model.md` | approved | `TBD` | Build listing/query layer for owned marketplace entries; `BRI-80`, `BRI-81`, and `BRI-82` are done, final visual refinement moves to `STORY-011-05` |
| STORY-011-03 | Editable collection content persistence | `STORY-011-03-editable-collection-content-persistence.md` | `approved` | `TBD` | Persist gallery/property/docs content outside on-chain cover; `BRI-83` adds schema, `BRI-84` closes the mapper contract, `BRI-85` adds the dry-run runner, `BRI-86` adds repository read/write helpers, and `BRI-87` closes edit-session upload lifecycle + cleanup |
| STORY-011-04 | Collections API and ownership enforcement | `STORY-011-04-collections-api-and-ownership-enforcement.md` | `approved` | `TBD` | Add GET/PATCH admin APIs with immutable cover constraints; `BRI-88` adds the centralized ownership helper, `BRI-89` adds detail GET, `BRI-90` adds PATCH payload validation, and `BRI-91` adds the unified PATCH route |
| STORY-011-05 | Collections index UI | `STORY-011-05-collections-index-ui.md` | `approved` | `TBD` | Replace placeholder with visual admin listing; `BRI-92` adds polished empty/loading/error states, `BRI-93` adds collection cards UI, and `BRI-94` activates the detail handoff route |
| STORY-011-06 | Collection detail editor UI | `STORY-011-06-collection-detail-editor-ui.md` | `approved` | `#146 (slice)` | Visual editor for summary, property info, gallery, documents; `BRI-95` mounts the read-only detail shell, `BRI-96` activates the summary editor, `BRI-97` activates the property information editor, `BRI-98` mounts the gallery tabs shell, and `BRI-99` activates the documents editor |
| STORY-011-07 | QA, responsive evidence, and docs sync | `STORY-011-07-qa-responsive-evidence-and-docs-sync.md` | `approved` | `BRI-100 (slice)` | Playwright, responsive QA, feature note, auth/docs updates; `BRI-100` locks API/admin collections regression coverage |
| STORY-011-08 | Blockchain readonly panel | `STORY-011-08-blockchain-readonly-panel.md` | `approved` | `TBD` | Read-only candy machine, authorities, guards, and appdata panel |
| STORY-011-09 | Google Maps location integration | `STORY-011-09-google-maps-location-integration.md` | `approved` | `TBD` | Address autocomplete, maps persistence, and outbound maps UX |
| STORY-011-10 | Collections health and manual review queue | `STORY-011-10-collections-health-and-manual-review-queue.md` | `approved` | `TBD` | Read-only health view for inconsistent or bootstrap-failed entries |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-04-17 | STORY-011-01 | El epic no crea nuevas entries de marketplace; administra entries existentes con ownership admin validado | jaymusicmachine | `STORY-011-01-kickoff.md` |
| 2026-04-17 | STORY-011-01 | La carátula queda fuera del alcance editable y se considera derivada de candy machine/metadata | jaymusicmachine | `STORY-011-01-kickoff.md` |
| 2026-04-17 | STORY-011-01 | `galleryImages[]`, `propertyImages[]`, `legalDocs[]`, `financialDocs[]`, `brochureFile` subidos en `/admin/assets/new` deben reflejarse en la entrada de marketplace bajo las restricciones de ownership y modelo final | jaymusicmachine | `STORY-011-01-kickoff.md` |
| 2026-04-17 | STORY-011-01 | `galleryImages` y `propertyImages` permanecen como dos grupos distintos en modelo y UI | jaymusicmachine | `STORY-011-01-kickoff.md` |
| 2026-04-17 | STORY-011-05/06 | Las referencias visuales aportadas por producto se usarán como inspiración de distribución, jerarquía y elementos UX, no como copia del estilo visual actual | jaymusicmachine | `STORY-011-05-collections-index-ui.md` |
| 2026-04-17 | STORY-011-03 | La persistencia editable se resolverá extendiendo el modelo actual con campos/JSONs específicos dentro del dominio existente de marketplace entry editable; no se crea bounded context nuevo ni tabla totalmente nueva | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-17 | STORY-011-03 | `Fractional investment summary` será texto libre largo y `Property information` será texto libre usando la dirección actual como apoyo | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-17 | STORY-011-03 | `documents` conserva la lógica existente del formulario `/admin/assets/new` y además permitirá edición manual de metadata | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-17 | STORY-011-04/06 | El editor vivirá en `/admin/collections/[id]`, con guardado manual y botones `Save` / `Cancel` por sección, permaneciendo en la misma pantalla | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-17 | STORY-011-06 | La vista de detalle incluirá información blockchain visible, datos de `nft-economic-data-appdata-plugin` y una integración con Google Maps para visualización, autocomplete y salida al sitio | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-17 | STORY-011-08/09 | La información blockchain read-only y la integración Google Maps se separan en stories dedicadas para no sobrecargar el editor principal | jaymusicmachine | `STORY-011-08-blockchain-readonly-panel.md` |
| 2026-04-23 | STORY-011-02 | El primer slice (`BRI-80`) fija el contrato de matching dual usando `collection_address` y candy machine address persistida en `marketplace_entries.asset_mint_address`, y deja `GET /api/admin/collections` para `BRI-81` | jaymusicmachine | `STORY-011-02-admin-collections-read-model.md` |
| 2026-04-23 | STORY-011-02 | El segundo slice (`BRI-81`) expone `GET /api/admin/collections` como una capa read-only delgada, admin-only y sin duplicación de lógica de ownership/matching | jaymusicmachine | `STORY-011-02-admin-collections-read-model.md` |
| 2026-04-23 | STORY-011-02 | El tercer slice (`BRI-82`) conecta el contrato aprobado al placeholder de `/admin/collections` con estados mínimos `loading`, `error`, `empty` y `success`, dejando el diseño visual final para `STORY-011-05` | jaymusicmachine | `STORY-011-02-admin-collections-read-model.md` |
| 2026-04-23 | STORY-011-03 | El primer slice (`BRI-83`) agrega a `marketplace_entries` las columnas editoriales aprobadas, manteniendo `image_url` intacto y documentando la separación entre contenido editable e historial de snapshot | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-23 | STORY-011-03 | El segundo slice (`BRI-84`) fija el mapper de bootstrap con shape tipado para galerías/documentos, dedupe por `fileRefId` + URL y reason codes de revisión manual | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-23 | STORY-011-03 | El tercer slice (`BRI-85`) agrega el runner versionado `2026-04-23-v1` con `dry-run`, filtros por actor/entry y manifiesto auditable de `successes`, `manualReviewRequired` y `failures` | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-24 | STORY-011-03 | El cuarto slice (`BRI-86`) agrega un repository/helper layer estrecho para leer y escribir los campos editoriales de collections sin duplicar SQL ni reabrir `image_url` | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-24 | STORY-011-03 | El quinto slice (`BRI-87`) agrega asociación opcional por `editSessionId`, promoción/cancelación explícita y cleanup que solo purga uploads temporales no promovidos | jaymusicmachine | `STORY-011-03-editable-collection-content-persistence.md` |
| 2026-04-25 | STORY-011-04 | El primer slice (`BRI-88`) agrega `assertAdminCollectionOwnership(adminId, collectionId)` como guard central para rutas de detalle, cruzando entry y snapshot exacto del mismo admin | jaymusicmachine | `STORY-011-04-collections-api-and-ownership-enforcement.md` |
| 2026-04-25 | STORY-011-04 | El segundo slice (`BRI-89`) agrega `GET /api/admin/collections/[id]` como ruta delgada: admin-only, ownership centralizado y payload separado entre evidencia y contenido editable | jaymusicmachine | `STORY-011-04-collections-api-and-ownership-enforcement.md` |
| 2026-04-25 | STORY-011-04 | El tercer slice (`BRI-90`) agrega validación compartida para payloads PATCH discriminados y rechazo explícito de campos cover inmutables | jaymusicmachine | `STORY-011-04-collections-api-and-ownership-enforcement.md` |
| 2026-04-25 | STORY-011-04 | El cuarto slice (`BRI-91`) conecta el `PATCH /api/admin/collections/[id]` final con SIWS admin, validación discriminada, ownership centralizado y repository update | jaymusicmachine | `STORY-011-04-collections-api-and-ownership-enforcement.md` |
| 2026-04-25 | STORY-011-05 | El primer slice (`BRI-92`) reemplaza los handoffs mínimos de loading/empty/error por estados operativos responsivos, manteniendo success/card polish para slices posteriores | jaymusicmachine | `STORY-011-05-collections-index-ui.md` |
| 2026-04-26 | STORY-011-05 | El segundo slice (`BRI-93`) transforma el estado success a grid visual de cards con cover, badges, secciones editables y CTA base, sin tocar API ni navegación de detalle | jaymusicmachine | `STORY-011-05-collections-index-ui.md` |
| 2026-04-26 | STORY-011-05 | El tercer slice (`BRI-94`) activa la navegación real hacia `/admin/collections/[id]` solo para entries `linked` y deja un handoff mínimo al detalle sin adelantar el editor modular | jaymusicmachine | `STORY-011-05-collections-index-ui.md` |
| 2026-04-26 | STORY-011-06 | El primer slice (`BRI-95`) reemplaza el handoff mínimo por un detail shell read-only con cover bloqueado, panel metadata y scaffolding estable para summary/property/gallery/documents | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-26 | STORY-011-06 | El segundo slice (`BRI-96`) activa el editor aislado de `Fractional investment summary` con `Save` / `Cancel` por sección, estado local explícito y PATCH discriminado reutilizando el contrato de `STORY-011-04` | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-26 | STORY-011-06 | El tercer slice (`BRI-97`) activa el editor aislado de `Property information` y refactoriza un núcleo compartido para editores de texto por sección, manteniendo gallery/documents para slices posteriores | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-26 | STORY-011-06 | El cuarto slice (`BRI-98`) monta un shell dedicado de tabs para la galería, separando `galleryImages` y `propertyImages` y dejando los handoffs de add/replace/delete listos para el siguiente slice | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-26 | STORY-011-06 | El quinto slice (`BRI-99`) activa el editor aislado de `Documents`, conservando metadata heredada de uploads y guardado manual de la lista completa por sección | jaymusicmachine | `STORY-011-06-collection-detail-editor-ui.md` |
| 2026-04-26 | STORY-011-07 | El primer slice (`BRI-100`) endurece la regresión de API/admin collections con cobertura explícita para ownership canonical, blank ids, cover immutable rejection y malformed JSON en PATCH | jaymusicmachine | `STORY-011-07-qa-responsive-evidence-and-docs-sync.md` |

## Risks and Dependencies
- Risks:
  - Desalineación entre `asset_mint_snapshots`, uploads por `draftId` y `marketplace_entries` si no se define un modelo intermedio claro para contenido editable.
  - Confusión operativa si la UI no deja explícito qué viene de blockchain y qué puede cambiarse off-chain.
  - Regresiones si el cover editable reaparece implícitamente vía API o reutilización del form de `/admin/assets/new`.
  - Riesgo de ownership bypass si se filtra solo por `marketplace_entries.created_by` sin validar snapshot/addresses.
- Dependencies:
  - `marketplace_entries` persistidos con `created_by`.
  - `asset_mint_snapshots` persistidos con `created_by`, `collection_address`, `candy_machine_address` y `form_snapshot`.
  - Pipeline existente de uploads admin (`asset_upload_contracts`, `asset_uploaded_files`) para reutilizar media/documentos.
  - `AdminShell` y estilos actuales como base visual.
- Mitigations:
  - Definir un read model explícito que cruce ownership admin + direcciones on-chain.
  - Mantener una separación estricta entre cover on-chain y contenido editable off-chain.
  - Reusar la infraestructura de upload existente en vez de introducir otro pipeline.
  - Validar el contrato con tests de autorización, immutability del cover y estados inconsistentes.

## Critique (Staff Engineer Review)
- **Verdict**: `approve with changes`
- **Summary**: The epic's direction is correct, but the current plan lacks technical specificity in critical areas, risking data inconsistency, security vulnerabilities, and poor user experience. The following changes are mandatory for final approval.

- **3 Critical Weaknesses**:
  1. **Weak Data Synchronization Strategy**: The "save/cancel buttons per section" approach is a recipe for data inconsistency. The RFC fails to define behavior for partial save failures or concurrent edits, leading to a confusing UX where the user is responsible for tracking the state of multiple independent forms.
  2. **Ambiguous Ownership Contract**: While the risk of validating ownership via a single field is noted, the solution is vague. The RFC must mandate a single, non-duplicable, server-side `assertAdminCollectionOwnership(adminId, collectionId)` helper. This helper must be the entry-point guard for all read/write API endpoints related to a specific collection to prevent security gaps from divergent implementations.
  3. **Hidden "Big Bang" Migration Risk**: The "bootstrap mapping" in `STORY-011-03` is a critical data migration step disguised as a small task. The RFC lacks a strategy for handling incomplete or corrupt `asset_mint_snapshots`, risking the introduction of inconsistent data from day one.

- **Execution Risks**:
  - **API Endpoint Proliferation**: The "per-section `PATCH`" approach, without a shared validation and authorization contract, risks creating numerous slightly different endpoints, increasing maintenance overhead and the surface area for bugs.
  - **Orphaned File Uploads**: The lifecycle for files uploaded during an editing session is undefined. If a user uploads files and cancels the edit, these files become orphaned in storage, generating technical debt and unnecessary costs.

- **Mandatory Tests**:
  1. **Cross-Source Ownership Enforcement Test**: An integration test must attempt to `PATCH` a collection where the user owns the `marketplace_entry` but not the `asset_mint_snapshot`. The API must return a `403 Forbidden` or `404 Not Found`.
  2. **Cover Image Immutability Test**: An API test must send a `PATCH` request containing the `image_url` field. The API must explicitly reject the request with a `400 Bad Request` or prove the field is ignored.
  3. **Resilient Bootstrap Test**: The bootstrap script must be tested against corrupt or incomplete `form_snapshot` data, ensuring it flags the entry for manual review instead of populating fields with invalid data.

## Resolution (Post-Critique)
- **Actions required for approval**:
  1. **State Management Strategy**: The RFC must define a client-side state management strategy (e.g., React Query, SWR) to handle server state. Each editable section must have its own query and mutation, with clear, independent UI indicators for `saving`, `success`, and `error` states to provide a robust UX.
  2. **Centralized Ownership Helper**: The implementation plan must include a dedicated slice for creating a server-side `assertAdminCollectionOwnership()` helper. All subsequent API slices for this epic must be mandated to use it.
  3. **Formal Bootstrap Plan**: `STORY-011-03` must be expanded to include a dedicated slice for a versioned, dry-run-capable bootstrap script. This script must output a manifest of successes, failures, and entries requiring manual review.
  4. **Orphaned Entry Health View**: A new, small story must be added to create a simple, read-only admin view (e.g., `/admin/health/collections`) that lists entries failing consistency checks.
  5. **Upload Lifecycle Definition**: The RFC must specify that file uploads are associated with a temporary session or draft ID. A cleanup mechanism (e.g., a background job) must be defined to purge orphaned files from cancelled editing sessions.
- **Changes applied to the RFC after critique**:
  1. `STORY-011-04` now requires a single server-side ownership helper `assertAdminCollectionOwnership(adminId, collectionId)` as the mandatory guard for collection detail read/write routes.
  2. `STORY-011-04` now converges on one `PATCH /api/admin/collections/:id` endpoint with a discriminated `section` payload instead of divergent section-specific endpoints.
  3. `STORY-011-03` now includes a formal bootstrap plan with versioned, dry-run-capable execution and a manifest of successes, failures, and manual-review items.
  4. `STORY-011-03` now defines an upload lifecycle for edit sessions, including temporary upload association and orphan cleanup after cancelled/expired sessions.
  5. `STORY-011-06` now requires a single client-side server-state strategy with independent per-section `saving`, `success`, and `error` indicators.
  6. `STORY-011-10` has been added to cover a read-only health/manual-review queue for inconsistent entries and bootstrap failures.

## Modular Delivery Rules
- Goal:
  Implementar este epic en partes pequeñas, con cambios de bajo riesgo y responsabilidades separadas, para mantener el código simple, legible y fácil de revisar.
- Mandatory delivery rules:
  - Cada story debe dividirse en slices pequeños y mergeables.
  - Un slice no debe mezclar en el mismo cambio:
    - persistencia
    - read model / query composition
    - API mutation
    - UI compleja
    - uploads
    - E2E
  - Cada slice debe introducir una sola responsabilidad dominante.
  - Si un cambio necesita tocar demasiadas capas a la vez, debe dividirse antes de implementarse.
  - Se debe preferir composición de helpers pequeños sobre componentes o services grandes.
  - Se debe preferir extender tipos/contratos existentes antes que introducir abstracciones nuevas.
  - No crear wrappers genéricos “por si acaso”.
  - No crear builders, orchestrators o adapters nuevos si una función pequeña alcanza.
- Mandatory implementation order by layer:
  1. Model/schema contract
  2. Read model
  3. API contract
  4. UI rendering
  5. UI editing interactions
  6. uploads/integrations
  7. E2E and responsive verification
- Mandatory size guidance:
  - Una migración debe hacer una sola cosa clara.
  - Un endpoint nuevo debe empezar leyendo o escribiendo una sola sección.
  - Un componente nuevo debe tener una sola intención visual o funcional.
  - Un hook/helper nuevo debe resolver un solo flujo.
  - Si un archivo empieza a cargar múltiples concerns, debe partirse.
- Suggested slice pattern for stories:
  - Slice A: tipos + contrato de datos
  - Slice B: lectura server-side
  - Slice C: endpoint específico
  - Slice D: UI read-only
  - Slice E: UI editable
  - Slice F: validación/tests
- Anti-patterns explicitly disallowed:
  - “Big bang” PRs de toda la story completa
  - componentes gigantes con tabs, forms, uploads y blockchain panel en el mismo archivo
  - handlers API que lean, validen, transformen, suban archivos y escriban todo en una sola función
  - duplicar shape mapping entre UI, API y DB sin helpers pequeños compartidos
  - introducir estado cliente complejo cuando puede resolverse por sección
- Review heuristic:
  - Si el cambio no puede explicarse en 3-5 puntos concretos, probablemente está demasiado grande.
  - Si un reviewer necesita leer demasiados archivos para entender una sola responsabilidad, el slice está mal cortado.
  - Si una story depende de otra, se debe dejar contrato intermedio claro y no adelantar implementación especulativa.

## Story Slicing Guidance
- `STORY-011-02` should be split into:
  - `BRI-80` query ownership contract
  - `BRI-81` list endpoint
  - `BRI-82` list view consumption
- `STORY-011-03` should be split into:
  - migration for new fields
  - bootstrap mapping
  - versioned dry-run bootstrap script
  - upload session lifecycle + cleanup
  - repository read/write helpers
- `STORY-011-04` should be split into:
  - centralized ownership helper
  - detail `GET`
  - single section-discriminated `PATCH`
  - payload validation
- `STORY-011-05` should be split into:
  - empty/loading/error states
  - list card UI
  - navigation to detail
- `STORY-011-06` should be split into:
  - read-only detail shell
  - summary editor
  - property info editor
  - gallery tabs shell
  - documents editor
- `STORY-011-08` should be split into:
  - blockchain read aggregation
  - authorities rendering
  - appdata rendering
- `STORY-011-09` should be split into:
  - address display + outbound maps link
  - autocomplete integration
  - reduced maps payload persistence
- `STORY-011-10` should be split into:
  - health read model
  - manual review state mapping
  - read-only health UI

## Linear Execution Guidance
- Goal:
  Reflejar el epic en Linear de forma modular y operable, para que el equipo implemente slices pequeños en vez de tickets grandes y ambiguos.
- Mapping rule:
  - `EPIC-011` debe existir como Epic en Linear.
  - Cada `STORY-011-0X` debe mapearse a un issue principal en Linear vinculado al epic.
  - Cada `Suggested Implementation Slice` debe convertirse en:
    - sub-issue separado, o
    - checklist ejecutable dentro del issue principal,
    según el tamaño real del slice.
- Mandatory issue structure:
  - Title:
    - `EPIC-011 / STORY-011-0X / <slice-name>`
  - Description must include:
    - problem
    - exact scope
    - non-goals
    - dependencies
    - validation expected
    - RFC link
- Mandatory modularity rules for Linear:
  - Un issue no debe mezclar persistencia + API + UI compleja + E2E en una sola entrega.
  - Si un issue toca más de una responsabilidad dominante, debe dividirse.
  - Si un issue no puede completarse y revisarse en un cambio pequeño, está mal cortado.
  - Un issue de UI no debe esconder cambios de modelo o API no explicitados.
  - Un issue de backend no debe arrastrar polish visual salvo que sea estrictamente necesario para destrabar otro slice.
- Recommended status flow:
  - `Backlog`
  - `Todo`
  - `In Progress`
  - `In Review`
  - `Done`
- Recommended relationship rules:
  - Usar `blocks/blocked by` entre stories o slices cuando un contrato aún no exista.
  - Usar el RFC del story como source of truth de cada issue.
  - Vincular PRs y commits a cada issue una vez existan.
- Recommended granularity:
  - Si el cambio es de schema, usar un issue dedicado.
  - Si el cambio es de endpoint, usar un issue por endpoint o por sección de `PATCH`.
  - Si el cambio es de UI, usar un issue por sección visual principal.
  - Si el cambio es de QA, separar happy path, responsive QA y docs sync cuando crezcan demasiado.
- Linear checklist template per issue:
  - [ ] Scope is limited to one dominant responsibility
  - [ ] Dependencies are explicit
  - [ ] RFC link is attached
  - [ ] Validation plan is attached
  - [ ] Non-goals are explicit
  - [ ] Expected files/areas are named

## Suggested Linear Breakdown
- `STORY-011-02`
  - issue: ownership query contract
  - issue: validation state mapping
  - issue: collections list endpoint
- `STORY-011-03`
  - issue: migration for editable collection fields
  - issue: bootstrap mapper from snapshot/form
  - issue: versioned bootstrap dry-run script
  - issue: documents taxonomy normalization
  - issue: upload session cleanup
- `STORY-011-04`
  - issue: ownership helper
  - issue: detail GET endpoint
  - issue: discriminated PATCH contract
  - issue: section handlers behind PATCH
- `STORY-011-05`
  - issue: collections index states
  - issue: collections cards and navigation
- `STORY-011-06`
  - issue: detail shell
  - issue: summary editor
  - issue: property info editor
  - issue: gallery tabs shell
  - issue: documents editor
- `STORY-011-07`
  - issue: integration test coverage
  - issue: Playwright happy paths
  - issue: responsive QA + docs sync
- `STORY-011-08`
  - issue: blockchain aggregation
  - issue: blockchain read-only panel UI
- `STORY-011-09`
  - issue: outbound maps display
  - issue: autocomplete + reduced maps payload
- `STORY-011-10`
  - issue: health read model
  - issue: manual review UI

## Open Questions
- [x] Confirmar si la integración de Google Maps v1 persiste solo `google_maps_url` + `place_label` o también un `place_json` reducido para no depender de recomputar el lookup en cada lectura.
  *Resuelto: Se aprobó en STORY-011-09 la persistencia de `google_maps_place_json` reducido.*

## Proposed Data Extension
- Reuse from `marketplace_entries` as-is:
  - `title`
  - `city`
  - `country`
  - `location_label`
  - `image_url` as immutable cover
  - `short_description`
  - `detailed_location`
  - `highlights_json`
  - `investment_notes`
  - `documents_json`
  - `collection_address`
  - `asset_mint_address`
  - `explorer_url`
  - `sync_status`
  - `updated_at`
- Reuse from `asset_mint_snapshots` as read/bootstrap source:
  - `draft_id`
  - `form_snapshot`
  - `blockchain_snapshot`
  - `candy_machine_address`
  - `collection_address`
  - `created_by`
- Reuse from `authority_registry` as read-only authority source:
  - `transfer_delegate`
  - `appdata_authority`
- Proposed fields to add into the existing editable marketplace model:
  - `gallery_images_json`
  - `property_images_json`
  - `fractional_investment_summary`
  - `property_information`
  - `google_maps_place_json` or equivalent reduced maps payload
  - `updated_by`
- Why these additions are necessary:
  - `gallery_images_json`: hoy las imágenes de galería existen en uploads/snapshot, pero no quedan como contenido vivo de marketplace.
  - `property_images_json`: mismo problema que galería, pero como grupo semántico independiente.
  - `fractional_investment_summary`: `investment_notes` existe, pero no expresa claramente un bloque editorial largo editable para collections.
  - `property_information`: `detailed_location` cubre ubicación, no descripción larga libre de la propiedad.
  - `google_maps_place_json`: autocomplete y deep-link de Maps requieren persistir al menos un payload reducido estable.
  - `updated_by`: permite trazabilidad mínima sin introducir otra tabla de auditoría.
- Fields intentionally not proposed as new columns:
  - `candy_machine_address`: ya existe en `asset_mint_snapshots`; duplicarlo en `marketplace_entries` añade riesgo de drift.
  - blockchain authorities: se derivan de `authority_registry`, `blockchain_snapshot` y lecturas on-chain; son read-only.
  - appdata economic fields: su fuente correcta es el plugin/AppData on-chain o su snapshot, no una copia editable en marketplace.

## Proposed Document Taxonomy
- Preserve current form categories as first-class tags:
  - `brochure`
  - `legal`
  - `financial`
- Extend manual tagging for typical project documents the console may need to manage:
  - `title-report`
  - `appraisal`
  - `lease`
  - `agreement`
  - `inspection`
  - `tax`
  - `insurance`
  - `permit`
  - `floor-plan`
  - `other`
- Each `documents_json` item should support:
  - `id`
  - `tag`
  - `title`
  - `label`
  - `description`
  - `url`
  - `displayOrder`
  - `mimeType`
  - `fileName`

## Proposed Read-Only Blockchain Panel V1
- Identity / address fields to display:
  - `collection_address`
  - `candy_machine_address`
  - `asset_mint_address` when relevant to the selected entry
  - `third_party_signer`
  - `freeze_delegate`
  - `transfer_delegate`
  - `appdata_authority`
- Candy Machine / guard fields that can be surfaced if present:
  - `startDate`
  - `tokenPayment.mint`
  - `tokenPayment.destination`
- Plugin fields to surface from `nft-economic-data-appdata-plugin`:
  - `revenue_share_bps`
  - `yield_bps`
  - `yield_mode`
  - `locked_at`
  - `eligible_from`
  - `earning_start_ts`
  - `distribution_enabled`
  - `economic_version`
  - `last_updated_at`
  - `updated_by`
- UX rule:
  - all blockchain/plugin fields are read-only
  - addresses must be copyable
  - addresses must link out to explorer/Solscan

## Visual Direction
- Product supplied external reference images for:
  - collections dashboard/index composition
  - project detail editor composition
  - document repository composition
  - gallery manager composition
- These references are valid for:
  - information hierarchy
  - panel distribution
  - use of hero + side panel + editable blocks
  - presence of visual cards, stats, asset grids, and management affordances
- These references are not valid for:
  - pixel-perfect imitation
  - copying exact spacing, typography, gradients, colors, or component styling
  - replacing the established admin console visual system
- Implementation rule:
  - preserve the current admin console design language
  - borrow structural ideas only where they improve clarity of editing flows

## Traceability
- Issue(s): `TBD`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
