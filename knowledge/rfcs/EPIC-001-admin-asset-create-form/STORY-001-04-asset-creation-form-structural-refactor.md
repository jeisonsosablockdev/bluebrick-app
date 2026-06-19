---
type: RFC
title: STORY- 001 04 Asset Creation Form Structural Refactor
description: STORY- 001 04 Asset Creation Form Structural Refactor - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-001-admin-asset-create-form/STORY-001-04-asset-creation-form-structural-refactor.md
---

# STORY-001-04-asset-creation-form-structural-refactor

## Metadata
- Epic: `EPIC-001-admin-asset-create-form`
- Story ID: `STORY-001-04-asset-creation-form-structural-refactor`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problema:
  `components/admin/asset-creation-form.tsx` tiene ~2k líneas y mezcla orquestación, estado de dominio, lógica de uploads/import jobs, validaciones y render UI en un solo archivo.
- Impacto:
  - Alto costo de cambio y riesgo de regresiones.
  - Baja legibilidad para onboarding.
  - Dificultad para escalar nuevas features de admin assets.
- Objetivo:
  Refactorizar a una arquitectura modular orquestada por contenedor principal + componentes especializados, preservando comportamiento funcional.
- Alcance:
  - Solo refactor estructural de frontend admin asset creation.
  - Sin rediseño visual mayor.
  - Sin cambio de contratos API.

## Proposal
- Arquitectura objetivo:
  - `AssetCreationFormContainer` (orquestador): coordinación de estado global, side-effects y submit.
  - Hooks de dominio:
    - `useAssetCreationFormState` (estado + mutaciones).
    - `useAssetUploadWorkflow` (signed-url/finalize/upload states).
    - `useAssetImportJobs` (CSV async tracking y errores).
  - Componentes de presentación desacoplados:
    - `AssetIdentitySection`
    - `AssetLocationSection`
    - `AssetMediaSection`
    - `AssetFinancialSection`
    - `AssetTypeSpecificSection`
    - `AssetCollectionSection`
    - `AssetMarketplaceSubmitSection`
    - `AssetPreviewSection`
- Contrato de sunset legacy (obligatorio):
  - No se habilita dual-runtime `legacy/new` en producción.
  - La ruta `/admin/assets/new` debe quedar servida por una sola implementación (nueva arquitectura).
  - El código legacy del monolito se elimina del repositorio al cierre de la story.
  - Si se mantiene el path histórico `components/admin/asset-creation-form.tsx`, debe quedar como wrapper del nuevo container, sin lógica de negocio legacy.
- Contrato explícito de estado (obligatorio):
  - Patrón: `useReducer` + `FormStateContext` + `FormDispatchContext` separados.
  - No se permite estado global mutable fuera del reducer.
  - El reducer es la única fuente de verdad para `AssetForm`, `FormStatus`, `TypeFormState`, upload UI states e import tracker.
  - Cada acción debe ser tipada (`type` discriminado) y pura.
- Contrato explícito de comunicación entre módulos:
  - Los hooks de dominio (`useAssetUploadWorkflow`, `useAssetImportJobs`) no se llaman entre sí.
  - La comunicación se hace vía callbacks tipados inyectados por el container:
    - `onUploadFinalized(field, payload)`
    - `onImportJobStateChanged(tracker)`
    - `onImportErrorsResolved(errors)`
  - El container traduce callbacks a `dispatch(action)`; no hay mutación directa cruzada.
- Estrategia de tipado (Fase 1, no negociable):
  - Definir tipos canónicos en módulo central:
    - `components/admin/asset-creation/types.ts`
    - `components/admin/asset-creation/actions.ts`
    - `components/admin/asset-creation/reducer.ts`
  - Ningún componente/hook puede redefinir shape parcial de `AssetForm`.
  - Seletores derivados tipados en `selectors.ts` para aislar lógica de lectura.
- Contrato de rendimiento:
  - Contextos separados (`state` y `dispatch`) para evitar re-render masivo.
  - Selectores memoizados para lecturas costosas.
  - Componentes de sección envueltos en `memo` cuando reciban props estables.
  - Prohibido pasar objetos inline complejos como props entre secciones.
- Reglas de refactor:
  - Mantener nombres de campos y payload actuales.
  - Mantener validaciones de negocio existentes.
  - Mover helpers puros a `lib/admin/*` cuando aplique.
  - No introducir lógica duplicada.

## Plan de ejecución (fases)
- Fase 1: Baseline + mapa de responsabilidades
  - Inventariar bloques funcionales y dependencias internas del monolito.
  - Definir tipos canónicos, actions y reducer base.
  - Establecer benchmark de rendimiento actual (interacciones clave).
  - Resultado: contrato técnico versionado + write-scope por archivo.
- Fase 2: Extracción de estado y side-effects
  - Mover estado a `useReducer` central sin cambiar UI.
  - Adaptar side-effects (`upload/import`) a hooks con callbacks tipados hacia container.
  - Mantener mismo flujo E2E de form.
- Fase 3: División de UI en secciones
  - Extraer render por secciones funcionales con componentes pequeños.
  - Conservar layout y clases existentes para minimizar riesgo visual.
- Fase 4: Hardening + limpieza
  - Eliminar código muerto.
  - Consolidar selectores y evitar derivaciones duplicadas.
  - Asegurar nombres explícitos y manejo de errores consistente.
- Fase 5: Verificación final
  - Ejecutar suite completa de pruebas definidas abajo.
  - `npm run validate`.
  - QA manual en `/admin/assets/new` desktop + mobile.
  - Cierre solo si no hay regresión de benchmark.
- Fase 6: Cutover y eliminación legacy
  - Reemplazo definitivo del entrypoint actual por el nuevo container.
  - Eliminación de lógica/handlers/hooks legacy que ya no se usan.
  - Verificación de imports huérfanos y dead code.

