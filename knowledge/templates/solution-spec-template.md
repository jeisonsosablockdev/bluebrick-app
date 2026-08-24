# Solution Spec: ${NAME} Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `[frontend | solana | db | api | state | nft]`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (where applicable)

## 2. Solution Overview & 4-Layer Architecture
<!-- Describe la arquitectura del cambio separada por las 4 capas funcionales:
     1. Presentation Layer (app, components)
     2. Application/Consumption Layer (queries, mutations, hooks)
     3. Domain/Pipelines/Services Layer (business logic, validations, adapters)
     4. Infrastructure Layer (db repositories, Solana kit, external APIs) -->

## 3. Atomic Slices & Logical Sequence
<!-- Desglose cronológico y atómico de SPECs de negocio / verticales. Cada SPEC debe ser autocontenida y secuencial.
     REGLAS DE OBLIGATORIEDAD DE SLICES:
     1. Cada SPEC individual ejecuta internamente su propio ciclo Red-Green-Refactor completo.
     2. Cada SPEC inicia con tests en fallo (RED) usando el skill 'tdd-primal', continúa con la implementación (GREEN) y finaliza con refactoring (REFACTOR) usando el skill 'code-refactoring-refactor-clean'.
     3. No crear SPECs separadas exclusivas de solo-tests o solo-refactor. -->
- **SPEC-1**: [Título del primer incremento de lógica / vertical slice] (Rama: `SPEC/${OWNER}-${ISSUE}-s01-...`)
- **SPEC-2**: [Título del segundo incremento de lógica / vertical slice] (Rama: `SPEC/${OWNER}-${ISSUE}-s02-...`)

## 4. TDD (Test-Driven Development) Strategy
<!-- Detalla el plan de pruebas que se creará ANTES de implementar el código (Fase RED). -->
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/...`
- **Command**: `pnpm test ...`
- **Assertion Goals**: <!-- Qué se validará en las pruebas en fallo -->

## 5. Local Definition of Done (DoD)
<!-- Criterios específicos para considerar esta tarea finalizada. -->
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] La documentación de arquitectura local y de base de datos está actualizada.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-${DOC_SLUG}.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-${DOC_SLUG}.md)
- **Solution Spec**: [feature-${DOC_SLUG}-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-${DOC_SLUG}-implementation.md)
- **Linear Issue**: [Linear Ticket #${ISSUE_ID}](https://linear.app/brids-app/issue/${ISSUE_ID})
