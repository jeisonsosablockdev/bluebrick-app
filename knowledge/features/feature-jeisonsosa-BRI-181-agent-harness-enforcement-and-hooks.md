---
type: Feature Spec
title: Harness System Enhancement, 4-Layer Architecture & Idempotent Task Lifecycle (BRI-181)
description: Creación de hooks.json, subagentes atómicos, 4 Capas Estándar, desacoplamiento Clean Code y Motor de Estado Idempotente de 8 Fases con Doble Compuerta Humana.
tags: [governance, agents, harness, layered-architecture, clean-code, double-gatekeeper, task-lifecycle, bri-181]
timestamp: 2026-07-21T22:49:05Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & Idempotent Lifecycle Engine (BRI-181)

## What problem exists
1. El desarrollo de tareas carecía de un motor de estado determinista e idempotente.
2. Faltaban verificaciones automatizadas que impidieran saltarse fases clave (como la escritura de tests antes del código de producción).
3. Faltaba formalizar las **Dos Compuertas Obligatorias de Validación Humana**:
   - **Compuerta Humana 1 (Human Design Approval)**: Aprobación explícita del humano del plan y diseño arquitectónico ANTES de escribir código.
   - **Compuerta Humana 2 (Human Merge Acceptance)**: Autorización explícita del humano del diff final ANTES de integrar en `develop`.

## Why it matters
Para garantizar que **todo trabajo siga siempre el mismo proceso riguroso e idempotente sin importar el desarrollador o agente**, se requiere un rastreador de estado (`.agents/active_task_state.json`) y un script validador (`scripts/ci/check-task-lifecycle.sh`) que bloquee físicamente cualquier desviación.

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Formalización de la **Arquitectura Estándar en 4 Capas** en `architect.yaml` y `AGENTS.md`.
3. Subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Orquestación declarativa en `.agents/hooks.json` e integración en `scripts/task-init.sh`.
5. Auditoría Clean Code y desacoplamiento dinámico en `task-init.sh`.
6. Protocolo de Doble Compuerta de Architect (`pre_code` y `post_code`).
7. **Motor de Estado Idempotente del Ciclo de Vida de 8 Fases con Doble Compuerta Humana** (`active_task_state.json` + `scripts/ci/check-task-lifecycle.sh` + `pnpm task:check`).

## What gaps exist today
- Faltaba la SPEC-7 para la implementación del Motor de Estado Idempotente de 8 Fases y la compuerta `HUMAN_DESIGN_APPROVED`.

## What questions remain open
- Ninguna. El ciclo de vida idempotente de 8 fases con doble compuerta humana fue acordado.
