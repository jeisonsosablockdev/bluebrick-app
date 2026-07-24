---
type: Implementation Spec
title: Plantillas Canónicas para OKF y Linear Implementation (BRI-181)
description: Guía de implementación para desacoplar plantillas del código bash y crear los archivos Markdown en templates.
tags: [governance, documentation, templates, okf, linear, implementation, bri-181]
timestamp: 2026-07-23T23:35:05Z
resource: https://github.com/jeisonsosablockdev/brids/blob/refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks/knowledge/features/feature-jeisonsosa-BRI-181-canonical-templates-implementation.md
---

# Solution Spec: Plantillas Canónicas para OKF y Linear Implementation (BRI-181)

## How the work will be resolved
El trabajo se implementará de la siguiente manera:

1. **Crear Archivos de Plantilla**:
   - Crear `knowledge/templates/problem-spec-template.md` con los campos oficiales.
   - Crear `knowledge/templates/solution-spec-template.md` con los campos oficiales.
   - Crear `knowledge/templates/linear-brief-template.md` con la estructura bilingüe y de ownership oficial.

2. **Modificar `scripts/git-start.sh`**:
   - Reemplazar las declaraciones inline de `cat <<EOF` por lecturas de los archivos en `knowledge/templates/`.
   - Utilizar sustitución de variables de shell o un reemplazo sencillo de texto en bash/sed para inyectar `${NAME}` y variables relacionadas.
   - Asegurar que si los archivos de plantilla no están en el disco por alguna razón (por ejemplo, fuera del workspace), haya un fallback elegante.

3. **Modificar `documentation-policy.md`**:
   - Agregar enlaces y referencias explícitas a la nueva carpeta de `knowledge/templates/`.

## What slices and branches will be used
- **Parent Work Branch**: `refactor/jeisonsosa-BRI-181-agent-harness-enforcement-and-hooks`
- **Delivery SPEC 11**: `SPEC/jeisonsosa-BRI-181-canonical-templates` (Active)

## What tests go first
- Ejecutar `git-start.sh` localmente para crear una rama SPEC temporal y verificar que se clonen los contenidos de las plantillas Markdown de forma correcta con el nombre de la tarea inyectado.
- Correr `pnpm validate` para asegurar que las nuevas rutas no rompan ninguna regla del linter de gobernanza de documentación.

## What tooling is required
- Bash, git, Node.js para validaciones automáticas.

## What gates must pass
- `pnpm validate` pasa sin errores.
- Los nuevos archivos de plantilla están exentos de placeholders.
- Aprobación humana para mergear a la rama padre.
