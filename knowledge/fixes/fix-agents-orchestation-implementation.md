# Fix: Agents Orchestation Implementation

Last Updated: 2026-06-07 UTC
Status: planned
Owner: shared workflow
Artifact Type: solution

## Summary

Este artefacto documenta la solución.

Ya no responde “qué duele”, sino:

- cómo se va a resolver
- en qué slices
- con qué branches
- qué pruebas van primero
- qué tooling hay que instalar
- qué gates deben pasar
- qué va a ir a Linear

Este documento debe ser decision-complete.

Regla:

- si falta una decisión material, no se implementa todavía
- primero se documenta la pregunta
- luego se resuelve
- y solo entonces se abre implementación

El artefacto de problema que acompaña esta solución vive en:

- `knowledge/fixes/fix-agents-orchestation.md`

La regla propuesta en este fix aplica el modelo de doble artefacto a:

- features
- fixes

## Why Double Artifact

La ventaja real del doble artefacto es evitar dos errores muy comunes:

1. empezar a implementar cuando todavía no está claro el problema
2. tener una solución vaga que obliga al implementador a inventar decisiones técnicas

También ayuda en cuatro frentes:

- mejor planeación
  - el problema queda estable antes de tocar código
- mejor delegación
  - cada slice sale con alcance claro
- mejor documentación en Linear
  - el issue no depende de memoria ni de comentarios sueltos
- mejor review
  - reviewer y QA comparan contra un contrato escrito, no contra intuición

Aplicación por family:

- features:
  - problem artifact
  - solution artifact
- fixes:
  - problem artifact
  - solution artifact

## Best-Practice Alignment

Esta propuesta también se alinea con prácticas recomendadas por OpenAI para sistemas agentic:

- empezar con workflows simples antes de subir complejidad
- usar eval-driven development en vez de validación por intuición
- endurecer guardrails y structured outputs entre pasos del sistema
- justificar multi-agent solo cuando la complejidad o los evals lo demanden

Aplicado a este repo, eso significa:

- no agregar agentes o pasos por defecto si una secuencia más simple resuelve el problema
- convertir handoffs blandos en contratos estructurados
- evaluar el propio workflow del repo, no solo el código de producto
- tratar `planner -> docs -> implementation -> qa -> reviewer` como un sistema verificable
- hacer pausas deliberadas para preguntar cuando falte contexto material, en vez de improvisar

## Implementation Model

El flujo operativo objetivo queda así:

1. crear issue en Linear
2. usar el branch madre generado por Linear
3. crear o actualizar problem artifact
4. crear o actualizar solution artifact
5. sacar documentation slice
6. definir slices atómicos
7. recién ahí abrir implementación

Convención propuesta de artefactos:

- feature problem artifact:
  - `knowledge/features/feature-<slug>.md`
- feature solution artifact:
  - `knowledge/features/feature-<slug>-implementation.md`
- fix problem artifact:
  - `knowledge/fixes/fix-<slug>.md`
- fix solution artifact:
  - `knowledge/fixes/fix-<slug>-implementation.md`

## Specific Weak Enforcement In The Current System

La revisión de `AGENTS.md`, `.codex/*`, docs canónicas y scripts actuales deja estas debilidades concretas:

1. `AGENTS.md` resume bien el flujo, pero no obliga artifact-first ni dual artifact para features y fixes.
2. `.codex/agents/planner.toml` y `.codex/agents/docs.toml` hablan de policy canónica, pero no endurecen:
   - Linear-first
   - mother branch canónica
   - documentation slice first
   - RFC owned by documentation slice
3. `.codex/policies/docs-policy.md` y `.codex/policies/testing-policy.md` todavía se quedan más cerca de “guía” que de contrato ejecutable.
4. `.codex/workflows/*.md` siguen describiendo la secuencia, pero no exigen precondiciones estructuradas antes de implementación.
5. `scripts/ci/check-required-docs.sh` hoy protege mejor un feature note suelto que un artifact pair consistente para features y fixes.
6. No existe todavía un contrato estructurado de handoff entre `planner`, `docs`, `qa` y `reviewer`.
7. No existe un baseline de evals del propio workflow de desarrollo; todavía hay demasiado espacio para “vibe-based governance”.

## Reinforcements Proposed For AGENTS.md And .codex

Para que el sistema deje de depender de buenas intenciones, este fix propone reforzarlo así:

### 1. Keep AGENTS.md Short, But Raise Entry Gates

