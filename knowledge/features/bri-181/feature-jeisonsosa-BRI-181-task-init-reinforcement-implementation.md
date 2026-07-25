---
type: Implementation Spec
title: task-init.sh reinforcement workflow Implementation (BRI-181)
description: Guía de implementación para las 3 capas de refuerzo y validación del ciclo de vida de desarrollo de tareas.
tags: [governance, agents, harness, task-lifecycle, enforcement, validation, linear, implementation, bri-181]
timestamp: 2026-07-23T23:21:05Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-task-init-reinforcement-implementation.md
---

# Solution Artifact: task-init.sh reinforcement workflow Implementation (BRI-181)

## How the work will be resolved
El trabajo se implementará de forma atómica en las siguientes 3 capas de refuerzo y control físico de gobernanza:

### **Capa 1**: Guardia de Estado en `check-task-lifecycle.sh`
- Modificar `check-task-lifecycle.sh` para verificar si existen modificaciones (staged, unstaged o commits locales en la rama actual comparada con su base) en las carpetas de código (`app/`, `components/`, `lib/`, `scripts/`, `programs/`, `db/`).
- Si se detectan cambios de código pero `.agents/active_task_state.json` no existe, o si su fase (`current_phase`) es menor a `PHASE_4_HUMAN_DESIGN_APPROVED` (es decir, `PHASE_1_BOOTSTRAP`, `PHASE_2_DOCS_FILLED` o `PHASE_3_ARCHITECT_GATE1`), fallar inmediatamente con código de salida `1` e imprimir un mensaje de bloqueo descriptivo.

### **Capa 2**: Robustecimiento de `task-init.sh` y `git-start.sh`
- Modificar `task-init.sh` para leer la lista permitida de handles de desarrolladores (`allowed_developer_handles`) de `.agents/hooks.json` y validar al usuario.
- Validar el ticket de Linear llamando a la API de Linear con `LINEAR_API_KEY` (si está presente en las variables de entorno). Si el ticket no es válido o no existe, fallar de manera controlada.
- Modificar `git-start.sh` para inicializar automáticamente el archivo de estado de tareas `.agents/active_task_state.json` en la fase inicial `PHASE_1_BOOTSTRAP` al crear ramas de tipo `parent` o `spec`.

### **Capa 3**: Regla de Bloqueo en `AGENTS.md`
- Actualizar `AGENTS.md` bajo la sección `## 🚫 MANDATORY BOOTSTRAP SEQUENCE / PREFLIGHT` inyectando la regla de bloqueo de código de forma explícita para guiar al modelo y evitar modificaciones antes de completar el diseño y obtener la aprobación humana.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 10**: `SPEC/jeisonsosa-BRI-181-task-init-reinforcement` (Active)

## What tests go first
- Ejecutar validaciones locales modificando un archivo de código temporal en fase inicial y verificando que `pnpm task:check` falle.
- Verificar el comportamiento correcto de `task-init.sh` ante handles inválidos y válidos.
- Correr `pnpm validate` al finalizar la SPEC.

## What tooling is required
- Runner: Google Antigravity SDK con modelos Gemini.
- API de Linear para validaciones en línea.

## What gates must pass
- `pnpm validate` pasa sin errores.
- Los artefactos duales se sincronizan y no contienen placeholders.
- Aprobación humana para mergear a la rama padre.
