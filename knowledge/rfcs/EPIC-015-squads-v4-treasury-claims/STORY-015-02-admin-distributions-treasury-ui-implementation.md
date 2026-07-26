---
type: ImplementationSpec
title: STORY-015-02 Admin Distributions & Treasury Multisig UI Implementation Spec
description: Especificación técnica atómica de implementación para la interfaz cliente minimalista en /admin/treasury/squads, controles global/fila y Banner de Alerta de Auditoría.
tags: [specs, nextjs, ui, squads, admin, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui-implementation.md
---

# STORY-015-02 Admin Distributions & Treasury Multisig UI Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-02`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s02-treasury-ui`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- **`app/admin/treasury/squads/page.tsx`**: Ruta de administración nativa en el workspace `/admin/treasury`.
- **`components/admin/squads-multisig-console.tsx`**: Consola interactiva cliente con:
  - Header Governance Card con **Audit Warning Banner** de modificación de fechas.
  - Botón **"Expandir Todos" / "Ocultar Todos"** (*Expand All / Collapse All*).
  - Filas minimalistas con chevrons desplegables (Wallet Origen, Wallet Pago, Asset Pubkey, Mint Date y Fee Breakdown).
- **`components/admin/distributions-console.tsx`**: Botón **"Crear Propuesta Marco Squads"** en corridas finalizadas.

### Layer 2: Application/Consumption Layer
- Consumo de datos mediante los hooks de React Query y API Routes de `/api/admin/batches/*`.

### Layer 3: Domain/Pipelines/Services Layer
- No aplica (UI Layer).

### Layer 4: Infrastructure Layer
- Integración con Wallet Standard (Phantom / Solflare).

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & UI Component Test File
- `tests/components/squads-multisig-console.test.tsx`

### Test Commands
```bash
pnpm test tests/components/squads-multisig-console.test.tsx
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - El componente falla si `project_start_at` o `project_end_at` están alteradas y no renderiza la alerta.
   - El botón global "Expandir Todos" no abre todas las filas si no existe el handler.
2. **GREEN (Paso)**:
   - Renderizado limpio del **Audit Warning Banner** al detectar fechas modificadas en el payload.
   - El toggle "Expandir Todos" despliega correctamente las 20 filas mostrando el Asset Mint Pubkey y días transcurridos desde el mint.

---

## 3. Definition of Done (DoD)
- [ ] Componente `squads-multisig-console.tsx` desarrollado y libre de hydration mismatches.
- [ ] Test `tests/components/squads-multisig-console.test.tsx` en verde.
