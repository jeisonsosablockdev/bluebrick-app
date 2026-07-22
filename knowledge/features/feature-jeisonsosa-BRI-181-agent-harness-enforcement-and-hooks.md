---
type: Feature Spec
title: Harness System Enhancement, 4-Layer Architecture, Idempotent Lifecycle & Automatic PR Engine (BRI-181)
description: Creación de hooks.json, subagentes atómicos, 4 Capas Estándar, desacoplamiento Clean Code, Motor de Estado de 8 Fases y Automatización de PRs post Human Acceptance.
tags: [governance, agents, harness, layered-architecture, clean-code, double-gatekeeper, task-lifecycle, pr-automation, bri-181]
timestamp: 2026-07-21T23:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & Automatic PR Engine (BRI-181)

## What problem exists
1. El desarrollo de tareas carecía de un motor de estado determinista e idempotente.
2. Faltaba automatizar la fase final de Pull Request: al dar el visto bueno humano (**Human Acceptance**), la generación del body, deducción de etiquetas (`scope:*`, `type:*`, `risk:*`) y apertura/actualización en GitHub ocurría manualmente o se olvidaba.

## Why it matters
Garantizar que **tan pronto el usuario otorgue el visto bueno (Human Acceptance)**, el sistema ejecute automáticamente `pnpm pr:auto` para generar el `pr-body.md` sin borrador, aplicar etiquetas via API y publicar el PR en GitHub de forma 100% idempotente y transparente.

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Formalización de la **Arquitectura Estándar en 4 Capas** en `architect.yaml` y `AGENTS.md`.
3. Subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Orquestación declarativa en `.agents/hooks.json` e integración en `scripts/task-init.sh`.
5. Auditoría Clean Code y desacoplamiento dinámico en `task-init.sh`.
6. Protocolo de Doble Compuerta de Architect (`pre_code` y `post_code`).
7. Motor de Estado Idempotente del Ciclo de Vida de 8 Fases con Doble Compuerta Humana (`active_task_state.json` + `scripts/ci/check-task-lifecycle.sh`).
8. **Motor de Automatización de PRs post Human Acceptance** (`scripts/ci/generate-pr-body.sh` + `scripts/ci/pr-auto.sh` + `pnpm pr:auto`).

## What gaps exist today
- Faltaba la SPEC-8 para la automatización total de PRs inmediatamente posterior al visto bueno humano.

## What questions remain open
- Ninguna. La automatización del PR tras el visto bueno humano fue acordada.