`AGENTS.md` no debe crecer demasiado. Su trabajo es:

- apuntar a la fuente canónica
- declarar los gates de entrada
- recordar que artifact-first y documentation-slice-first aplican a trabajo no trivial
- recordar que features y fixes usan artifact pair

No debe duplicar policy extensa.

### 2. Move Operational Precision Into `.codex`

`.codex` debe convertirse en el lugar donde el workflow se vuelve más ejecutable para agentes, con:

- prompts de agentes más específicos
- workflows con precondiciones claras
- policies comprimidas pero no blandas
- handoffs esperados por rol

### 3. Introduce Structured Handoff Contracts

En vez de depender de resúmenes libres, cada handoff relevante debe tener campos mínimos obligatorios.

Ejemplos:

- `planner -> docs`
  - issue
  - branch canónica
  - artifact requerido
  - si aplica documentation slice
  - si aplica RFC
- `docs -> implementation`
  - artifact pair
  - slice scope
  - test-plan-first
  - gates
- `qa -> reviewer`
  - comandos corridos
  - evidencia disponible
  - gaps abiertos
  - blockers sí/no

### 3.1 Add Explicit Clarification Triggers

Para evitar improvisación, el sistema debe obligar una pausa de clarificación cuando falte contexto material.

El agente debe preguntar antes de continuar si ocurre cualquiera de estas condiciones:

- falta una decisión de diseño que cambia la arquitectura o el scope
- el artifact y el cambio pedido no cuadran entre sí
- una policy, script o workflow se contradice con otra fuente canónica
- el slice necesita un tool o connector que no existe o no está habilitado
- el cambio parece requerir una excepción al workflow y esa excepción no está definida
- hay más de una implementación razonable con consecuencias no obvias
- el usuario pidió una cosa, pero el sistema detecta que el outcome real exige otra decisión previa

Regla:

- si el gap es material, no se rellena con suposición silenciosa
- primero se pregunta
- luego se documenta la respuesta o decisión
- y recién ahí se continúa

Formato esperado de clarificación:

- corto
- concreto
- orientado a desbloquear
- preferiblemente con opciones cuando existan caminos distintos

### 4. Add A Trivial-Work Exception Policy

El sistema necesita excepciones explícitas para cambios realmente pequeños. Si no, o se vuelve burocrático o la gente empieza a ignorarlo.

La excepción debe ser:

- pequeña
- explícita
- verificable

Y debe decir qué sí puede saltarse y qué no.

### 5. Add Workflow Evals

Siguiendo la recomendación de OpenAI de usar evals temprano y continuamente, este sistema debe tener pruebas del propio workflow:

- branch naming
- required artifact detection
- documentation slice ordering
- RFC ownership rules
- PR gate failures esperados
- clarification-required scenarios

La idea no es “confiar en que el agente entendió”.
La idea es que el repo tenga pruebas que capturen si el workflow se rompió.

### 6. Prefer Simple Workflow Before More Agent Complexity

También alineado con OpenAI:

- si un workflow simple resuelve el problema, no hay que añadir más agentes
- multi-agent o handoffs más finos solo cuando el beneficio esté justificado por complejidad real o por evals

Este fix no busca agregar más especialización por defecto.
Busca endurecer mejor la que ya existe.

## Spirit-Preservation Controls

Para evitar `following the letter, but not the spirit`, el sistema debe añadir controles explícitos de intención:

### 1. Outcome Contract Per Slice

Cada slice debe declarar no solo qué toca, sino qué outcome real protege.

Ejemplo:

- no basta con “actualizar docs”
- debe decir “cerrar la decisión material para que implementación no invente arquitectura”

### 2. Failure Modes Per Slice

Cada slice debe incluir:

- `Failure Modes`
- `Not acceptable if`
- `Spirit check`

Eso obliga a distinguir entre cumplimiento superficial y resolución real.

### 3. Reviewer Letter Check + Spirit Check

Reviewer no debe validar solo:

- si el checklist pasó

También debe validar:

- si el cambio resolvió la intención del slice
- si redujo ambigüedad real
- si el agente evitó workaround cosmético

### 4. Halt-And-Ask Rule

Si una decisión material falta, el agente no debe “resolver como pueda”.

Debe:

1. detener la implementación
2. hacer una pregunta concreta
3. registrar la decisión
4. continuar solo cuando el contrato vuelva a estar completo

### 5. Good vs Bad Completion Examples

Cuando sea posible, el workflow debe tener ejemplos de:

