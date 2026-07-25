---
type: Feature Spec
title: Harness System Enhancement, 4-Layer Architecture, Idempotent Lifecycle & Single-Trigger PR Guard (BRI-181)
description: Creación de hooks.json, subagentes atómicos, 4 Capas Estándar, desacoplamiento Clean Code, Motor de Estado de 8 Fases, automatización de PRs y Guard de Idempotencia anti-duplicidad.
tags: [governance, agents, harness, layered-architecture, clean-code, double-gatekeeper, task-lifecycle, pr-automation, idempotency-guard, bri-181]
timestamp: 2026-07-21T23:07:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks.md
---

# Problem Artifact: Harness System Enhancement & Single-Trigger PR Guard (BRI-181)

## What problem exists
1. El desarrollo de tareas carecía de un motor de estado determinista e idempotente.
2. La automatización del PR podía ser disparada múltiples veces por error si el agente perdía el contexto o al recibir re-confirmaciones de mensajes, corriendo el riesgo de provocar *drifting* cognitivo o ejecuciones duplicadas de API.

## Why it matters
Garantizar que **la ejecución de `pnpm pr:auto` tenga un Guard de Idempotencia de Disparo Único (Single-Trigger Guard)** en `.agents/active_task_state.json` y que las directivas de los subagentes (`reviewer.yaml`, `planner.yaml`, `AGENTS.md`) instruyan explícitamente ejecutar la automatización de PR una sola vez post Human Acceptance, sin duplicaciones ni desviaciones.

## What outcome is expected
1. Eliminación de artefactos obsoletos (`.cursor/`, `replit.nix`).
2. Formalización de la **Arquitectura Estándar en 4 Capas** en `architect.yaml` y `AGENTS.md`.
3. Subagentes atómicos: `api.yaml`, `db.yaml` y `state.yaml` en `.agents/agents/`.
4. Orquestación declarativa en `.agents/hooks.json` e integración en `scripts/task-init.sh`.
5. Auditoría Clean Code y desacoplamiento dinámico en `task-init.sh`.
6. Protocolo de Doble Compuerta de Architect (`pre_code` y `post_code`).
7. Motor de Estado Idempotente del Ciclo de Vida de 8 Fases con Doble Compuerta Humana.
8. Motor de Automatización de PRs post Human Acceptance.
9. **Single-Trigger Guard anti-duplicidad y Directiva Inquebrantable de PR en Subagentes** (`pr-auto.sh` idempotencia + `.agents/agents/reviewer.yaml` + `AGENTS.md`).

## What gaps exist today
- Faltaba la SPEC-9 para la protección anti-duplicidad y directiva formal de subagentes.

## What questions remain open
- Ninguna. La protección anti-duplicidad y directiva de agentes fue acordada.
