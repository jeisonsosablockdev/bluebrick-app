---
type: Document
title: BRI- 181 Linear Update
description: BRI- 181 Linear Update - migrated from knowledge/
tags: [reports]
timestamp: 2026-07-20T03:26:08Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/reports/BRI-181-linear-update.md
---

# Issue Update: Solución a Problemas de Drifting y Orquestación en Agentes (BRI-181)

## 🇪🇸 VERSIÓN ESPAÑOL

### Asignación & Metadatos
* **Issue ID:** `BRI-181`
* **Linear Issue:** [BRI-181](https://linear.app/brids-app/issue/BRI-181/solucion-problemas-de-drifting-y-orquestacion-en-agentes)
* **Team:** `Shared` / `Infrastructure`
* **Feature Type:** `Refactor`
* **Priority:** `High`
* **Label:** `scope:shared, type:refactor, risk:medium, size-exempt`
* **Parent Branch:** `refactor/shared-agents-drifting-bri-181`
* **Pull Request:** [#316](https://github.com/jeisonsosablockdev/brids/pull/316)
* **Estado Linear:** `In Review`

---

### 🎯 Objetivo de la Solución
Solucionar los problemas de drifting en el sistema de agentes, unificar la gobernanza en un único set de reglas en `AGENTS.md`, eliminar `.codex/` y archivos sueltos de la raíz, integrar **Graphify** (`.agents/graph.json`) para ahorro masivo de tokens y estandarizar el gestor de paquetes a `pnpm`.

---

### 📦 Artefactos OKF
* **Problem Artifact:** [`knowledge/features/feature-shared-agents-drifting-bri-181.md`](../../knowledge/features/feature-shared-agents-drifting-bri-181.md)
* **Solution Artifact:** [`knowledge/features/feature-shared-agents-drifting-bri-181-implementation.md`](../../knowledge/features/feature-shared-agents-drifting-bri-181-implementation.md)

---

### 🧩 Desglose de Iteraciones (7-SPEC Breakdown)

| Slice / SPEC | Descripción | Rama SPEC | Estado |
| :--- | :--- | :--- | :--- |
| **S01** (Planning) | Creación de artefactos canónicos OKF y plan de implementación detallado. | `SPEC/shared-agents-drifting-bri-181-s01-planning` | 🟢 **Completed** |
| **S02** (Agentes & Reglas) | Creación de `.agents/agents/*.yaml` (incluyendo `structure.yaml`), remoción de `.codex/` y consolidación de `GEMINI.md` en `AGENTS.md`. | `SPEC/shared-agents-drifting-bri-181-s02-agents` | 🟢 **Completed** |
| **S03** (Scripts Refactor) | Actualización de acoplamientos en `agent-bootstrap.sh`, `governance-drift-core.ts` y `check-monorepo-structure.sh` a `.agents/` y depuración de la raíz. | `SPEC/shared-agents-drifting-bri-181-s03-scripts` | 🟢 **Completed** |
| **S04** (Graphify Integration) | Creación de `scripts/graphify-sync.js`, generación de `.agents/graph.json` y visualización del grafo Mermaid en OKF. | `SPEC/shared-agents-drifting-bri-181-s04-graphify` | 🟢 **Completed** |
| **S05** (Enforcement & Savings) | Actualización de reglas de enforcement en `AGENTS.md` y políticas para lectura obligatoria prioritaria de `.agents/graph.json` (ahorro de tokens). | `SPEC/shared-agents-drifting-bri-181-s05-enforcement` | 🟢 **Completed** |
| **S06** (Canonical QA & E2E) | Verificación completa del flujo canónico, simulación de tareas con los nuevos agentes/grafo, `pnpm validate` y Human Acceptance. | `SPEC/shared-agents-drifting-bri-181-s06-workflow-qa` | 🟢 **Completed** |
| **S07** (Package Cleanup) | Auditoría completa y eliminación de residuos de `npm`, estandarización estricta de comandos a `pnpm`. | `SPEC/shared-agents-drifting-bri-181-s07-package-cleanup` | 🟢 **Completed** |

---

### 🧪 Plan de Verificación & Resultados
- **Local Validation (`pnpm validate`)**: ✅ **PASSED (100%)**
  - Lint + Typecheck pasados.
  - 33 migraciones de DB validadas.
  - Contracts, SEO, Schemas, AI Readable, Feeds y Operabilidad pasados.
  - Workflow Evals (`tests/lib/workflow-evals.test.ts` 8/8 tests) pasados.
  - Governance Doc Sync Check pasado.
- **Vercel Preview**: ✅ **SUCCESS** ([Ver despliegue en Vercel](https://vercel.com/brids1-projects/brids/GGaBaxgcEPpaujB2ECe5MoM3pzHL))
- **Pull Request Open**: ✅ [#316](https://github.com/jeisonsosablockdev/brids/pull/316)

---

### 🛡️ Human Acceptance Checklist
- [x] Todos los 7 SPECs fusionados en la rama padre `refactor/shared-agents-drifting-bri-181`.
- [x] Pruebas automatizadas y locales validadas.
- [x] Sin archivos residuales en la raíz ni referencias a `.codex`.
- [x] Pull Request lista en estado `In Review`.
