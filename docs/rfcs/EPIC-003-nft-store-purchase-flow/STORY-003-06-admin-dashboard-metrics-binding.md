# STORY-003-06-admin-dashboard-metrics-binding

## Metadata
- Epic: `EPIC-003-nft-store-purchase-flow`
- Story ID: `STORY-003-06-admin-dashboard-metrics-binding`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-19`
- Last Updated: `2026-03-19`

## Context
- Problem:
  Existen placeholders en interfaz admin para metricas, pero no estan conectados a datos reales.
- Why now:
  Ya se separo la capa de datos/metricas en `STORY-003-05`; ahora falta presentacion operativa para admin.
- Constraints:
  - Reutilizar placeholders existentes.
  - No redisenar layout base.
  - Mostrar estados `loading`, `error`, `empty`, `success`.
  - Debe ser responsive en 320/375/768/1024.
- Affected paths:
  - `app/admin/dashboard/page.tsx`
  - `app/admin/sales/page.tsx`
  - `app/admin/monitoring/page.tsx`
  - `components/admin/executive-dashboard.tsx`
  - `components/admin/admin-module-placeholder.tsx`
  - `components/admin/monitoring-console.tsx`
  - `components/dashboard/dashboard-charts.tsx`
  - `lib` (cliente de endpoints de metricas)

## Current UI Audit
- `/admin/dashboard`
  - Usa `ExecutiveDashboard` con datos hardcoded en memoria:
    - `BASE_KPIS`, `ALERTS`, `RECENT_ACTIVITY`, `ASSET_SUMMARY`.
  - Tiene estados de vista por query param `view` (`loading`, `error`, `empty`, `partial-data`), útiles para prototipado.
  - Renderiza `DashboardCharts context=\"admin\"`, que hoy consume dataset estático interno.
- `/admin/sales`
  - Usa `AdminModulePlaceholder` con `title`, `subtitle`, `highlights` y `listTitle` estáticos.
  - No tiene conexión a backend ni tabla de eventos de venta.
- `/admin/monitoring`
  - Usa `MonitoringConsole` con `EVENTS` hardcoded, toolbar de filtros, tabla y drawer de detalle.
  - Acciones de fila (`Reprocess`, `Copy signature`, `Filter by asset`) están presentacionales.

## Proposal
- Approach summary:
  Conectar las tres vistas admin existentes a datos reconciliados del backend sin cambiar la arquitectura visual actual.
- Technical design:
  - API Contract (Route-Oriented):
    - `GET /api/admin/dashboard/overview?range=24h|7d|30d`
      - Devuelve: `kpis`, `alerts`, `recentActivity`, `assetSummary`, `charts`, `meta.lastSyncedAt`, `meta.dataFreshness`.
    - `GET /api/admin/sales/overview?range=24h|7d|30d&status&wallet&candyMachine`
      - Devuelve: `highlights`, `summary`, `recentSales`, `meta`.
    - `GET /api/admin/monitoring/events?eventType&status&wallet&asset&signature&page&limit`
      - Devuelve: `events[]`, `pagination`, `meta`.
    - `POST /api/admin/monitoring/events/:eventId/reprocess` (acción de botón existente).
  - Dashboard Binding (`/admin/dashboard`):
    - `BASE_KPIS` -> `overview.kpis`
    - `ALERTS` -> `overview.alerts`
    - `RECENT_ACTIVITY` -> `overview.recentActivity`
    - `ASSET_SUMMARY` -> `overview.assetSummary`
    - `DashboardCharts context=\"admin\"` migra a `DashboardCharts data={overview.charts}` con fallback al contexto estático solo en modo dev.
    - Mantener `view=loading|error|empty|partial-data` como override de QA/manual debug, pero el estado real viene de la respuesta backend.
  - Sales Binding (`/admin/sales`):
    - Mantener layout de `AdminModulePlaceholder` como baseline visual.
    - `highlights` pasa de estático a dinámico con `sales.overview.highlights`.
    - `listTitle` se adapta al rango/filtro activo.
    - Fase siguiente (sin rediseño estructural) agrega tabla compacta de `recentSales` debajo del placeholder actual.
  - Monitoring Binding (`/admin/monitoring`):
    - `EVENTS` -> `monitoring.events`.
    - Toolbar de filtros actual se conecta 1:1 a query params del endpoint.
    - Drawer de detalle se llena con payload real del evento.
    - Acciones:
      - `Reprocess` llama endpoint `POST /reprocess`.
      - `Copy signature` usa dato real.
      - `Filter by asset` aplica filtro local + query.
  - Data Freshness and Source:
    - Todas las vistas muestran `meta.lastSyncedAt`.
    - Etiqueta visible de `meta.dataFreshness` (`fresh|stale`) y `meta.source=webhook-reconciled`.
  - Scope Guardrails:
    - No se modifica ni se integra nada de:
      - `/admin/mint`
      - `/admin/assets`
      - `/admin/assets/new`
- Alternatives considered:
  - Crear nuevo dashboard desde cero: rechazado por requerimiento de reutilizar placeholders.
  - Mezclar llamadas RPC directas desde UI: rechazado (debe consumir backend consolidado).
- Tradeoffs:
  - Restriccion de layout puede limitar refinamientos visuales.
  - Entrega mas rapida y consistente con interfaz actual.

## Critique
- Reviewer(s):
  - `jaymusicmachine`
- Critical findings:
1. Debe respetarse el layout sugerido existente.
2. Placeholder sin data no sirve; hay que cubrir estados vacios de forma clara.
3. Debe quedar navegable y usable en mobile.
- 4. Debe existir mapping explícito entre variables hardcoded actuales y payload backend por ruta.
- Blocking concerns:
  Confirmar contrato final de payload para `overview.charts` y `monitoring.events`.

## Resolution
- Final approach after critique:
  Implementar binding por ruta sobre componentes actuales (`ExecutiveDashboard`, `AdminModulePlaceholder`, `MonitoringConsole`) con contrato API explícito y sin tocar módulos de mint/assets.
- Changes accepted:
  - Mapping explicito placeholder -> metrica.
  - Estados de carga/error/vacio.
  - Mapping explícito de hardcoded arrays a payload backend.
  - Endpoint contract específico por ruta admin.
- Changes rejected (with rationale):
  - Rediseño completo del panel: fuera de alcance de esta historia.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-20`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado. El contrato de API por ruta y el plan de binding sobre los componentes existentes es claro y ejecutable.

## Status
- Current status: `approved`
- Next action:
  Implementar los clientes de API y conectar los componentes de la UI a los datos reales.
- Exit criteria:
- [ ] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Formateo de metricas y fallbacks de datos vacios.
- Integration tests:
  - Render correcto de cards/tablas con respuestas reales de backend.
  - Filtros aplican correctamente y actualizan resultados.
  - `/admin/dashboard` reemplaza `BASE_KPIS/ALERTS/RECENT_ACTIVITY/ASSET_SUMMARY` por datos API sin romper layout.
  - `/admin/sales` reemplaza `highlights` estático por datos API manteniendo placeholder base.
  - `/admin/monitoring` reemplaza `EVENTS` estático por datos API y mantiene funcionamiento de drawer/filtros.
- Devnet validation (if applicable):
  - Verificar que compras reales aparecen reflejadas en panel admin.
- Responsive QA (if applicable):
  - Checklist completo en 320/375/768/1024 sin overflow horizontal.

## Traceability
- Related issue(s): `EPIC-003`
- Related PR(s):
- Final commit hash(es):
