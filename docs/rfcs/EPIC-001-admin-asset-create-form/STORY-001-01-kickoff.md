# STORY-001-01-kickoff

## Metadata
- Epic: `EPIC-001-admin-asset-create-form`
- Story ID: `STORY-001-01-kickoff`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-13`
- Last Updated: `2026-03-13`

## Context
- Problem:
  El admin necesita crear activos en `/admin/assets/new`, pero hoy faltan automatizaciones, claridad de campos y capacidad de carga/importacion masiva.
- Why now:
  Este formulario es la puerta de entrada para el mint inicial y errores aqui impactan metadata on-chain, pricing y operacion comercial.
- Constraints:
  Mantener validaciones criticas server-side, no romper compatibilidad de datos existentes, y asegurar UX responsive desktop/mobile.
- Affected paths:
  `/app/admin/assets/new`, componentes del formulario, esquemas/validaciones compartidas y endpoints de creacion de activo.

## Proposal
- Approach summary:
  Implementar `Admin Asset Form V3` incorporando multi-upload via Google Cloud Storage (Signed URLs), autogeneracion estricta de coleccion (Metaplex bounds), matematicas financieras seguras on-chain e importacion atomica, eliminando estados comerciales manuales del formulario.
- Technical design:
  - Multi-upload (Performance/UX):
    Archivos pesados (`gallery`, `legalDocs`) se suben via Google Cloud Storage Signed URLs de forma asincrona y particionada. La UI solo envia referencias en el submit final para evitar timeouts.
  - Relacion NFT/Coleccion (@metaplex):
    `collectionSymbol`: max 10 bytes (estricto Metaplex Token Metadata). Autogenerado y truncado a limite seguro.
    `collectionName`: max 32 bytes.
    Validacion cruzada contra BD para evitar colisiones. Compatible con despliegues de Candy Machine.
  - Claridad metadata:
    `metadataBaseName`: prefijo de nombre para NFTs serializados (ej. `Asset ABC #001`).
    `metadataBaseUri`: URI base para metadata JSON versionada (ej. `https://.../asset-abc/`).
  - Estado del activo y Gobernanza (@helius):
    Se elimina del formulario la gestion manual de `draft`, `published`, `sold_out`, `paused`, `closed`.
    El estado funcional/comercial del activo se deriva de la data on-chain confirmada.
    Indexacion: Toda creacion/cambio on-chain se conciliara en la BD consumiendo Helius Webhooks, eliminando polling o estados client-side engañosos.
    Solo se conservan estados tecnicos internos de proceso (ej. `pending_upload`, `ready_to_mint`, `mint_submitted`, `mint_confirmed`, `mint_failed`) para observabilidad operativa.
  - Campos diferenciales:
    `deliveryDate` y `constructionDate` con date picker moderno (navegacion rapida por mes/anio) + input manual editable.
  - Reglas financieras seguras:
    `expectedAnnualReturn` se captura y muestra en porcentaje (`%`) con validacion.
    Uso exclusivo de enteros base-unidad (`BigInt`, USDC decimals, lamports) en server-side, prohibiendo divisiones nativas de floats.
    Formula: `nftCostMinor = floor(fundingGoalMinor / totalUnits)`
    Manejo de residuo: `residualMinor = fundingGoalMinor - (nftCostMinor * totalUnits)`. El residuo se notificara en el UI y se asignara a una cuenta operativa de ajuste.
  - Importacion masiva atomica:
    Opcion de cargar CSV/XLSX. Validacion estricta server-side con esquema `Zod`.
    Soporte de `dry-run` para previsualizacion de datos y validacion on-chain sin commit.
    Transaccionalidad `all-or-nothing`: si 1 fila falla la validacion, el payload entero es rechazado.
- Alternatives considered:
  - Mantener solo carga manual campo por campo (rechazada por friccion alta).
  - Forzar campos autogenerados no editables (rechazada por baja flexibilidad operativa).
- Tradeoffs:
  Mayor complejidad de UI/validaciones, pero menor error operativo y mejor consistencia de datos.

## Critique
**3 Critical Weaknesses (Final Review):**
1. **Undefined Asynchronous UX:** La propuesta introduce un flujo altamente asíncrono (GCS uploads, Helius webhooks, background jobs para Candy Machine) sin definir cómo la UI gestionará estos estados. El admin podría quedar en un limbo de "carga" sin saber si el proceso falló, está en progreso o tuvo éxito, generando doble-submit o pérdida de confianza.
2. **Operational Blind Spots:** La nueva arquitectura (GCS, workers, webhooks) carece de un plan de observabilidad. No se mencionan dead-letter queues para workers fallidos, logging estructurado para rastrear un activo a través del pipeline, ni alertas para fallos de webhook. Esto es inaceptable para un flujo que maneja valor.
3. **Insecure Storage Uploads:** "GCS Signed URLs" es una directiva demasiado genérica. Sin políticas estrictas en la firma (`Content-Length-Range`, `Content-Type`, expiración corta, nombres de objeto definidos por el servidor), se abre un vector de ataque para DoS (subidas de archivos gigantes) o inyección de contenido malicioso.