- completion aceptable
- completion no aceptable

Esto reduce muchísimo el riesgo de interpretación literalista.

### 6. Clean-Code Design Contract Per Delivery Slice

Cada delivery slice debe definir su contrato clean-code antes de abrir implementación.

Ese contrato debe declarar:

- una sola responsabilidad dominante
- boundary o extracción esperada
- nombres que deben mejorar o mantenerse claros
- riesgo de coupling o duplicación
- política de dead code
- tests que protegen el diseño

Esto mueve clean code al diseño del slice. `reviewer` sigue siendo gate final, pero no es el primer lugar donde se descubre si el slice fue mal diseñado.

## Solution Split

La implementación se divide en dos partes para reducir riesgo y evitar un refactor demasiado ancho en una sola iteración.

### Part A: Workflow Identity And Artifact Ownership

Objetivo:

- endurecer la identidad del trabajo antes de endurecer los gates técnicos

Incluye:

- issue obligatorio en Linear para features, fixes y trabajo RFC-governed
- mother branch tomada solo desde `git branch name` del issue madre
- artefacto obligatorio previo
- dual artifact para features
- dual artifact para fixes
- documentation slice first
- RFC owned by documentation slice
- sincronía artefacto -> Linear
- handoffs estructurados mínimos entre agentes clave
- contrato clean-code por delivery slice antes de implementación
- clarificación obligatoria cuando falte contexto material
- política explícita para excepciones triviales
- controles para preservar la intención del workflow

### Part B: Enforcement And Quality Gates

Objetivo:

- endurecer el cierre del trabajo con evidencia verificable

Incluye:

- TDD real
- `npm test`
- tests dentro de `validate`
- PR governance ejecutable
- responsive/browser-critical QA contractual
- disciplina de staging y commit
- evals del propio workflow del repo

## Branching Model

La implementación debe trabajar con este modelo:

- issue nuevo en Linear
- mother branch canónica tomada del campo `git branch name`
- documentation slice primero
- slices de implementación después

Ramas esperadas:

- mother branch:
  - tomada exactamente desde Linear
- documentation slice:
  - `fix/shared-agents-orchestation-enforcement-bri-157-s01-documentation`
- slices de implementación Part A:
  - `fix/shared-agents-orchestation-enforcement-bri-157-s02-linear-branch-enforcement`
  - `fix/shared-agents-orchestation-enforcement-bri-157-s03-artifact-enforcement`
  - `fix/shared-agents-orchestation-enforcement-bri-157-s04-rfc-ownership`
- slices de implementación Part B:
  - `fix/shared-agents-orchestation-enforcement-bri-157-s05-tdd-baseline`
  - `fix/shared-agents-orchestation-enforcement-bri-157-s06-pr-governance-gates`
  - `fix/shared-agents-orchestation-enforcement-bri-157-s07-responsive-browser-gates`
  - `fix/shared-agents-orchestation-enforcement-bri-157-s08-git-atomicity-enforcement`

## Atomic Slice Plan

Este fix debe ejecutarse en slices pequeñas, reviewables y con una sola responsabilidad dominante.

Reglas del slice plan:

- `s01` siempre es documentation slice
- cada slice debe cerrar una decisión material o un gate ejecutable
- si un slice depende de una decisión aún no cerrada en el artefacto, no se abre todavía
- cada slice debe declarar pruebas esperadas antes de implementación
- el merge de cada slice vuelve a la mother branch o integration branch canónica de la iniciativa

### Part A: Workflow Identity And Artifact Ownership

