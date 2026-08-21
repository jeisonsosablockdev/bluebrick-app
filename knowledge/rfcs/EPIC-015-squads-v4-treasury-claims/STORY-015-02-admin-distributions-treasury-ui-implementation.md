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
- **`apps/web/src/app/admin/treasury/squads/page.tsx`**: Ruta de administración nativa en el workspace `/admin/treasury`.
- **`apps/web/src/features/admin/presentation/treasury-console.tsx`**: Consola interactiva cliente con Header Governance Card, Audit Warning Banner, toggle "Expandir Todos / Ocultar Todos" y filas minimalistas con chevrons desplegables.
- **`apps/web/src/features/admin/presentation/distributions-console.tsx`**: Botón **"Crear Propuesta Marco Squads"** en corridas finalizadas.

### Layer 2: Application/Consumption Layer
- Consumo de datos mediante los hooks de React Query y API Routes en `apps/web/src/app/api/admin/payout-runs/*`.

### Layer 3: Domain/Pipelines/Services Layer
- No aplica (UI Layer).

### Layer 4: Infrastructure Layer
- Integración con Wallet Standard (Phantom / Solflare) únicamente en el borde cliente mediante `@solana/react` y `@/features/shared/presentation/wallet`; la UI nunca decide autoridad, saldo, estado de aprobación ni fechas canónicas.

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

### SPEC-01: Modernización del Estilo Visual de /admin y /admin/distributions
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-01-admin-ui-modernization`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `architect` (validación de componentes de presentación)
- **Objetivo**: Modernizar el layout de `/admin` y la consola de `/admin/distributions` con el sistema de diseño Dark Glassmorphism, tarjetas KPI de métricas, estilos de badges nítidos, efectos hover interactivos y jerarquía visual pulida.
- **Archivos a Crear/Modificar**:
  - `apps/web/src/features/admin/presentation/admin-shell.tsx`
  - `apps/web/src/features/admin/presentation/distributions-console.tsx`
  - `tests/components/admin-ui-modernization.test.tsx`
- **DoD de SPEC-01**: Interfaz renovada, responsiva, tarjetas KPI en el encabezado, tests de renderizado en verde y `pnpm validate` limpio.

---

### SPEC-02: TDD — Tests de Componentes de Tesorería en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-02-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `frontend` (definir assertions de rendering y a11y)
- **Objetivo**: Escribir los tests de componentes React (Testing Library / Vitest) en fase RED para la consola de Squads multisig, control global de expansión y el banner de auditoría.
- **Archivos a Crear**:
  - `tests/components/squads-multisig-console.test.tsx`
  - `tests/components/distributions-console-squads-button.test.tsx`
- **Assertions**:
  - El componente falla si `project_start_at` o `project_end_at` están alteradas y no renderiza la alerta.
  - El botón global "Expandir Todos" no abre todas las filas si no existe el handler.
  - El botón "Crear Propuesta Marco" no se renderiza para corridas no finalizadas.
- **DoD de SPEC-02**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-03: Ruta de Página y Server Component
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-03-page-route`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `architect` (Gate 1 — SSR boundary validation)
- **Objetivo**: Crear la ruta `apps/web/src/app/admin/treasury/squads/page.tsx` como Server Component que carga el DTO server-side con `proposalStatus`, `threshold`, `approvals`, `onChainDates`, `dbDates`.
- **Archivos a Crear**:
  - `apps/web/src/app/admin/treasury/squads/page.tsx` (Layer 1 — Presentation: Server Component)
  - `apps/web/src/app/admin/treasury/squads/loading.tsx` (Layer 1 — Presentation: Skeleton loading)
- **DoD de SPEC-03**: Ruta montando con datos server-side; shell determinístico sin hydration mismatch.

---

### SPEC-04: Consola Multisig y Controles UI
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-04-console-ui`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (React Query hooks, wallet context), `qa` (verificar assertions en verde)
- **Objetivo**: Implementar la consola multisig con el Header Governance Card, Audit Warning Banner, toggle global "Expandir Todos / Ocultar Todos", filas minimalistas con chevrons desplegables (Wallet Origen, Wallet Pago, Asset Pubkey, Mint Date, Fee Breakdown, Badge Override).
- **Archivos a Crear**:
  - `apps/web/src/features/admin/presentation/treasury-console.tsx` (Layer 1 — Presentation: FDD feature component)
- **DoD de SPEC-04**: Todos los tests de SPEC-02 en verde. La UI renderiza correctamente la alerta de auditoría, las filas y los controles globales.

---

### SPEC-05: Modal Interactivo de Creación de Distribución y Botón Squads
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-05-distributions-modal`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (navegación y query invalidation)
- **Objetivo**: Actualizar `distributions-console.tsx` para agregar el modal interactivo de creación de distribución `[ + Nueva Distribución ]` conectado a `POST /api/admin/distributions/runs` y el botón **"Crear Propuesta Marco Squads"**.
- **Archivos a Modificar**:
  - `apps/web/src/features/admin/presentation/distributions-console.tsx` (Layer 1 — Presentation: FDD feature component)
- **DoD de SPEC-05**: Modal y botón interactivo completamente funcionales; tests unitarios y de integración en verde.

---

### SPEC-06: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s02-06-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, hydration safety), `frontend` (a11y review), `docs` (knowledge sync)
- **Objetivo**: Auditoría de código limpio: naming, eliminación de dead code, consistencia de estilos, eliminación de `any` implícitos, verificación de accesibilidad (a11y) básica en los componentes.
- **Verificaciones**:
  - `pnpm validate` con 0 errores y 0 warnings.
  - No hay hydration mismatches.
  - Componentes separados por responsabilidad (SRP).
- **DoD de SPEC-06**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

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

## 7. Supersession Contract — PayoutRun UI

Desde 2026-07-26, cualquier mención a batch, legs o `transactionIndex` de payout queda sustituida por `PayoutRun` y `ClaimReceipt`. El DTO debe mostrar `treasuryPolicyPda`, attesters, `snapshotHash`, `merkleRoot`, `proposalPda`, `payoutRunPda`, `escrowAta`, `fundingSignature`, estado del run, `settledCount` y `itemCount`. La consola nunca ofrece un botón de transferencia directa: sólo puede proponer setup, mostrar/votar/ejecutar la propuesta Squads y observar receipts. Si faltan policy, dos attestationes válidas, run sellado o evidencia RPC, las acciones se deshabilitan y el estado es `unknown`/fail-closed.
