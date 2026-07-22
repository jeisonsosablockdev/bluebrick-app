---
type: Implementation Spec
title: Harness System Enhancement & 4-Layer Standard Architecture Implementation (BRI-181)
description: Guía de implementación descompuesta en 4 SPECs atómicas para la actualización del harness, subagentes, task-init.sh y arquitectura estándar de 4 capas.
tags: [governance, agents, harness, implementation, bri-181]
timestamp: 2026-07-21T22:25:58Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation.md
---

# Solution Artifact: Harness System Enhancement & 4-Layer Standard Architecture Implementation (BRI-181)

## How the work will be resolved
El trabajo se descompone en 4 SPECs atómicas secuenciales creadas a partir de la rama parent `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`:

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

### **SPEC-4**: Formalización de la Arquitectura Estándar en 4 Capas (`SPEC/jeisonsosa-BRI-181-spec-4-four-layer-architect-refactor`) (En Curso)
- Actualizar `.agents/agents/architect.yaml` para formalizar explícitamente las 4 Capas Estándar (Presentation, Application/Consumption, Domain/Pipelines, Infrastructure).
- Sincronizar la especificación de 4 capas en `AGENTS.md` y `knowledge/governance/git-monorepo-policy.md`.
- Ejecutar suite `pnpm validate`.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 1**: `SPEC/jeisonsosa-BRI-181-spec-1-architect-and-atomic-agents` (Merged)
- **Delivery SPEC 2**: `SPEC/jeisonsosa-BRI-181-spec-2-hooks-and-task-init` (Merged)
- **Delivery SPEC 3**: `SPEC/jeisonsosa-BRI-181-spec-3-governance-sync-and-validation` (Merged)
- **Delivery SPEC 4**: `SPEC/jeisonsosa-BRI-181-spec-4-four-layer-architect-refactor` (Active)

## What tests go first
- Verificación sintáctica YAML de `.agents/agents/architect.yaml`.
- Verificación del árbol de 4 capas en `AGENTS.md`.
- Gates automatizados con `pnpm validate`.

## What tooling is required
- Runner: Google Antigravity SDK con modelos Gemini.
- Scripts de CI: `scripts/ci/check-monorepo-structure.sh`, `scripts/ci/preflight-start.sh`.

## What gates must pass
- `pnpm validate` pasa con 0 errores.
- Dual governing artifact actualizado en parent.
- Human Acceptance registrado al completar las SPECs.

## What will be synchronized to Linear
- Ticket `BRI-181` en Linear.
