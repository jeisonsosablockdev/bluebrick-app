---
type: Feature Spec
title: Plantillas Canónicas para OKF y Linear (BRI-181)
description: Creación de plantillas Markdown físicas en el repositorio para los artefactos de problema, solución y briefs de Linear, y desacoplamiento de las plantillas en git-start.sh.
tags: [governance, documentation, templates, okf, linear, bri-181]
timestamp: 2026-07-23T23:35:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-canonical-templates.md
---

# Problem Spec: Plantillas Canónicas para OKF y Linear (BRI-181)

## What problem exists
1. Las plantillas para los artefactos duales de OKF (Problem y Solution Spec) están quemadas en código duro (hardcoded strings) dentro del script de bash `scripts/git-start.sh`.
2. No existen archivos de plantilla físicos (templates) en el repositorio que sirvan como referencia de formato limpio para desarrolladores o que puedan ser extendidos fácilmente sin modificar lógica bash.
3. La plantilla estructural del "Human Brief" requerida para los issues de Linear sólo está descrita textualmente en `documentation-policy.md` y no tiene un archivo de plantilla modelo.

## Why it matters
Garantizar la consistencia, facilidad de uso y mantenibilidad del sistema de documentación Spec-Driven de Brids. Desacoplar las plantillas del script bash permite editarlas de forma nativa en Markdown y garantiza que los agentes e ingenieros utilicen exactamente la misma base estructural.

## What outcome is expected
1. Existencia física de `knowledge/templates/problem-spec-template.md`, `knowledge/templates/solution-spec-template.md` y `knowledge/templates/linear-brief-template.md`.
2. Actualización de `scripts/git-start.sh` para que lea y clone el contenido de estas plantillas Markdown, inyectando dinámicamente variables como `${NAME}`, en lugar de usar strings quemados.
3. Documentación de las plantillas en `documentation-policy.md`.

## What gaps exist today
- Las plantillas Markdown se definen mediante bloques `cat <<EOF` extensos dentro del bash.
- No hay un directorio centralizado de `knowledge/templates/`.

## What questions remain open
- Ninguna.
