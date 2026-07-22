---
type: Implementation Spec
title: Harness System Enhancement & 4-Layer Architecture Implementation (BRI-181)
description: Guía de implementación descompuesta en 7 SPECs atómicas para la actualización del harness, subagentes, task-init.sh, arquitectura estándar de 4 capas, desacoplamiento, doble compuerta y motor de estado idempotente.
tags: [governance, agents, harness, implementation, clean-code, double-gatekeeper, task-lifecycle, bri-181]
timestamp: 2026-07-21T22:49:10Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation.md
---

# Solution Artifact: Harness System Enhancement & 4-Layer Architecture Implementation (BRI-181)

## How the work will be resolved
El trabajo se descompone en 7 SPECs atómicas secuenciales creadas a partir de la rama parent `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`:

### **SPEC-1**: Limpieza de Archivos Obsoletos y Subagentes Atómicos (Completada)
- Eliminar `.cursor/` y `replit.nix`.
- Reemplazar `.agents/agents/structure.yaml` por `.agents/agents/architect.yaml`.
- Crear subagentes atómicos: `.agents/agents/api.yaml`, `.agents/agents/db.yaml`, y `.agents/agents/state.yaml`.

### **SPEC-2**: Declaración de Hooks e Integración con task-init.sh (Completada)
- Crear `.agents/hooks.json` definiendo bindings de ciclo de vida (`pre_branch`, `post_init`, `pre_commit`, `preflight`) y por dominio.
- Modificar `scripts/task-init.sh` para incorporar la lectura y enforcement automático de `.agents/hooks.json`.

### **SPEC-3**: Sincronización de Gobernanza y Validación (Completada)
- Sincronizar la lista de subagentes en `AGENTS.md`.
- Ejecutar suite de pruebas completa `pnpm validate`.

### **SPEC-4**: Formalización de la Arquitectura Estándar en 4 Capas (Completada)
- Actualizar `.agents/agents/architect.yaml` para formalizar las 4 Capas Estándar (Presentation, Application/Consumption, Domain/Pipelines, Infrastructure).
- Sincronizar la especificación de 4 capas en `AGENTS.md`.

### **SPEC-5**: Auditoría de Desacoplamiento Clean Code (Completada)
- Aplicar la habilidad `code-refactoring-refactor-clean` para auditar `scripts/task-init.sh`.
- Desacoplar `task-init.sh` mediante consulta dinámica en `.agents/hooks.json` usando `node` inline.

### **SPEC-6**: Protocolo de Doble Compuerta para Architect (Completada)
- Formalizar en `.agents/hooks.json` y `AGENTS.md` el ciclo de Doble Compuerta de Architect (Compuerta 1 Pre-Code Review y Compuerta 2 Post-Code Diff Audit).

### **SPEC-7**: Motor de Estado Idempotente de 8 Fases con Doble Compuerta Humana (`SPEC/jeisonsosa-BRI-181-spec-7-idempotent-task-lifecycle-enforcement`) (En Curso)
- Implementar el estado persistido `.agents/active_task_state.json`.
- Crear el script `scripts/ci/check-task-lifecycle.sh` para validar la secuencia idempotente de 8 fases:
  1. `BOOTSTRAPPED` (task-init.sh)
  2. `DOCS_FILLED` (Artefactos duales sin placeholders)
  3. `ARCHITECT_PRE_APPROVED` (Architect Compuerta 1)
  4. `HUMAN_DESIGN_APPROVED` (🛑 Aprobación Humana del Diseño ANTES de programar)
  5. `TESTS_WRITTEN` (Fase RED - Unit tests primero)
  6. `CODE_IMPLEMENTED` (Fase GREEN - Código de producción)
  7. `ARCHITECT_POST_APPROVED` (Architect Compuerta 2 + pnpm validate)
  8. `HUMAN_MERGE_APPROVED` (🛑 Aprobación Humana del Merge ANTES de integrar a develop)
- Añadir el comando `"task:check": "bash ./scripts/ci/check-task-lifecycle.sh"` a `package.json` e integrarlo en `pnpm validate`.
- Sincronizar `AGENTS.md`.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 1**: `SPEC/jeisonsosa-BRI-181-spec-1-architect-and-atomic-agents` (Merged)
- **Delivery SPEC 2**: `SPEC/jeisonsosa-BRI-181-spec-2-hooks-and-task-init` (Merged)
- **Delivery SPEC 3**: `SPEC/jeisonsosa-BRI-181-spec-3-governance-sync-and-validation` (Merged)
- **Delivery SPEC 4**: `SPEC/jeisonsosa-BRI-181-spec-4-four-layer-architect-refactor` (Merged)
- **Delivery SPEC 5**: `SPEC/jeisonsosa-BRI-181-spec-5-clean-code-audit-refactor` (Merged)
- **Delivery SPEC 6**: `SPEC/jeisonsosa-BRI-181-spec-6-double-gatekeeper-architect-workflow` (Merged)
- **Delivery SPEC 7**: `SPEC/jeisonsosa-BRI-181-spec-7-idempotent-task-lifecycle-enforcement` (Active)

## What tests go first
- Verificación del script `scripts/ci/check-task-lifecycle.sh`.
- Verificación del archivo de estado `.agents/active_task_state.json`.
- Gates automatizados con `pnpm validate`.

## What tooling is required
- Runner: Google Antigravity SDK con modelos Gemini.
- Scripts de CI: `scripts/ci/check-task-lifecycle.sh`, `scripts/ci/check-monorepo-structure.sh`, `scripts/ci/preflight-start.sh`.

## What gates must pass
- `pnpm validate` pasa con 0 errores.
- Dual governing artifact actualizado en parent.
- Human Acceptance registrado al completar las SPECs.

## What will be synchronized to Linear
- Ticket `BRI-181` en Linear.
