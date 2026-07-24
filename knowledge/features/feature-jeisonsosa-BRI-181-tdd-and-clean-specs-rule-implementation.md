---
type: Implementation Spec
title: Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último Implementation (BRI-181)
description: Guía de implementación para formalizar los slices de TDD y refactor-clean en plantillas y políticas.
tags: [governance, workflow, templates, documentation, tdd, refactor, implementation, bri-181]
timestamp: 2026-07-23T23:43:05Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-tdd-and-clean-specs-rule-implementation.md
---

# Solution Spec: Regla Obligatoria de Slices: TDD Primero y Refactor Clean Último Implementation (BRI-181)

## How the work will be resolved
1. **Modificar `solution-spec-template.md`**: Actualizar la sección de slices agregando el bloque de regla y el esquema visual predeterminado.
2. **Modificar `AGENTS.md`**: Agregar la directiva de TDD y Refactor Clean en la sección de preflight y orden de ejecución.
3. **Modificar `documentation-policy.md`**: Formalizar la regla en el apartado de SPECs.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 13**: `SPEC/jeisonsosa-BRI-181-tdd-and-clean-specs-rule` (Active)

## What tests go first
- Correr `pnpm validate` para asegurar que las políticas no tengan advertencias.

## What tooling is required
- Node, git, bash.

## What gates must pass
- `pnpm validate` pasa sin errores.
- Aprobación humana para mergear a la rama padre.
