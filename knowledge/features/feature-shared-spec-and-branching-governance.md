---
type: Feature Spec
title: Feature Shared Spec And Branching Governance
description: Feature Shared Spec And Branching Governance - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-spec-and-branching-governance.md
---

# BRI-179 - Update transversal SPEC and Branching Governance

---

## VERSIÓN ESPAÑOL

---

### Human Brief

#### Ownership
- Issue: `BRI-179`
- Developer: `czambrano`
- Team: `BRIDS App`
- Linear source of truth: cuerpo del issue `BRI-179`
- Local Git record: `knowledge/features/feature-shared-spec-and-branching-governance.md`
- Rama principal del issue: `feature/czambrano-bri-179-shared-spec-and-branching-governance`

#### Objective
Actualizar la documentación del proyecto para incluir políticas transversales sobre la creación de SPECS, sincronización con Linear, formatos bilingües y verificación de identidad del desarrollador. Esto establece una formalización estricta de la estructura "Human Brief" como el único formato válido para los issues en Linear.

#### Scope
Las políticas `git-monorepo-policy.md` y `documentation-policy.md` deben ser actualizadas para incluir:
- Reglas claras de ramas y nomenclatura SPEC (`SPEC/<developer>-bri-<issue>-specNN-<slug>`), separando el ID de Linear con un guion.
- Protocolos de confirmación de identidad del desarrollador, exigiendo a `czambrano` o `Jeison Sosa` explícitamente en el Ownership.
- Uso de Linear como fuente de verdad y Markdown como registro congruente.
- Estándares bilingües y de ortografía (VERSIÓN ESPAÑOL primero).
- Obligatoriedad del `SPEC DEVELOPMENT HISTORY` y el protocolo de `SPEC MERGE` sin PR intermedio.
- Estructura obligatoria "Human Brief" para cualquier Issue en Linear.
- **REGLA PARA AGENTES**: Cada vez que se cree un issue, el agente debe preguntar a quién va asignado, tipo de feature, prioridad y label.

#### Non-goals
- Modificar el flujo de CI/CD (GitHub Actions).
- Hacer cambios en el frontend o UI.
- Crear nuevas reglas fuera del contexto de rama o gestión de issues.

#### Acceptance Criteria
- `documentation-policy.md` incluye la sección "Transversal Development Policy" con la plantilla estricta de Linear.
- `git-monorepo-policy.md` tiene las reglas de Ownership actualizadas.
- El issue `BRI-179` en Linear refleja fielmente el formato "Human Brief", incluyendo el estándar bilingüe con sus divisiones.
- La rama local ha sido renombrada correctamente con el guion `bri-179`.

#### Risks
- Si esta política no se adopta universalmente, los agentes y desarrolladores podrían seguir usando formatos genéricos en Linear, causando pérdida de información e incertidumbre en la delegación de responsabilidades.

#### Open Questions
- ¿Debemos automatizar un validador en CI/CD que compruebe si el contenido del Issue en Linear cuenta con las palabras clave "Ownership", "Scope", etc.?

---

## ENGLISH VERSION

---

### Human Brief

#### Ownership
- Issue: `BRI-179`
- Developer: `czambrano`
- Team: `BRIDS App`
- Linear source of truth: `BRI-179` issue body
- Local Git record: `knowledge/features/feature-shared-spec-and-branching-governance.md`
- Main issue branch: `feature/czambrano-bri-179-shared-spec-and-branching-governance`

#### Objective
Update the project documentation to include cross-cutting policies for SPEC creation, Linear sync, bilingual formats, and developer identity verification. This establishes a strict formalization of the "Human Brief" structure as the only valid format for issues in Linear.

#### Scope
The policies `git-monorepo-policy.md` and `documentation-policy.md` must be updated to include:
- Clear branch rules and SPEC nomenclature (`SPEC/<developer>-bri-<issue>-specNN-<slug>`), separating the Linear ID with a hyphen.
- Developer identity confirmation protocols, requiring `czambrano` or `Jeison Sosa` explicitly in Ownership.
- Use of Linear as the source of truth and Markdown as a congruent record.
- Bilingual and spelling standards (VERSIÓN ESPAÑOL first).
- Mandatory `SPEC DEVELOPMENT HISTORY` and the `SPEC MERGE` protocol without intermediate PR.
- Mandatory "Human Brief" structure for any Linear Issue.
- **AGENT RULE**: Whenever an issue is created, the agent must ask who it is assigned to, feature type, priority, and label.

#### Non-goals
- Modify the CI/CD flow (GitHub Actions).
- Make changes to the frontend or UI.
- Create new rules outside the context of branching or issue management.

#### Acceptance Criteria
- `documentation-policy.md` includes the "Transversal Development Policy" section with the strict Linear template.
- `git-monorepo-policy.md` has updated Ownership rules.
- The `BRI-179` issue in Linear accurately reflects the "Human Brief" format, including the bilingual standard with dividers.
- The local branch has been correctly renamed with the `bri-179` hyphen.

#### Risks
- If this policy is not universally adopted, agents and developers might continue using generic formats in Linear, causing information loss and uncertainty in responsibility delegation.

#### Open Questions
- Should we automate a CI/CD validator that checks if the Linear Issue content contains the keywords "Ownership", "Scope", etc.?
