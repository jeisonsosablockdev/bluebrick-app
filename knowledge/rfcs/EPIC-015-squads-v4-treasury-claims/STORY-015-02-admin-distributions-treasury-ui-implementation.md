---
type: ImplementationSpec
title: STORY-015-02 Admin Distributions & Treasury Multisig UI Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para la interfaz cliente minimalista en /admin/treasury/squads, controles global/fila y Banner de Alerta de Auditoría.
tags: [specs, nextjs, ui, squads, admin, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui-implementation.md
---

# STORY-015-02 Admin Distributions & Treasury Multisig UI Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-02`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- **`app/admin/treasury/squads/page.tsx`**: Ruta de administración nativa en el workspace `/admin/treasury`.
- **`components/admin/squads-multisig-console.tsx`**: Consola interactiva cliente con Header Governance Card, Audit Warning Banner, toggle "Expandir Todos / Ocultar Todos" y filas minimalistas con chevrons desplegables.
- **`components/admin/distributions-console.tsx`**: Botón **"Crear Propuesta Marco Squads"** en corridas finalizadas.

### Layer 2: Application/Consumption Layer
- Consumo de datos mediante los hooks de React Query y API Routes de `/api/admin/batches/*`.

### Layer 3: Domain/Pipelines/Services Layer
- No aplica (UI Layer).

### Layer 4: Infrastructure Layer
- Integración con Wallet Standard (Phantom / Solflare) únicamente en el borde cliente; la UI nunca decide autoridad, saldo, estado de aprobación ni fechas canónicas.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida SSR boundaries y client-wallet isolation |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita hydration safety, zero `@solana/web3.js` fuera del adaptador |
| **Cross-Cutting: State Management** | `state` | Verifica uso correcto de React Query / Zustand en componentes cliente |
| **Cross-Cutting: Docs Sync** | `docs` | Actualiza knowledge artifacts al cierre de la Story |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests de Componentes en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `frontend` (definir assertions de rendering y a11y)
- **Objetivo**: Escribir los tests de componentes React (Testing Library / Vitest) en fase RED sin implementar lógica de renderizado.
- **Archivos a Crear**:
  - `tests/components/squads-multisig-console.test.tsx`
  - `tests/components/distributions-console-squads-button.test.tsx`
- **Assertions**:
  - El componente falla si `project_start_at` o `project_end_at` están alteradas y no renderiza la alerta.
  - El botón global "Expandir Todos" no abre todas las filas si no existe el handler.
  - El botón "Crear Propuesta Marco" no se renderiza para corridas no finalizadas.
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Ruta de Página y Server Component
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-02-page-route`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `architect` (Gate 1 — SSR boundary validation)
- **Objetivo**: Crear la ruta `app/admin/treasury/squads/page.tsx` como Server Component que carga el DTO server-side con `proposalStatus`, `threshold`, `approvals`, `onChainDates`, `dbDates`.
- **Archivos a Crear**:
  - `app/admin/treasury/squads/page.tsx`
  - `app/admin/treasury/squads/loading.tsx`
- **DoD de SPEC-02**: Ruta montando con datos server-side; shell determinístico sin hydration mismatch.

---

### SPEC-03: Consola Multisig y Controles UI
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-03-console-ui`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (React Query hooks, wallet context), `qa` (verificar assertions en verde)
- **Objetivo**: Implementar `squads-multisig-console.tsx` con el Header Governance Card, Audit Warning Banner, toggle global "Expandir Todos / Ocultar Todos", filas minimalistas con chevrons desplegables (Wallet Origen, Wallet Pago, Asset Pubkey, Mint Date, Fee Breakdown, Badge Override).
- **Archivos a Crear**:
  - `components/admin/squads-multisig-console.tsx`
- **DoD de SPEC-03**: Todos los tests de SPEC-01 en verde. La UI renderiza correctamente la alerta de auditoría, las filas y los controles globales.

---

### SPEC-04: Integración del Botón "Crear Propuesta Marco" en Distribuciones
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-04-distributions-button`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (navegación y query invalidation)
- **Objetivo**: Actualizar `distributions-console.tsx` para agregar el botón **"Crear Propuesta Marco Squads"** en corridas finalizadas que redirige a `/admin/treasury/squads?runId={id}`.
- **Archivos a Modificar**:
  - `components/admin/distributions-console.tsx`
- **DoD de SPEC-04**: Botón redirige correctamente; tests de SPEC-01 del botón en verde.

---

### SPEC-05: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-05-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, hydration safety), `frontend` (a11y review), `docs` (knowledge sync)
- **Objetivo**: Auditoría de código limpio: naming, eliminación de dead code, consistencia de estilos, eliminación de `any` implícitos, verificación de accesibilidad (a11y) básica en los componentes.
- **Verificaciones**:
  - `pnpm validate` con 0 errores y 0 warnings.
  - No hay hydration mismatches.
  - Componentes separados por responsabilidad (SRP).
- **DoD de SPEC-05**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account: `Proposal` status enum (`Approved`, `Rejected`, `Executed`) | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-02 (Page Route) | Account: `Multisig` fields (`threshold`, `members`, `transactionIndex`) | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.1 |
| SPEC-03 (Console UI) | Guide: Vote — `proposalApprove` / `proposalReject` UI flow | [Vote on Proposal](https://docs.squads.so/main/development/guides/vote-on-proposal) §6.3 |
| SPEC-03 (Console UI) | Permissions Model: `Permission.Execute` para botón "Ejecutar" | [Create Multisig](https://docs.squads.so/main/development/guides/create-multisig) §5 |
| SPEC-04 (Button) | Guide: Create Proposal — workflow de Propuesta Marco | [Create Proposal](https://docs.squads.so/main/development/guides/create-proposal) §6.2 |

---

## 5. Blocking Design Contract
- La página consume un DTO server-side que incluye `proposalStatus`, `threshold`, `approvals`, `executors`, `vaultAddress`, `vaultIndex`, `transactionIndex`, `messageHash`, `onChainDates` y `dbDates`; no renderiza fechas de Postgres como verdad.
- La alerta de fechas se activa por comparación server-side contra la PDA Notario y muestra `unknown/stale` cuando RPC no responde.
- Los controles approve/reject/execute y veto requieren permisos de sesión y wallet adecuados.
- La UI no firma ni envía una transacción automáticamente al cargar, y no usa `@solana/web3.js` fuera del adaptador permitido.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| RPC unavailable | Show stale/unknown state; disable governance actions |
| DB dates differ from PDA | Show audit warning with both values |
| Proposal below threshold | Show pending approvals; disable execute |
| User lacks permission | Hide/disable action and return 403 server-side |
| Hydration or wallet mismatch | Deterministic server shell; client action fails closed |
