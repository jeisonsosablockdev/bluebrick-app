# STORY-013-07-clean-code-refactor-slices

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-07-clean-code-refactor-slices`
- Status: `in-review` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-12`
- Last Updated: `2026-05-12`

## Context
- Problem:
  Las slices `S04` a `S06` cerraron el comportamiento esperado, pero dejaron dos modulos de alto riesgo de mantenimiento: `lib/notifications/admin-campaigns.ts` y `lib/notifications/delivery-jobs.ts`. Ambos mezclan dominio, persistencia, transporte, observabilidad y fallback in-memory en archivos demasiado grandes.
- Why now:
  El feature ya esta implementado. Este es el momento correcto para separar responsabilidades sin mover comportamiento externo ni reabrir decisiones de producto.
- Constraints:
  - No se deben romper contratos HTTP existentes.
  - No se deben cambiar SQL, semantics de status, `dedupeKey`, env vars ni eventos de observabilidad.
  - El refactor debe preservar evidencia y cobertura existente antes de introducir nuevas abstracciones.
  - Si este follow-up se ejecuta, debe seguir gitflow por slices sobre una nueva rama de integracion `refactor/*`.
- Affected paths:
  - `lib/notifications/admin-campaigns.ts`
  - `lib/notifications/delivery-jobs.ts`
  - `components/admin/admin-notification-campaign-console.tsx`
  - `app/api/admin/notifications/campaigns/*`
  - `app/api/internal/notifications/*`
  - `tests/lib/*notifications*`
  - `tests/api/*notifications*`

## Proposal
- Approach summary:
  Ejecutar un cleanup secuencial, con slices pequenas y verificables, que separen dominio, persistencia, transporte y UI orchestration sin cambiar comportamiento observable.
- Technical design:
  - Mantener las rutas actuales como fachada estable.
  - Extraer primero seams de dominio y persistencia, no helpers cosmeticos.
  - Congelar el comportamiento con tests actuales antes de mover logica.
  - Introducir nuevas unidades solo cuando reduzcan claramente responsabilidad mezclada.
  - Tratar la consola admin como un componente de orquestacion fina y no como un contenedor de toda la logica de red.

## Slice Plan
| Slice | Proposed branch | Scope | Exit gate |
| --- | --- | --- | --- |
| `R01` | `refactor/shared-pwa-web-push-cleanup-bri-157-s01-admin-campaign-domain-split` | Partir `admin-campaigns.ts` en `admin-campaign-config`, `admin-campaign-audience`, `admin-campaign-rate-limit`, `admin-campaign-repository` y `admin-campaign-service`, manteniendo una fachada estable | `npm test`, `npm run validate`, sin cambios en responses o eventos |
| `R02` | `refactor/shared-pwa-web-push-cleanup-bri-157-s02-delivery-job-domain-split` | Partir `delivery-jobs.ts` en `delivery-job-repository`, `delivery-batch-processor`, `delivery-queue`, `delivery-actor` y `delivery-job-service`, manteniendo `processTransactionalWebPushJobBatch` y `createOrGetTransactionalWebPushJob` como entrypoints estables | `npm test`, `npm run validate`, mismas semantics de job status y dedupe |
| `R03` | `refactor/shared-pwa-web-push-cleanup-bri-157-s03-admin-console-hook-split` | Extraer `useAdminNotificationCampaignConsole` y separar `HealthSummary`, `CampaignForm` y `PreviewTable` del componente actual | `npm test`, `npm run validate`, Playwright responsive del panel sin regresiones |
| `R04` | `refactor/shared-pwa-web-push-cleanup-bri-157-s04-route-contract-consolidation` | Consolidar schemas, request/response types y helpers de error del dominio notifications para reducir duplicacion en routes admin/internal | `npm test`, `npm run validate`, sin cambios en status codes ni payload shape |
| `R05` | `refactor/shared-pwa-web-push-cleanup-bri-157-s05-dead-code-and-config-isolation` | Eliminar codigo muerto, mover lectura de env/config a archivos dedicados y documentar limites del dominio notifications | `npm test`, `npm run validate`, docs del epic sincronizadas |

