---
type: Implementation Spec
title: Graphify Agent Enforcement & Task-Init Auto-Sync Implementation (BRI-181)
description: Guía de solución para el enforcement de Graphify en planner.yaml, architect.yaml, AGENTS.md y auto-sync en task-init.sh.
tags: [governance, agents, graphify, implementation, planner, architect, task-init, bri-181]
timestamp: 2026-07-21T23:28:35Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-graphify-agent-enforcement/knowledge/features/feature-jeisonsosa-BRI-181-graphify-agent-enforcement-implementation.md
---

# Solution Artifact: Graphify Agent Enforcement Implementation (BRI-181)

## How the work will be resolved
El trabajo se compone de los siguientes pasos atómicos:

1. **Auto-Sync en `scripts/task-init.sh`**:
   - Agregar ejecución automática de `node ./scripts/graphify-sync.js` (o `pnpm graphify:sync`) durante el bootstrap para garantizar que `.agents/graph.json` esté al día en cada nueva tarea.

2. **Enforcement en `.agents/agents/planner.yaml`**:
   - Reforzar el prompt del sistema especificando que `planner` DEBE consultar primero `.agents/graph.json` y el índice OKF antes de realizar búsquedas recursivas o leer archivos completos.

3. **Enforcement en `.agents/agents/architect.yaml`**:
   - Agregar `.agents/graph.json` en `reads:`.
   - Modificar el prompt del sistema para que `architect` use el grafo como fuente primaria de verificación de fronteras de 4 capas y aislamiento de módulos.

4. **Sincronización de Gobernanza**:
   - Actualizar `AGENTS.md` y `.agents/policies/docs-policy.md` indicando el rol mandatorio de Graphify para navegación e inspección arquitectónica.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-graphify-agent-enforcement`

## What tests go first
- Ejecución de `pnpm graphify:sync` y validación de `.agents/graph.json`.
- Validación de suite completa con `pnpm validate`.

## What tooling is required
- Runner: Google Antigravity SDK con modelos Gemini.
- Scripts de CI/Harness: `scripts/task-init.sh`, `scripts/graphify-sync.js`, `pnpm validate`.

## What gates must pass
- `pnpm validate` aprueba con 0 errores.
- Transición limpia en `.agents/active_task_state.json`.
- Human Acceptance registrado al completar la tarea.

## What will be synchronized to Linear
- Ticket `BRI-181` en Linear.
