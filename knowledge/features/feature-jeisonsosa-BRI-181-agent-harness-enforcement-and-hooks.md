---
type: Feature Spec
title: Harness System Enhancement & Subagent Enforcement (BRI-181)
description: Creación de hooks.json, integración con task-init.sh, reemplazo de structure.yaml por architect.yaml y adición de subagentes atómicos api, db y state.
tags: [governance, agents, harness, bri-181]
timestamp: 2026-07-21T22:06:55Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & Subagent Enforcement (BRI-181)

## What problem exists
El sistema de harness de agentes carece de un mecanismo declarativo (`hooks.json`) que obligue y restrinja el uso de subagentes especializados durante las fases del ciclo de vida del desarrollo (bootstrap con `task-init.sh`, preflight, pre-commit, validación). Adicionalmente, existían configuraciones obsoletas (`.cursor/`, `replit.nix`, `.agents/agents/structure.yaml`), falta de granularidad atómica para dominios de API, Base de Datos y Estado Cliente, y la necesidad de formalizar las reglas del guardián de arquitectura Web3 de 3 capas (`architect.yaml`).

## Why it matters
Para prevenir el *drifting* cognitivo de los modelos de IA, asegurar la separación estricta de capas monorepo (Presentation, Consumption, Pipelines) e impedir la contaminación de código o el uso de patrones prohibidos (`@solana/web3.js` v1, `new Connection()`, sintaxis imperativa), es indispensable contar con un harness automatizado de gobernanza que fuerce la sub-orquestación de agentes especialistas desde `task-init.sh`.

## What outcome is expected
1. Eliminación de carpetas y archivos obsoletos (`.cursor/`, `replit.nix`).
2. Reemplazo del subagente `structure.yaml` por `architect.yaml` (`web3-layered-architect-guardian`), haciendo valer la arquitectura de 3 capas funcionales y la suite moderna `@solana/kit` / `@solana/react-hooks`.
3. Creación de subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Creación de `.agents/hooks.json` para definir eventos del ciclo de vida y bindings de subagentes requeridos.
5. Actualización de `scripts/task-init.sh` para validar y ejecutar el enforcement de subagentes desde `.agents/hooks.json`.
6. Sincronización de políticas globales en `AGENTS.md`.

## What gaps exist today
- `task-init.sh` no validaba la delegación de subagentes contra un archivo `.agents/hooks.json`.
- Faltaban subagentes especializados para los dominios de APIs, DB y Estado Cliente.
- `structure.yaml` no reflejaba el guardián arquitectónico en 3 capas declarativo de `@solana/kit`.

## What questions remain open
- Ninguna. Las decisiones de diseño de la entrevista Socrática fueron validadas e incorporadas.
