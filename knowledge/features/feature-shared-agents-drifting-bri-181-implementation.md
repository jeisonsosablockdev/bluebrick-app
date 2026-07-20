---
type: Feature Spec
title: Feature Shared Agents Drifting BRI- 181 Implementation
description: Feature Shared Agents Drifting BRI- 181 Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-agents-drifting-bri-181-implementation.md
---

# Solution Artifact: Solución problemas de drifting y orquestación en agentes (BRI-181) - Implementation Plan

Este documento describe la solución técnica y el plan de implementación para migrar todas las definiciones de subagentes especialistas, unificar las configuraciones y eliminar el directorio heredado `.codex/`.

## User Review Required

> [!IMPORTANT]
> - **Formato YAML**: Portaremos las especificaciones de agentes TOML heredados en `.codex/agents/*.toml` a archivos YAML estructurados en `.agents/agents/*.yaml` para facilitar su interoperabilidad y legibilidad por Gemini.
> - **Modelo Dinámico ("inherit")**: Para evitar acoplar los agentes a un modelo específico y permitir que utilicen el modelo disponible en el runner o sesión activa, configuraremos `preferred_model: "inherit"` en todos los subagentes. De este modo, heredarán automáticamente el modelo del agente invocador (el planner o la sesión principal).
> - **Remoción de `.codex/`**: Eliminaremos por completo el directorio `.codex/` del repositorio, resolviendo todo el drifting del sistema de agentes.

---

## 6-Stage Multi-SPEC Breakdown (Slices)

Para cumplir con el flujo de desarrollo canónico del repositorio, el trabajo se dividirá en las siguientes ramas e iteraciones de SPEC independientes:

| Slice / SPEC | Descripción | Rama SPEC | Estado |
| :--- | :--- | :--- | :--- |
| **S01** (Planning) | Creación de artefactos canónicos (`knowledge/features/feature-shared-agents-drifting-bri-181.md`) y el plan de implementación detallado. | `SPEC/shared-agents-drifting-bri-181-s01-planning` | **Completed** |
| **S02** (Agentes & Reglas) | Creación de `.agents/agents/*.yaml` (incluyendo `structure.yaml`), eliminación de `.codex/` y consolidación de `GEMINI.md` en `AGENTS.md`. | `SPEC/shared-agents-drifting-bri-181-s02-agents` | **Completed** |
| **S03** (Scripts Refactor) | Actualización de acoplamientos en `agent-bootstrap.sh`, `governance-drift-core.ts` y `check-monorepo-structure.sh` a `.agents/` y depuración de la raíz. | `SPEC/shared-agents-drifting-bri-181-s03-scripts` | **Completed** |
| **S04** (Graphify Integration) | Creación de `scripts/graphify-sync.ts`, generación de `.agents/graph.json` y visualización del grafo Mermaid en OKF. | `SPEC/shared-agents-drifting-bri-181-s04-graphify` | **Completed** |
| **S05** (Enforcement & Savings) | Actualización de reglas de enforcement en `AGENTS.md` y scripts para forzar a los agentes a consultar el grafo `.agents/graph.json` antes de leer archivos extensos (ahorro de tokens). | `SPEC/shared-agents-drifting-bri-181-s05-enforcement` | **Completed** |
| **S06** (Canonical QA & E2E) | Verificación completa del flujo canónico, simulación de tareas con los nuevos agentes/grafo, `pnpm validate` y Human Acceptance para merge final. | `SPEC/shared-agents-drifting-bri-181-s06-workflow-qa` | **Completed** |
| **S07** (Package Cleanup) | Auditoría completa y eliminación de residuos de `npm` (por ejemplo, `package-lock.json`, invocaciones de `npm run` redundantes en scripts o docs) garantizando uso canónico de `pnpm`. | `SPEC/shared-agents-drifting-bri-181-s07-package-cleanup` | **In Progress** |

---

## Proposed Changes

### Ecosistema de Agentes Specialists (YAML)

#### [NEW] [docs.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/docs.yaml)
#### [NEW] [frontend.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/frontend.yaml)
#### [NEW] [nft.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/nft.yaml)
#### [NEW] [planner.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/planner.yaml)
#### [NEW] [qa.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/qa.yaml)
#### [NEW] [reasoning.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/reasoning.yaml)
#### [NEW] [reviewer.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/reviewer.yaml)
#### [NEW] [security.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/security.yaml)
#### [NEW] [solana.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/solana.yaml)
#### [NEW] [structure.yaml](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.agents/agents/structure.yaml)

---

### Modificaciones y Limpieza

#### [MODIFY] [AGENTS.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/AGENTS.md)
*Consolidar GEMINI.md, actualizar rutas apuntando a .agents/ y reforzar reglas de enforcement de Graphify.*

#### [DELETE] [GEMINI.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/GEMINI.md)
*Eliminación y consolidación de sus reglas en AGENTS.md.*

#### [DELETE] [.codex](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/.codex)
*Eliminación completa del directorio heredado para evitar drifting.*

---

## Verification Plan

### Automated Tests
- Ejecutar `grep_search` buscando referencias a `.codex/` en todo el codebase para asegurar la sanidad del repo.
- Ejecutar la validación completa del repositorio:
  ```bash
  pnpm validate
  ```

### Manual Verification
- Validar visualmente que el directorio `.agents/agents/` tenga las definiciones YAML con la sintaxis correcta.
- Simulación completa en S06 para verificar que el flujo canónico funciona sin fisuras.
