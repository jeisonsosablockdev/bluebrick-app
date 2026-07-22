## Issue
Closes [BRI-181](https://linear.app/brids-app/issue/BRI-181/solucion-problemas-de-drifting-y-orquestacion-en-agentes)

## RFC
N/A - Refactorización de Harness de Agentes, Subagentes Atómicos y Gobernanza Monorepo.

## Summary
- Eliminación de directorios y archivos obsoletos (`.cursor/`, `replit.nix`).
- Reemplazo del subagente `structure.yaml` por `architect.yaml` (`web3-layered-architect-guardian`), el cual hace cumplir la Arquitectura Funcional Web3 en 3 Capas (Presentation, Consumption, Pipelines) y la suite moderna `@solana/kit` / `@solana/react-hooks` (con prohibición estricta de `@solana/web3.js` v1 y clases).
- Creación de subagentes atómicos especializados en `.agents/agents/`: `api.yaml` (REST/GraphQL/Zod/Webhooks/SDKs), `db.yaml` (Base de Datos/Migraciones) y `state.yaml` (Estado cliente Zustand/React Query).
- Creación de `.agents/hooks.json` para orquestación declarativa del ciclo de vida (`pre_branch`, `post_init`, `pre_commit`, `preflight`) y bindings por dominio (`solana`, `app`, `api`, `db`, `nft`, `shared`).
- Integración de la lectura y validación de `.agents/hooks.json` en `scripts/task-init.sh` para forzar la delegación de subagentes en el bootstrap.
- Sincronización de reglas en `AGENTS.md` y actualización del índice de conocimiento (`knowledge/README.md`).

## Feature-Flag Strategy
N/A - Refactorización de infraestructura de agentes y gobernanza del monorepo; gobernada por los gates de preflight y validación de CI.

## Riesgos
- **Riesgo**: Intentos de invocación del subagente obsoleto `structure.yaml`.
- **Mitigación**: `AGENTS.md` y `task-init.sh` fueron actualizados para sustituir `structure` por `architect`.

## Rollback Plan
Si se requiere rollback, revertir el commit del merge en `develop` hacia la revisión previa (`git revert -m 1 HEAD`).

## Prueba Devnet
N/A - Refactorización de arnés de agentes, scripts de bootstrap y documentación de gobernanza.

## Human Acceptance
- Status: Approved
- Reviewer: User manual validation (Socratic interview & SPEC approval)
- Notes: Las 3 SPECs atómicas fueron completadas, probadas y validadas con `pnpm validate` (100% verde).