## Critique (Staff Engineer)
- Reviewer(s):
  - `clean-code`
  - `Gemini Code Assist (Staff Engineer)`
- Critical findings:
1. Si el refactor empieza por helpers menores o renombres de archivos, se vuelve maquillaje y no corrige la mezcla de responsabilidades real.
2. Si se parte `delivery-jobs.ts` sin congelar antes la cobertura, es facil romper semantica de retries, pruning o dedupe sin verlo a tiempo.
3. Un helper global de `errorResponse` para todo el repo seria una abstraccion prematura; la consolidacion debe quedarse en el bounded context de notifications.
4. Reusar `BRI-157` para el cleanup puede ser aceptable solo si el issue padre sigue abierto; si no, este follow-up necesita un issue de refactor propio antes de abrir ramas.
5. **Acoplamiento Prematuro (R04)**: Consolidar schemas de Admin e Internal puede ser un anti-patrón si tienen distintas razones para evolucionar. El DRY no debe forzar el acoplamiento de dos contextos que necesitan flexibilidades distintas.
6. **Límites Transaccionales**: Al extraer `repository` y `service` en `R01` y `R02`, se debe prestar especial atención a no romper los boundaries de las transacciones de base de datos ni dejar conexiones huérfanas que agoten el pool.
- Blocking concerns:
  - No aprobar si el plan propone cambiar contratos externos o si mezcla cleanup estructural con nuevas capacidades de producto.
  - Los tests de integración deben validar el shape exacto de las respuestas HTTP (snapshot o contract testing) antes de proceder con `R04`.

## Resolution
- Final approach after critique:
  El cleanup se aprueba solo como trabajo estructural incremental y contract-preserving.
- Changes accepted:
  - Separacion por bounded context interno.
  - Fachadas estables durante la migracion.
  - Slices pequenas con gates de regresion explicitos.
  - Mantener schemas separados si Admin e Internal tienen propósitos distintos, evitando "DRY" ciego.
- Changes rejected (with rationale):
  - Rechazado el refactor “big bang” de toda la carpeta `lib/notifications`.
  - Rechazado introducir nuevos flujos de producto, nuevas colas o nuevos criterios de segmentacion dentro del cleanup.

## Decision
- Decision: `approved`
- Decision date: `2026-05-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado como trabajo estructural preventivo. Dado que el issue padre `BRI-157` y la rama de integración siguen abiertos, este refactor se ejecutará dentro de este mismo ciclo. Se considera un requisito antes de cerrar el Epic para garantizar que no se fusione un monolito de notificaciones a `develop`.

## Status
- Current status: `approved`
- Next action:
  Continuar bajo la trazabilidad de `BRI-157`. Abrir la sub-rama para `R01` desde la rama de integración actual y atacar la separación de responsabilidades en `lib/notifications/admin-campaigns.ts`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Slice plan accepted with one dominant responsibility per slice

## Test and Validation Plan
- Unit tests:
  - Mantener y ampliar `tests/lib/admin-notification-campaigns.test.ts`
  - Mantener y ampliar `tests/lib/delivery-jobs.test.ts`
  - Agregar pruebas puras para modulos extraidos solo cuando el seam ya exista
- Integration tests:
  - Mantener `tests/api/admin-notifications-campaigns-routes.test.ts`
  - Mantener `tests/api/internal-notifications-routes.test.ts`
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria para `R03` porque toca `/admin/notifications`.

## Release Gates
- Required quality gates:
  - `npm run validate`
  - `npm run validate:db` solo si algun slice toca schema o persistencia SQL
  - `npx playwright test e2e/admin-notifications.responsive.pw.spec.ts --project=playwright-smoke` para `R03`

## Traceability
- Related issue(s): `BRI-157` (tentative; replace if cleanup gets its own parent issue)
- Related PR(s): `pending`
- Final commit hash(es): `pending`