**Execution Risks:**
- **Event Loop Saturation:** El `dry-run` o la validación Zod de un CSV de miles de filas en el proceso principal de Node.js bloqueará el event loop, degradando el performance para todos los demás usuarios. Estas tareas deben ejecutarse en un worker thread o proceso separado.
- **Race Conditions:** Un webhook de Helius podría llegar antes de que nuestra propia base de datos termine de escribir el estado inicial (`mint_submitted`), causando fallos de conciliación o estados inconsistentes.

**Uncovered Edge Cases:**
- **Orphaned Files:** Si un admin sube archivos a GCS pero abandona el formulario, estos archivos quedan huérfanos, generando costos. Se necesita una política de ciclo de vida (Garbage Collection) en el bucket de GCS.
- **Zero-Cost NFT:** Si `fundingGoalMinor` es menor que `totalUnits`, el cálculo `floor` resultará en `nftCostMinor = 0`. El formulario debe validar y prevenir esta condición.

**Stack Alignment:**
- **@squads:** La propuesta debe especificar que la acción final que dispara el mint on-chain se empaqueta como una Propuesta para un Squads Multisig, no como una ejecución directa.
- **@metaplex:** ALINEADO, pero la creación/actualización de Candy Machine para importaciones masivas debe ser delegada explícitamente a un background worker para no exceder los límites de transacción.
- **@helius:** ALINEADO, pero es mandatorio implementar un cron job de conciliación como fallback para la indisponibilidad de webhooks.

**Incorrect Assumptions:**
- Asumir que el servidor puede cargar un XLSX de 50,000 filas en memoria. Se debe usar un stream parser.
- Asumir una entrega garantizada y en orden de los webhooks de Helius.

**Mandatory Tests:**
- **Security/Infra:** Test de políticas de GCS Signed URL para forzar `Content-Length-Range` y `Content-Type`.
- **Integration:** Test del cron de conciliación (fallback de Helius) simulando un webhook perdido.
- **Unit:** Test de la validación que previene `nftCostMinor = 0`.

Verdict: approve with changes

## Resolution
- Final approach after critique:
  Se adopta una version endurecida del RFC alineada con producto. La implementacion se divide en Fase 1 (formulario, importacion y cargas en GCS) y Fase 2 (automatizacion/on-chain hardening), manteniendo bloqueo de implementacion final hasta aprobar decision.
- Changes accepted:
  - Se elimina del formulario la gestion de estados comerciales (`draft/published/sold_out/paused/closed`).
  - El lifecycle comercial del activo se deriva de blockchain como fuente de verdad.
  - Se mantienen solo estados tecnicos internos para trazabilidad del pipeline de mint.
  - Se define precision financiera sin `float`: uso de enteros base-unidad (lamports/minor units), reglas de redondeo explicitas y residual handling documentado.
  - Regla de calculo actualizada:
    `nftCostMinor = floor(fundingGoalMinor / totalUnits)`
    `residualMinor = fundingGoalMinor - (nftCostMinor * totalUnits)`
    El residual se maneja con estrategia explicita (ajuste en ultima unidad o unidad de reserva).
  - Importacion CSV/XLSX con validacion estricta server-side (schema), modo `dry-run`, reporte por fila/celda y politica de persistencia por defecto `all-or-nothing`.
  - Validaciones de Metaplex para `collectionSymbol` y `collectionName`: limites, normalizacion, deteccion de colisiones y sufijo deterministico cuando aplique.
  - Subidas de archivos via Google Cloud Storage Signed URLs con confirmacion posterior de metadata, evitando timeouts por payload grande.
  - Se agrega alineacion de stack:
    @metaplex para reglas de metadata/collection,
    @helius webhooks para indexacion de cambios on-chain hacia BD,
    @squads para operaciones de gobernanza sensibles en entorno productivo (no como estado manual de formulario).
- Changes rejected (with rationale):
  - No se mantiene selector de estados comerciales en UI.
    Rationale: duplica logica y puede contradecir la fuente de verdad on-chain.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-13`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Propuesta V3 aprobada. La implementación debe incluir obligatoriamente: 1) Un plan de UX para manejar la asincronía. 2) Workers para tareas pesadas (CSV, mints). 3) Políticas de seguridad en Signed URLs. 4) Un cron de conciliación como fallback para webhooks.

## Status
- Current status: `approved`
- Next action:
  Iniciar Fase 1 de implementación: TDD para esquemas Zod y lógica financiera, seguido del endpoint seguro para GCS Signed URLs y el diseño de la UI para estados asíncronos.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  Reglas de autogeneracion (`collectionSymbol`, `collectionName`), limites Metaplex y calculo financiero con casos de residual/redondeo.
- Integration tests:
  Flujo completo de creacion de activo, importacion CSV/XLSX con `dry-run`, politica all-or-nothing y flujo de upload con GCS Signed URLs.
- Devnet validation (if applicable):
  Si el flujo dispara mint inicial: ejecutar transaccion real en Devnet, confirmar firma, validar metadata/collection y derivar estado comercial desde eventos on-chain indexados por Helius.
- Responsive QA (if applicable):
  Verificar formulario y date picker en 320px, 375px, 768px, 1024px sin overflow.

## Traceability
- Related issue(s): `EPIC-001` (pendiente crear issue en tracker)
- Related PR(s): `PR-EPIC-001-ADMIN-ASSET-FORM` (pendiente apertura)
- Final commit hash(es): `PENDING-MERGE`
