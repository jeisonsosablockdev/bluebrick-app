# Problem Spec: Cleanup Monorepo Structure & Migration to pnpm

## Problem
El monorepo contiene directorios raíz no autorizados (como `.opencode/` con sus skills obsoletos) y archivos de prueba (`test/wallet-setup/`) fuera de las rutas canónicas (`/tests` y `/e2e`), violando la política [git-monorepo-policy.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/governance/git-monorepo-policy.md). Esto causa inconsistencias en los entornos de ejecución de los agentes y en la organización de las pruebas. Además, para mejorar el rendimiento de la instalación y estandarizar las herramientas, se requiere migrar el gestor de paquetes de `npm` a `pnpm`.

## Scope
1. **Limpieza estructural:** Eliminar definitivamente la carpeta `.opencode/` en la raíz.
2. **Reubicación de tests:** Mover la preparación de la wallet de Synpress a [e2e/wallet-setup/](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/e2e/wallet-setup/).
3. **Automatización:** Proveer un script de validación [check-monorepo-structure.sh](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/scripts/ci/check-monorepo-structure.sh) en CI/CD.
4. **Migración a pnpm:** Estandarizar scripts y flujos de CI/CD para usar `pnpm` y generar su respectivo `pnpm-lock.yaml`.
