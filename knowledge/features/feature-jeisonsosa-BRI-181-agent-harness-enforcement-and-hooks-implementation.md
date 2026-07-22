---
type: Implementation Spec
title: Harness System Enhancement & Subagent Enforcement Implementation (BRI-181)
description: Guía de implementación descompuesta en SPECs atómicas para la actualización del harness, subagentes y task-init.sh.
tags: [governance, agents, harness, implementation, bri-181]
timestamp: 2026-07-21T22:08:30Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks-implementation.md
---

# Solution Artifact: Harness System Enhancement & Subagent Enforcement Implementation (BRI-181)

## How the work will be resolved
El trabajo se descompone en 3 SPECs atómicas secuenciales creadas a partir de la rama parent `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`:

### **SPEC-1**: Limpieza de Archivos Obsoletos y Subagentes Atómicos (`SPEC/jeisonsosa-BRI-181-spec-1-architect-and-atomic-agents`)
- Eliminar `.cursor/` y `replit.nix`.
- Reemplazar `.agents/agents/structure.yaml` por `.agents/agents/architect.yaml`.
- Crear subagentes atómicos: `.agents/agents/api.yaml`, `.agents/agents/db.yaml`, y `.agents/agents/state.yaml`.

### **SPEC-2**: Declaración de Hooks e Integración con task-init.sh (`SPEC/jeisonsosa-BRI-181-spec-2-hooks-and-task-init`)
- Crear `.agents/hooks.json` definiendo bindings de ciclo de vida (`pre_branch`, `post_init`, `pre_commit`, `preflight`) y por dominio.
- Modificar `scripts/task-init.sh` para incorporar la lectura y enforcement automático de `.agents/hooks.json`.

### **SPEC-3**: Sincronización de Gobernanza y Validación (`SPEC/jeisonsosa-BRI-181-spec-3-governance-sync-and-validation`)
- Sincronizar la lista de subagentes en `AGENTS.md`.
- Ejecutar suite de pruebas completa `pnpm validate` y verificar cero errores.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 1**: `SPEC/jeisonsosa-BRI-181-spec-1-architect-and-atomic-agents`
- **Delivery SPEC 2**: `SPEC/jeisonsosa-BRI-181-spec-2-hooks-and-task-init`
- **Delivery SPEC 3**: `SPEC/jeisonsosa-BRI-181-spec-3-governance-sync-and-validation`

## What tests go first
- Verificación sintáctica YAML de `.agents/agents/*.yaml`.
- Validación JSON de `.agents/hooks.json`.
- Integración de `task-init.sh`.
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
