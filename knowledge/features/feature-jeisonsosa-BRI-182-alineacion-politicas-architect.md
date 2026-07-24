# Problem Artifact: Alineación 100% con Políticas de Architect (BRI-182)

## What problem exists
Actualmente, la estructura del repositorio presenta desalineaciones con las políticas canónicas de gobernanza y arquitectura definidas por `architect` ([architect.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/architect.yaml), [git-monorepo-policy.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/governance/git-monorepo-policy.md) y [AGENTS.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/AGENTS.md)):
1. **Desorden en la raíz del repositorio**: Existen archivos sueltos/temporales (`PR_BODY.md`, `pr-body.md`, `linear_metadata.json`) que violan el principio de raíz limpia.
2. **Deuda Estructural en `/lib`**: El directorio `/lib` contiene 74 archivos TypeScript sueltos acumulados sin categorización en las 4 capas funcionales canónicas (`/lib/hooks`, `/lib/state`, `/lib/pipelines`, `/lib/infrastructure`).
3. **Necesidad de Cobertura TDD Baseline**: Es imperativo contar con una suite TDD previa para congelar comportamientos y evitar cualquier regresión funcional durante la reestructuración.
4. **Calidad de Código y Limpieza Final**: Se requiere un pase explícito de auditoría de Clean Code (`code-refactoring-refactor-clean`) para pulir naming, modularidad y legibilidad final.

## Why it matters
Garantizar la alineación total con la arquitectura de 4 capas y las reglas de `architect` previene la deriva cognitiva, asegura límites claros entre UI y Web3 Domain, congela funcionalidades existentes mediante TDD y mantiene el repositorio limpio, mantenible y auditable automáticamente en CI.

## What outcome is expected
1. Suite de pruebas TDD baseline en **GREEN** garantizando la conservación de funcionalidades antes y después del refactor.
2. Raíz del monorepo 100% limpia sin archivos sueltos ni temporales no autorizados.
3. Estructura de `/lib` organizada bajo el patrón de 4 capas:
   - Layer 1: `/app` y `/components` (Presentation)
   - Layer 2: `/lib/hooks/` y `/lib/state/` (Application / Consumption)
   - Layer 3: `/lib/pipelines/` (Domain Pure Functional)
   - Layer 4: `/lib/infrastructure/` (DB, RPC Transports, External SDKs)
4. Auditoría de Clean Code completada con cero deuda técnica o complejidad redundante.
5. Validación automatizada en CI a través de `check-monorepo-structure.sh` y `check-layered-architecture.sh` pasando `pnpm validate` sin errores.

## What gaps exist today
- Falta de suite TDD específica de regresión para cambios estructurales masivos en `/lib`.
- Falta de directorios estructurales `/lib/hooks`, `/lib/state`, `/lib/pipelines`, `/lib/infrastructure`.
- Inexistencia de script de CI que valide la prohibición de archivos planos sueltos en `/lib`.

## What questions remain open
- Ninguna pregunta abierta. El plan se ejecutará en 5 SPECs individuales.
