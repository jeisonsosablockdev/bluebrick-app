## Resumen
Este PR implementa flujos de trabajo (workflows) y políticas de gobernanza optimizados para Gemini y el SDK de Antigravity en la carpeta `.agents/`, además de integrar la generación automática de plantillas OKF (Open Knowledge Format) en el script `git-start.sh`.

**Cambios principales**
- **Migración a `.agents/`:** Se crearon las 5 políticas canónicas y los 7 flujos operativos (cycles) adaptados para Gemini y Antigravity en lugar del directorio legacy de Codex.
- **Generación automática OKF:** Se integró scaffolding automático en `scripts/git-start.sh` para que cree las plantillas de documentación OKF (`feature-*.md` o `fix-*.md`) al iniciar una rama de trabajo.
- **Sincronización Mandatoria:** Se estableció en `docs-policy.md` y `reasoning-cycle.md` que el archivo OKF del repositorio es la fuente de verdad única y se debe mantener espejado a `implementation_plan.md`.

---

## Issue
- **Linear:** `N/A` (Iniciativa libre de refactor/optimización de agentes)

## RFC
- **RFC:** `N/A`

## Riesgos
- **Riesgo:** Bajo. Los cambios están limitados a configuración de agentes, políticas Markdown y scripts de inicialización de ramas (`git-start.sh`). No afecta en absoluto al código de producción del producto (`/app` o `/programs`).

## Rollback Plan
- **Reversión rápida:** `git revert` del commit de merge en develop, o eliminación del directorio `.agents/` y restauración de `scripts/git-start.sh`.

## Prueba Devnet
- **Devnet Proof:** `N/A` (No realiza interacciones on-chain).

## Feature Flag Strategy
- **Feature Flag:** No se requiere feature-flag ya que los cambios se aplican únicamente a flujos de trabajo de agentes y scripts de desarrollo local, sin impacto en el código de producción del cliente.

## Human Acceptance
Status: approved
> ✅ Aprobado y verificado mediante pruebas de creación de ramas y validación local de políticas de gobernanza.
> **Aprobado por:** Jay / Jaymusicmachine

## Feature Note (/docs/features)
- **Path:** [feature-gemini-antigravity-workflows-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-gemini-antigravity-workflows-implementation.md)

## Validación
- Se ejecutaron las validaciones de gobernanza de documentación locales y pasaron exitosamente:
  `npm run validate:docs-governance`

## Etiquetas requeridas (Required Labels)
- [x] `scope:shared`
- [x] `type:feature`
- [x] `risk:low`