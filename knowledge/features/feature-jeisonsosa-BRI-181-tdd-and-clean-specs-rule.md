---
type: Feature Spec
title: Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último (BRI-181)
description: Formalización de la regla de que el primer slice de desarrollo debe ser TDD y el último debe ser de refactorización y limpieza de código.
tags: [governance, workflow, templates, documentation, tdd, refactor, bri-181]
timestamp: 2026-07-23T23:43:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule.md
---

# Problem Spec: Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último (BRI-181)

## What problem exists
No existía una directiva restrictiva en las plantillas y guías globales que forzara a los desarrolladores y agentes a iniciar sus tareas mediante un slice dedicado exclusivamente a TDD (pruebas en fallo) y a cerrarlas con un slice dedicado exclusivamente a la limpieza de código, optimizaciones y eliminación de deuda técnica.

## Why it matters
Asegurar que toda iniciativa de desarrollo comience con pruebas estructuradas y finalice con un código pulido y libre de residuos, siguiendo los principios de TDD y Clean Code por diseño y estructura.

## What outcome is expected
1. Modificación de `solution-spec-template.md` para prescribir esta regla de slices.
2. Actualización de `AGENTS.md` y `documentation-policy.md` para documentar la obligatoriedad de que la primera SPEC sea de TDD y la última sea de `refactor-clean`.

## What gaps exist today
- Las tareas no siempre se cerraban con una SPEC dedicada a la limpieza estructural y remoción de código muerto.

## What questions remain open
- Ninguna.