| Slice | Branch | Objetivo | Scope | Archivos esperados | Tests first | Gate de cierre |
| --- | --- | --- | --- | --- | --- | --- |
| `s01` | `fix/shared-agents-orchestation-enforcement-bri-157-s01-documentation` | Cerrar el contrato documental y la secuencia oficial del workflow | Definir doble artefacto para features y fixes, mother branch, documentation slice, RFC ownership, Linear sync | `knowledge/fixes/fix-agents-orchestation.md`, `knowledge/fixes/fix-agents-orchestation-implementation.md`, `knowledge/governance/documentation-policy.md`, `knowledge/governance/git-monorepo-policy.md`, `knowledge/guides/linear-single-issue-slice-planning.md`, templates asociados | Validar que el artifact pair y el slice map existan completos antes de tocar scripts | El artefacto de solución queda decision-complete para Part A y `validate:docs-governance` pasa |
| `s02` | `fix/shared-agents-orchestation-enforcement-bri-157-s02-linear-branch-enforcement` | Endurecer Linear-first y mother branch canónica | Generación/validación de branch desde issue madre y `git branch name` | `scripts/linear-plan-core.js`, `scripts/git-start.sh`, `knowledge/guides/linear-single-issue-slice-planning.md`, `knowledge/templates/linear-single-issue-slices.template.md` | Tests para branch naming, branch generation y required parent issue metadata | Generación de plan y branch helpers reflejan el modelo canónico y tests pasan |
| `s03` | `fix/shared-agents-orchestation-enforcement-bri-157-s03-artifact-enforcement` | Hacer obligatorio el artefacto correcto por family branch | Enforce de dual artifact en `knowledge/features/*.md` y `knowledge/fixes/*.md` | `scripts/ci/check-required-docs.sh`, `knowledge/governance/documentation-policy.md`, `.codex/policies/docs-policy.md` | Tests para PR con cambio calificado sin docs, con solo un artifact, y con pair válido | El repo bloquea missing artifact y acepta el artifact pair correcto por tipo de iniciativa |
| `s04` | `fix/shared-agents-orchestation-enforcement-bri-157-s04-rfc-ownership` | Anclar RFC al documentation slice cuando aplique | Templates, guías y ownership operacional del RFC | `knowledge/rfcs/templates/EPIC-README.template.md`, `knowledge/rfcs/templates/STORY.template.md`, `knowledge/governance/documentation-policy.md`, `.codex/agents/docs.toml`, `.codex/agents/planner.toml` | Tests o validaciones de template/section presence y sync rules cuando RFC aplica | El RFC queda explícitamente owned by documentation slice y la policy no deja ambigüedad |
| `s05` | `fix/shared-agents-orchestation-enforcement-bri-157-s05-agent-handoff-contracts` | Volver estructurados los handoffs mínimos entre agentes | Contracts para `planner`, `docs`, `qa`, `reviewer`, triggers de clarificación, excepciones de trabajo trivial y clean-code design contract por delivery slice | `AGENTS.md`, `.codex/agents/*.toml`, `.codex/workflows/*.md`, `.codex/policies/*.md`, `knowledge/guides/codex-orchestration-architecture.md`, `tests/lib/workflow-evals.test.ts` | Tests de fixtures o validaciones de contract presence/required fields | Los agentes dejan de depender de contexto libre para gates críticos, preguntan cuando falta contexto material, diseñan slices con clean code desde el artifact y el repo define excepciones explícitas |

### Part B: Enforcement And Quality Gates