## Verification Plan (obligatorio)
- Tests por contrato:
  - State selector unit tests (memoización y lecturas correctas).
  - Reducer unit tests (acciones válidas + transiciones esperadas).
  - Hook interaction integration tests (`upload/import -> dispatch -> UI state`).
  - Cross-section integration test (cambios en sección A impactan sección B).
  - Error granularity tests (fallo parcial de upload y recuperación).
- Guardas de rendimiento:
  - Benchmark base pre-refactor y post-refactor en interacciones:
    - typing en campos identity/location
    - upload de archivo
    - actualización de import tracker
  - Criterio: no degradación significativa frente a baseline.
- Gate de implementación:
  - No iniciar Fase 3 si Fase 2 no tiene tests verdes de estado/orquestación.
- Gate de eliminación legacy:
  - `rg` sin referencias a handlers legacy removidos.
  - Sin componentes duplicados para el mismo flujo (`legacy` vs `new`).
  - Confirmación explícita en PR: “legacy path removed”.

## Criterios de aceptación
- [x] `asset-creation-form.tsx` deja de ser monolito y no contiene lógica legacy de negocio.
- [x] Se crean componentes especializados por dominio funcional (mínimo 5 secciones).
- [x] Se centralizan side-effects en hooks dedicados.
- [x] No hay cambios de contrato en endpoints admin existentes.
- [x] Flujo de upload/import/submit conserva comportamiento.
- [x] `npm run validate` y suite de tests relevante en verde.
- [x] Sin regresión visual crítica en `320/375/768/1024`.
- [x] No hay fallback runtime al formulario legacy en producción.
- [x] Código legacy eliminado o reducido a wrapper sin lógica previa.

## Critique (pre-implementación)
### Critique (post-revision)

The proposal has been significantly improved and now represents a robust engineering plan that addresses the initial critical weaknesses. The defined contracts for state, communication, and typing are excellent. The following points are raised not as blockers, but as final refinements to further de-risk the execution.

#### 1 Minor Weakness & 2 Strategic Opportunities

1.  **Risk of Missed Implicit Logic**: The "Inventariar bloques funcionales" in Phase 1 is the highest remaining risk. A 2,000-line component inevitably contains subtle, undocumented business logic (e.g., `useEffect` chains). A manual inventory is prone to missing these. **Mitigation**: The inventory process should be a formal, peer-reviewed artifact. A pairing session between two engineers to walk through the original component's logic and map it to the new architecture is highly recommended before writing new code.

2.  **Opportunity for Safe Rollout (Feature Flag)**: This is a high-stakes refactor of a core workflow. While the phased plan is good, it lacks a "safety net" during deployment. A bug discovered post-merge could be disruptive. **Recommendation**: Introduce a feature flag (e.g., `?use_new_form=true`) to allow toggling between the legacy and refactored components in staging. This enables direct A/B comparison, simplifies QA, and provides an instantaneous rollback mechanism if a critical issue is found.

3.  **Opportunity to Address State Persistence**: The proposal doesn't address the existing UX issue where form state is lost on navigation. While out of the strict scope of a "refactor," this is the ideal moment to solve it. A user losing significant data entry is a critical usability flaw. **Recommendation**: Consider adding a simple persistence layer to `sessionStorage` within the `useAssetCreationFormState` hook. A `useEffect` that saves state on change and a one-time hydration on mount would be a low-cost, high-value addition. If not implemented, this should be formally documented as a known limitation and a follow-up story should be created.

#### Execution Risks
-   The primary execution risk remains the **Loss of Implicit Logic**, as detailed above. The comprehensive test plan mitigates this, but cannot eliminate it entirely.

#### Uncovered Edge Cases
-   The edge cases from the previous review (concurrency, granular errors) are now well-covered by the new state management contract and testing plan. The navigation issue is covered in "Strategic Opportunities."

#### Verdict
`Verdict: approve`

The plan is now solid, detailed, and executable. The defined contracts and phased testing approach provide high confidence. The recommendations above are strongly encouraged to ensure the smoothest possible execution and to maximize the value delivered by this refactor. The implementation can proceed.

## Resolution (propuesta de arranque)
- Estrategia aprobable:
  1. Fase 1-2 en primer PR técnico (sin cambios visuales).
  2. Fase 3-4 en PR de modularización UI.
  3. Fase 5 como cierre con QA y hardening.
- Cambios aplicados tras critique:
  - Se define explícitamente patrón de estado (`useReducer + Contexts separados`).
  - Se define mecanismo de comunicación entre hooks (callbacks -> dispatch).
  - Se adelanta tipado canónico a Fase 1.
  - Se integran pruebas obligatorias por contrato y benchmark de rendimiento.
  - Se define estrategia explícita de sunset legacy con eliminación al cierre de la story.
  - Por decisión de producto, no se adopta feature-flag dual runtime en producción; el rollback será por release revert y no por convivencia legacy/new.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `staff-review`
- Approval notes:
  Aprobado. El plan es sólido y ejecutable. La implementación debe respetar estrictamente los contratos definidos, incluyendo eliminación del legacy sin dual runtime en producción.

## Status
- Current status: `implemented`
- Next action:
  Story cerrada. Continuar con mantenimiento evolutivo en stories nuevas.

## Traceability
- Related issue(s): `EPIC-001`
- Related PR(s): `#54`
- Final commit hash(es): `e741486`, `f36704d`, `e558c8d`, `9c7c0e3`, `02e0f55`
- Phase artifacts:
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/STORY-001-04-phase1-inventory.md`
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/STORY-001-04-phase2-state-hook.md`
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-27.md`
