---
type: Feature Spec
title: task-init.sh reinforcement workflow (BRI-181)
description: Creación de un mecanismo físico e inquebrantable de control en check-task-lifecycle.sh, hooks.json y AGENTS.md para forzar el uso de task-init.sh, la creación de specs duales y la validación en Linear antes de modificar código.
tags: [governance, agents, harness, task-lifecycle, enforcement, validation, linear, bri-181]
timestamp: 2026-07-23T23:21:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-task-init-reinforcement.md
---

# Problem Artifact: task-init.sh reinforcement workflow (BRI-181)

## What problem exists
1. Los agentes o desarrolladores pueden saltarse involuntaria o voluntariamente la secuencia canónica de desarrollo (crear los artefactos duales, sincronizar Linear e iniciar la rama mediante `task-init.sh`) y empezar a realizar modificaciones de código directamente.
2. Esto provoca drifting cognitivo y desalineación con las políticas de gobernanza definidas en el repositorio.
3. No había un bloqueo de estado a nivel de código local ni validación del handle del desarrollador o existencia del ticket en Linear durante la creación de la rama.

## Why it matters
Garantizar la integridad de la gobernanza del repositorio Brids mediante la implementación de controles en 3 capas que validen la secuencia canónica físicamente. Si el entorno no se encuentra en una fase autorizada por un humano para desarrollo (`PHASE_4_HUMAN_DESIGN_APPROVED` o superior), cualquier modificación en las carpetas de código debe bloquear el ciclo de validación o commit.

## What outcome is expected
1. Falla inmediata del script de ciclo de vida (`check-task-lifecycle.sh`) si se detectan cambios locales o de rama en código pero la fase es menor a `PHASE_4_HUMAN_DESIGN_APPROVED`.
2. Validación robusta en `task-init.sh` contra la whitelist de handles permitidos y la existencia del ticket de Linear mediante la API/MCP de Linear.
3. Inicialización dinámica del tracker de fases en `git-start.sh`.
4. Documentación y directiva estricta del bloqueo de código en `AGENTS.md`.

## What gaps exist today
- `check-task-lifecycle.sh` no inspeccionaba archivos modificados para aplicar bloqueos físicos pre-código.
- `task-init.sh` no validaba la lista de handles ni verificaba que el issue key existiese realmente en Linear.
- La secuencia de bloqueo no estaba descrita formalmente en las reglas del sistema `AGENTS.md`.

## What questions remain open
- Ninguna.