| Slice | Branch | Objetivo | Scope | Archivos esperados | Tests first | Gate de cierre |
| --- | --- | --- | --- | --- | --- | --- |
| `s06` | `fix/shared-agents-orchestation-enforcement-bri-157-s06-tdd-baseline` | Instalar el baseline TDD real para Next.js | `Vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `npm test`, wiring base | `package.json`, `vitest.config.ts`, `tests/setup/vitest.setup.ts`, `tests/`, `.codex/policies/testing-policy.md` | Smoke test de runner, test unitario mínimo y prueba de script interno | `npm test` existe, corre en local/CI, y el repo ya tiene baseline usable |
| `s07` | `fix/shared-agents-orchestation-enforcement-bri-157-s07-pr-governance-gates` | Reemplazar PR governance placeholder por gates reales | PR readiness, metadata lint, open flow, labels/body required | `scripts/ci/pr-ready.sh`, `scripts/ci/pr-metadata-lint.sh`, `scripts/ci/pr-open.sh`, governance docs relacionadas | Tests para metadata mínima, labels, body sections y failure modes | PR governance deja de ser checklist blando y pasa a bloquear por reglas ejecutables |
| `s08` | `fix/shared-agents-orchestation-enforcement-bri-157-s08-responsive-browser-gates` | Endurecer responsive/browser-critical QA | Artifact mínimo, overflow global, evidencia ambigua como fail | `.codex/workflows/responsive-qa.md`, `.codex/policies/testing-policy.md`, scripts o helpers QA asociados | Tests o fixtures que demuestren detección de evidencia ausente/ambigua | Browser-critical QA deja contrato mínimo verificable y bloquea evidencia insuficiente |
| `s09` | `fix/shared-agents-orchestation-enforcement-bri-157-s09-git-atomicity-enforcement` | Endurecer staging y disciplina de commits | Evitar `git add .`, bloquear commits directos a ramas protegidas, alinear helpers | `scripts/git-save.sh`, `scripts/git-push.sh`, `knowledge/governance/git-monorepo-policy.md`, `AGENTS.md` si requiere resumen | Tests de helpers o checks de shell sobre staging/branch protection rules | Los helpers ya no incentivan atomicidad rota ni bypass evidente del workflow |
| `s10` | `fix/shared-agents-orchestation-enforcement-bri-157-s10-workflow-evals` | Agregar evals del propio sistema de desarrollo | Tests del workflow: artifact detection, slice ordering, branch rules, gate failures, spirit-preservation y clarification-required scenarios | `tests/`, scripts afectados, `package.json`, docs de testing y governance asociadas | Escribir primero casos que hoy deberían fallar con enforcement ausente | El repo puede demostrar que su propio workflow está protegido por pruebas y no solo por intención |

## Slice Execution Order

El orden obligatorio es este:

1. `s01` documentation
2. `s02` linear + branch enforcement
3. `s03` artifact enforcement
4. `s04` RFC ownership
5. `s05` agent handoff contracts
6. `s06` TDD baseline
7. `s07` PR governance gates
8. `s08` responsive/browser gates
9. `s09` git atomicity enforcement
10. `s10` workflow evals

Dependencias clave:

- `s02`, `s03`, `s04` y `s05` dependen de que `s01` haya cerrado el contrato documental
- `s06`, `s07`, `s08`, `s09` y `s10` dependen de las reglas endurecidas en Part A
- `s06` debe quedar listo antes de exigir tests como gate real en los slices posteriores
- `s10` debe ejecutarse al final para capturar el enforcement real de todo el sistema, no de una sola pieza aislada

## Documentation Slice Ownership

La documentation slice debe:

- crear o actualizar ambos artefactos
- fijar el atomic slice plan
- fijar el test plan first
- fijar riesgos
- fijar validation gates
- decidir si aplica RFC
- si aplica RFC, crear o actualizar el RFC ahí mismo
- preparar lo que luego se sincronizará a Linear

Sin documentation slice completa:

- no se abren slices de implementación

## RFC Rule

Si la iniciativa requiere RFC:

- el RFC nace o se actualiza en la documentation slice
- el documentation slice es dueño de esa trazabilidad
- la mother branch integra el RFC ya revisado, pero no lo redacta primariamente

## Tests First Plan

TDD no queda como “después vemos”.

La base recomendada para Next.js y este repo es:

- `Vitest` como runner unificado
- `expect()` integrado de Vitest
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `Playwright` para browser-critical QA

### Why This Stack

- es la opción más natural para Next.js moderno
- evita mezclar runners innecesarios
- permite unificar:
  - unit tests de componentes
  - tests de utilidades
  - tests de scripts internos
- deja Playwright reservado para flujos browser-critical

## TDD Rule For Implementation

El orden correcto debe ser:

1. escribir el test
2. verlo fallar
3. implementar mínimo
4. verlo pasar
5. correr el `validate` completo

Si no existe evidencia de rojo -> verde cuando el cambio lo requiere:

- el slice no cierra

## Tooling To Install Or Wire

La solución debe aterrizar este baseline mínimo:

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `playwright`

También debe incorporar:

- `npm test`
- `vitest.config.ts`
- `tests/setup/vitest.setup.ts`
- smoke browser path en `playwright.config.ts`
- ejemplo mínimo `e2e/home.spec.ts` o equivalente

## Package-Level Changes Expected

Se espera tocar:

- `package.json`
  - agregar `test`
  - integrar tests al pipeline correcto
  - agregar `validate:workflow` para evaluar el propio sistema de desarrollo
- `vitest.config.ts`
- `tests/setup/vitest.setup.ts`
- carpeta base `tests/`

## Files Expected To Change

Como mínimo, esta solución espera cambios en:

- `AGENTS.md`
- `.codex/workflows/frontend-cycle.md`
- `.codex/workflows/responsive-qa.md`
- `.codex/policies/testing-policy.md`
- `.codex/policies/frontend-policy.md`
- `.codex/policies/docs-policy.md`
- `knowledge/governance/documentation-policy.md`
- `knowledge/governance/git-monorepo-policy.md`
- `knowledge/guides/linear-single-issue-slice-planning.md`
- `knowledge/templates/linear-single-issue-slices.template.md`
- `knowledge/rfcs/templates/EPIC-README.template.md`
- `knowledge/rfcs/templates/STORY.template.md`
- `scripts/ci/check-required-docs.sh`
- `scripts/ci/pr-ready.sh`
- `scripts/ci/pr-metadata-lint.sh`
- `scripts/ci/pr-open.sh`
- `scripts/git-start.sh`
- `scripts/git-save.sh`
- `scripts/git-push.sh`
- `scripts/linear-plan-core.js`
- `scripts/rfc-new-core.js`
- `package.json`

También probablemente:

- `tests/`
- helpers de validación de issue en Linear
- helpers de validación de mother branch canónica

## Validation Gates

La solución debe demostrar:

- enforcement de problem + solution artifact en `knowledge/features/*.md`
- enforcement de problem + solution artifact en `knowledge/fixes/*.md`
- issue obligatorio en Linear
- mother branch canónica desde Linear
- documentation slice como primer slice
- RFC owned by documentation slice cuando aplique
- existencia de `npm test`
- tests incluidos en `validate`
- PR scripts sin placeholder
- responsive/browser-critical QA con artifact mínimo
- handoffs críticos con contrato estructurado mínimo
- clean-code design contract por delivery slice antes de implementación
- excepciones triviales definidas y no ambiguas
- pruebas del propio workflow para evitar governance por intuición
- triggers de clarificación definidos para decisiones materiales faltantes
- reviewer con chequeo explícito de `letter` y `spirit`

## Linear Sync Contract

Lo que debe ir a Linear desde este artefacto:

- issue madre de la iniciativa
- mother branch canónica
- documentation slice
- atomic slice plan
- riesgos principales
- test plan first
- estado de RFC cuando aplique
- gates pendientes de cierre

Principio:

- Linear se actualiza desde el artefacto
- no al revés

## Reviewer And QA Contract

Reviewer y QA deben comparar contra este documento, no contra intuición.

Deben bloquear si falta:

- issue en Linear
- mother branch correcta
- documentation slice previa
- artifact pair actualizado para la family correcta (`feature` o `fix`)
- RFC en slice documental cuando aplique
- evidencia tests-first cuando aplique
- evidencia browser-critical suficiente
- handoff estructurado cuando el flujo lo requiera
- clean-code design contract ausente en delivery slices
- evidencia de que la excepción “trivial” realmente aplica cuando se use
- clarificación registrada cuando faltaba una decisión material
- resolución del `spirit check` cuando un cambio podía cumplir checklist pero no el outcome real

## Execution Evidence: 2026-06-07

Cambios ejecutados en esta slice de harness:

- `.codex/agents/*.toml` quedó alineado a `preferred_model = "gpt-5.5"` para todos los agentes.
- No se introdujo `.claude/commands` ni estructura Claude; el harness se mantiene Codex-first.
- `AGENTS.md`, `planner`, `docs`, `docs-policy`, `refactor-cycle` y la guía de orquestación exigen `clean-code design contract` antes de implementar delivery slices.
- `tests/lib/workflow-evals.test.ts` protege esa regla con una eval del workflow.
- `npm run knowledge:drift` generó `knowledge/reports/governance-drift-2026-06-07.md` con `Failing Checks: 0`.
- `npm run knowledge:index` actualizó `knowledge/README.md` para mantener el conocimiento incremental sincronizado.

Validaciones ya ejecutadas:

- `npm run validate:workflow`
- `npm run validate:knowledge`

## Recommendation For Next.js Teams

Si otra persona quiere implementar este modelo en Next.js, la recomendación concreta es:

- no usar una assert library aislada como centro del sistema
- usar:
  - `Vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
- unificar el runner para la mayor parte del repo
- reservar Playwright solo para:
  - login
  - navegación crítica
  - formularios importantes
  - responsive/browser proof
- separar problema y solución en dos artefactos

Ese baseline baja complejidad y evita que el implementador tenga que inventar el workflow.

## Completion Criteria

Esta solución se considerará lista para implementación solo cuando:

- no falten decisiones materiales
- exista branch model claro
- exista slice plan atómico
- exista test plan first explícito
- exista lista concreta de tooling
- existan validation gates verificables
- exista contrato claro de qué se sincroniza a Linear

Si cualquiera de esas piezas sigue ambigua:

- no se implementa todavía

## Notes

- Este documento no reemplaza el artefacto de problema.
- Este documento solo sirve si está decision-complete.
- Si durante ejecución aparece una decisión no resuelta, se vuelve a documentación antes de seguir codificando.
- Si falta tooling, un conector, un script o una regla y eso cambia el outcome, se pregunta primero; no se improvisa.
