---
type: Implementation Spec
title: Harness System Enhancement & 4-Layer Architecture Implementation (BRI-181)
description: Guía de implementación descompuesta en 9 SPECs atómicas para la actualización del harness, subagentes, task-init.sh, 4 capas, desacoplamiento, doble compuerta, motor idempotente, automatización de PRs y guard anti-duplicidad.
tags: [governance, agents, harness, implementation, clean-code, double-gatekeeper, task-lifecycle, pr-automation, idempotency-guard, bri-181]
timestamp: 2026-07-21T23:07:05Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation.md
---

# Solution Artifact: Harness System Enhancement & 4-Layer Architecture Implementation (BRI-181)

## How the work will be resolved
El trabajo se descompone en 9 SPECs atómicas secuenciales creadas a partir de la rama parent `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`:

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
- Actualizar `.agents/agents/architect.yaml` para formalizar las 4 Capas Estándar.

### **SPEC-5**: Auditoría de Desacoplamiento Clean Code (Completada)
- Aplicar `code-refactoring-refactor-clean` para auditar y desacoplar `scripts/task-init.sh`.

### **SPEC-6**: Protocolo de Doble Compuerta para Architect (Completada)
- Formalizar en `.agents/hooks.json` y `AGENTS.md` el ciclo de Doble Compuerta de Architect.

### **SPEC-7**: Motor de Estado Idempotente de 8 Fases con Doble Compuerta Humana (Completada)
- Implementar `.agents/active_task_state.json`, `scripts/ci/check-task-lifecycle.sh` y `pnpm task:check`.

### **SPEC-8**: Motor de Automatización de PRs post Human Acceptance (Completada)
- Crear `scripts/ci/generate-pr-body.sh`, `scripts/ci/pr-auto.sh` y `pnpm pr:auto`.

### **SPEC-9**: Single-Trigger PR Guard & Directivas en Subagentes (`SPEC/jeisonsosa-BRI-181-spec-9-agent-pr-directive-and-idempotency-guard`) (En Curso)
- Implementar un **Guard de Idempotencia de Disparo Único** en `scripts/ci/pr-auto.sh` comprobando `active_task_state.json` para evitar ejecuciones duplicadas de API o re-envíos de PR.
- Agregar las directivas explícitas de ejecución post-aceptación humana en `.agents/agents/reviewer.yaml` y `AGENTS.md`.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 1**: `SPEC/jeisonsosa-BRI-181-spec-1-architect-and-atomic-agents` (Merged)
- **Delivery SPEC 2**: `SPEC/jeisonsosa-BRI-181-spec-2-hooks-and-task-init` (Merged)
- **Delivery SPEC 3**: `SPEC/jeisonsosa-BRI-181-spec-3-governance-sync-and-validation` (Merged)
- **Delivery SPEC 4**: `SPEC/jeisonsosa-BRI-181-spec-4-four-layer-architect-refactor` (Merged)
- **Delivery SPEC 5**: `SPEC/jeisonsosa-BRI-181-spec-5-clean-code-audit-refactor` (Merged)
- **Delivery SPEC 6**: `SPEC/jeisonsosa-BRI-181-spec-6-double-gatekeeper-architect-workflow` (Merged)
- **Delivery SPEC 7**: `SPEC/jeisonsosa-BRI-181-spec-7-idempotent-task-lifecycle-enforcement` (Merged)
- **Delivery SPEC 8**: `SPEC/jeisonsosa-BRI-181-spec-8-pr-auto-engine-after-human-acceptance` (Merged)
- **Delivery SPEC 9**: `SPEC/jeisonsosa-BRI-181-spec-9-agent-pr-directive-and-idempotency-guard` (Active)

## What tests go first
- Verificación del guard anti-duplicidad en `scripts/ci/pr-auto.sh`.
- Verificación de directivas en `.agents/agents/reviewer.yaml` y `AGENTS.md`.
- Gates automatizados con `pnpm validate`.

## What tooling is required
- Runner: Google Antigravity SDK con modelos Gemini.
- Scripts de CI: `scripts/ci/pr-auto.sh`, `scripts/ci/generate-pr-body.sh`, `scripts/ci/check-task-lifecycle.sh`.

## What gates must pass
- `pnpm validate` pasa con 0 errores.
- Dual governing artifact actualizado en parent.
- Human Acceptance registrado al completar las SPECs.

## What will be synchronized to Linear
- Ticket `BRI-181` en Linear.
