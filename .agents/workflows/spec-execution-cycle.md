# Canonical SPEC Execution Cycle (Gemini/Antigravity)

## Trigger
- Entrypoint for **ANY** new task, issue, SPEC, feature, fix, or slice of work in the repository.

## Subagent Delegation Map
- `planner`: Orquestación inicial, validación de preconditions y Human Gates.
- `docs`: Sincronización de artefactos duales de requerimientos (`knowledge/features/` o `knowledge/fixes/`) y Linear.
- `architect`: **Gate 1 Structural Scaffolding** (Scaffolding físico de archivos para pasar el test estructural a GREEN) + **Gate 2 Diff Audit**.
- `qa`: **Structural RED & Behavioral RED** (Diseño de tests de contrato y tests de lógica de negocio en fallo mediante el skill `tdd-primal`).
- Especialista de Dominio (`frontend`, `solana`, `api`, `db`, `nft`): **Behavioral GREEN** (Implementación de lógica con comentarios obligatorios).
- `reviewer`: **REFACTOR** (Auditoría de código limpio y remoción de deuda mediante el skill `code-refactoring-refactor-clean`).

---

## Antigravity Execution Sequence

```mermaid
sequenceDiagram
  autonumber
  actor User as 👤 Humano
  participant Planner as 🤖 Planner
  participant Docs as 📝 Docs
  participant QA as 🧪 QA (tdd-primal)
  participant Architect as 🏛️ Architect
  participant Specialist as 💻 Dev (Frontend/Solana)
  participant Reviewer as 🧹 Reviewer (clean-code)

  Planner ->> Docs: 1. Task Init & Dual Artifacts (Solution Spec con rutas proyectadas)
  Docs ->> QA: Rutas 4-capas proyectadas
  QA ->> QA: 2a. STRUCTURAL RED: Escribe test que valida existencia física de archivos (Falla / RED)
  QA ->> Architect: Test estructural en fallo
  Architect ->> Architect: 2b. STRUCTURAL GREEN: Scaffoldea físicamente los archivos y stubs -> Test pasa a GREEN
  Architect -->> User: 🛑 3. HUMAN DESIGN APPROVAL (Revisión de diseño y contratos físicos)
  User ->> QA: Aprobación de diseño
  QA ->> QA: 4. BEHAVIORAL RED: Escribe tests de lógica/pipelines en fallo (tdd-primal)
  QA ->> Specialist: Tests de negocio en fallo
  Specialist ->> Specialist: 5. BEHAVIORAL GREEN: Implementa lógica con comentarios (// Step N:) hasta pasar tests
  Specialist ->> Reviewer: 6. REFACTOR: Auditoría Clean Code & optimización (code-refactoring-refactor-clean)
  Reviewer ->> Architect: 7. ARCHITECT GATE 2: Auditoría de diff + pnpm validate (100% verde)
  Architect -->> User: 🛑 8. HUMAN MERGE ACCEPTANCE (Aprobación final)
  User ->> Planner: Autorización de merge -> pnpm pr:auto
```

---

## Fases Detalladas

| Fase | Rol / Subagente | Acción / Meta | Evidencia Obligatoria |
| :--- | :--- | :--- | :--- |
| **1. Bootstrap** | `planner` + `docs` | Ejecutar `./scripts/task-init.sh`, poblar artefactos duales sin placeholders y sincronizar el Human Brief en Linear con la lista de archivos proyectados. | `.agents/active_task_state.json` actualizado, Solution Spec con rutas 4-capas. |
| **2a. Structural RED** | `qa` (`tdd-primal`) | Diseñar y escribir un test estructural/contrato que verifique la existencia física y exportaciones esperadas de los archivos proyectados. **Al no existir aún, el test falla (RED).** | Test estructural ejecutado en fallo (`vitest run`). |
| **2b. Structural GREEN (Scaffolding)** | `architect` | El `architect` valida el diseño y **crea físicamente los archivos en el disco** con sus encabezados de capa, contratos de interfaces TypeScript y stubs mínimos. **El test estructural pasa a verde (GREEN).** | Test estructural ejecutado en verde (`vitest run`). Archivos creados en `apps/web/src/`. |
| **🛑 3. Human Design Gate** | Humano | Detener y esperar aprobación humana explícita del diseño arquitectónico y de los contratos físicos creados antes de implementar lógica. | Aprobación del usuario en chat. |
| **4. Behavioral RED (TDD)** | `qa` (`tdd-primal`) | Diseñar y escribir tests exhaustivos de comportamiento, lógica de negocio y pipelines en fallo (RED) contra los stubs existentes. | Tests de lógica en fallo ejecutados con `vitest run`. |
| **5. Behavioral GREEN (Code)** | Especialista (`frontend`/`solana`) | Implementar la lógica de negocio y pipelines paso a paso (`// Step N:`) hasta que todos los tests pasen a verde. | Tests pasando en verde (`vitest run`). |
| **6. REFACTOR (Clean Code)** | `reviewer` (`code-refactoring-refactor-clean`) | Auditar el código, eliminar deuda técnica, código muerto y optimizar estructura manteniendo los tests en verde. | Diff limpio y libre de deuda técnica. |
| **7. Architect Gate 2 & CI** | `architect` + `planner` | `architect` audita el diff final (aislamiento de capas y comentarios). Se ejecuta `pnpm validate` (100% verde). | Salida de `pnpm validate` sin errores ni warnings. |
| **🛑 8. Human Acceptance & PR** | Humano + `planner` | Detener y esperar autorización explícita de merge. Al recibirla, ejecutar `pnpm pr:auto` para abrir y etiquetar el PR. | PR creado con cuerpo generado y tags de GitHub. |
