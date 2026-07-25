---
type: Feature Spec
title: Graphify Agent Enforcement & Task-Init Auto-Sync (BRI-181)
description: Enforcement del uso obligatorio del grafo de conocimiento (.agents/graph.json) en subagentes Planner y Architect, e integración de auto-sincronización en task-init.sh.
tags: [governance, agents, graphify, planner, architect, task-init, token-efficiency, bri-181]
timestamp: 2026-07-21T23:28:30Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-graphify-agent-enforcement/knowledge/features/feature-jeisonsosa-BRI-181-graphify-agent-enforcement.md
---

# Problem Artifact: Graphify Agent Enforcement & Task-Init Auto-Sync (BRI-181)

## What problem exists
1. Los agentes y subagentes (especialmente `planner` y `architect`) podían omitir la consulta obligatoria del grafo de conocimiento `.agents/graph.json`, recurriendo a lecturas extensas de archivos o búsquedas ciegas de código (`grep_search`), malgastando tokens de contexto.
2. El script de inicialización de tareas (`scripts/task-init.sh`) no verificaba ni ejecutaba automáticamente `pnpm graphify:sync` al abrir o configurar ramas, corriendo el riesgo de operar con un grafo desactualizado.

## Why it matters
Garantizar que la navegación por la base de código sea ultra-eficiente en tokens y guiada por el grafo de conocimiento Graphify, asegurando que `planner` y `architect` usen la topología de nodos para planificar tareas y validar fronteras de 4 capas antes de inspeccionar archivos.

## What outcome is expected
1. Directiva inquebrantable en `.agents/agents/planner.yaml` exigiendo consultar `.agents/graph.json` antes de explorar archivos.
2. Directiva en `.agents/agents/architect.yaml` añadiendo `.agents/graph.json` en `reads:` y forzando la validación del aislamiento de 4 capas a través de la topología del grafo.
3. Auto-sincronización de Graphify (`pnpm graphify:sync`) en `scripts/task-init.sh` durante el preflight/bootstrap de tareas.
4. Refuerzo de la política canónica en `AGENTS.md` y `.agents/policies/docs-policy.md`.

## What gaps exist today
- Faltaba el auto-sync en `task-init.sh` y la directiva estricta de validación en `architect.yaml`.

## What questions remain open
- Ninguna. El enfoque fue acordado.
