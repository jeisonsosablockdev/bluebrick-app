---
type: Policy
title: Documentation Policy
description: Documentation Policy - migrated from knowledge/
tags: [governance]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/governance/documentation-policy.md
---

📖 CONTINUOUS DOCUMENTATION POLICY

(MANDATORY – NON-NEGOTIABLE)

⸻

Documentation must be created and updated alongside development.

No feature is complete without documentation.

Documentation comes before branching. The human-plus-agent brief establishes the issue type, scope, open questions, and branch family first; only then do we create the parent work branch and any SPEC branches. The documentation/spec slice must use explain-like-socrates before delivery slices open.

Canonical precedence and drift control:
	•	This file is the canonical documentation policy for the repository.
	•	`AGENTS.md`, guides, helper scripts, and workflow summaries may reference this policy, but must not redefine it with conflicting or looser rules.
	•	The executable enforcement source is `scripts/ci/check-required-docs.sh`.
	•	If a summary drifts from this file, this file and the enforcement scripts govern.

⸻

Transversal Development Policy

	•	**Developer Identity & Ownership:** Confirmar siempre con qué desarrollador del proyecto se está trabajando antes de crear, actualizar o sincronizar contenido en Linear. Antes de ejecutar protocolos de inicio de desarrollo o cualquier línea de código, el desarrollador asignado (`czambrano` o `Jeison Sosa`) debe estar declarado explícitamente en el bloque de `Ownership` del issue de Linear y en el artefacto local. **REGLA PARA AGENTES**: Cada vez que se vaya a crear un nuevo issue, el agente DEBE preguntar obligatoriamente al usuario: 1) a quién va asignado, 2) qué tipo de feature es, 3) qué prioridad tiene, y 4) qué etiqueta/label le corresponde (Improvement, feature, bug, documentation). Toda esta información de asignación, etiquetas y prioridad DEBE ser inyectada directamente en los metadatos del ticket en Linear utilizando la API (GraphQL), no basta con dejarlo solo en la descripción de Markdown.
	•	**Task Creation Lifecycle:** El proceso de creación de tareas se considera finalizado ÚNICAMENTE cuando: 1) La documentación (Human Brief) existe en el artefacto local. 2) La documentación está sincronizada en Linear y cumple con las políticas de gobernanza, estando aprobada por el developer a cargo. 3) Se ha creado la rama principal correspondiente usando el Issue ID de Linear.
	•	**Linear as Source of Truth & Mandatory Template:** Usar Linear como fuente principal para issues, objetivos, SPECS y criterios de aceptación. TODO issue en Linear y su correspondiente artefacto Markdown debe seguir OBLIGATORIAMENTE la estructura bilingüe oficial en [linear-brief-template.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/templates/linear-brief-template.md) (conocida como "Human Brief").
	•	**SPEC Tracking:** Evitar que los SPECS principales vivan en comentarios sueltos de Linear; deben ser parte del cuerpo principal del issue o de documentos dedicados.
	•	**Bilingual Standard & Quality:** Toda documentación bilingüe debe estructurarse con `VERSION ESPAÑOL` primero y `ENGLISH VERSION` después. Se exige el uso correcto de tildes, puntuación y ortografía en toda documentación escrita en español.

⸻

For Blockchain Changes (`/programs`)

Must update or create:
	•	`/docs/architecture.md`
	•	`/docs/authority-model.md`
	•	`/docs/state-machine.md`
	•	`/docs/threat-model.md`
	•	`/docs/devnet-proof.md`

Documentation must include:
	•	Account architecture
	•	PDA seeds
	•	Authority validation logic
	•	Explicit invariants
	•	Identified attack vectors
	•	Mitigation mapping
	•	Devnet transaction proof (real signature)

⸻

For Frontend/Auth Changes (`/app`)

Must update or create:
	•	`/docs/auth-flow.md`
	•	`/docs/session-model.md`

Must document:
	•	SIWS flow
	•	Nonce lifecycle
	•	Cookie strategy
	•	Replay protection logic
	•	Trust boundaries

⸻

For NFT Features

Must update:
	•	`/docs/nft-spec.md`

Must document:
	•	Mint authority model
	•	Metadata ownership
	•	Royalty model
	•	Collection validation
	•	Devnet mint proof

⸻

For Third-Party Integrations & External Services

Must update or create:
	•	`knowledge/architecture/third-party-integrations.md`
	•	`.env.example`

Must document:
	•	Provider purpose and canonical architecture reference
	•	Environment variables required across client and server
	•	Authorized Redirect URIs, Webhook endpoints, and domains (Development, QA, RC, Production)
	•	Post-update synchronization: must run `pnpm knowledge:index` to update `knowledge/README.md`

⸻

Strict Rule

If documentation is missing or outdated → task incomplete.

⸻

Artifact-First Rule

For non-trivial issue-type-driven work:
	•	Implementation must not start until the governing artifact exists locally.
	•	The artifact is an input to planning, slicing, review, QA, and Linear sync.
	•	If the solution artifact is not decision-complete, implementation remains blocked.
	•	One parent Linear issue owns the full initiative; SPECs are documented inside that same issue instead of creating extra Linear issues by default.

For feature, security, nft, refactor, and epic planning, the canonical track is:
	•	Problem artifact: `/docs/features/feature-<slug>.md`
	•	Solution artifact: `/docs/features/feature-<slug>-implementation.md`

Epic planning remains on the feature-note track unless the epic explicitly uses an RFC workflow, in which case the RFC directory becomes the governing source for the decision record.

For fix, bugfix, and hotfix initiatives, the required artifact pair is:
	•	Problem artifact: `/docs/fixes/fix-<slug>.md`
	•	Solution artifact: `/docs/fixes/fix-<slug>-implementation.md`

Problem/Solution templates are located at:
- [problem-spec-template.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/templates/problem-spec-template.md)
- [solution-spec-template.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/templates/solution-spec-template.md)

Problem artifact must answer:
	•	What problem exists
	•	Why it matters
	•	What outcome is expected
	•	What gaps exist today
	•	What questions remain open

Solution artifact must answer:
	•	How the work will be resolved
	•	What slices and branches will be used
	•	What tests go first
	•	What tooling is required
	•	What gates must pass
	•	What will be synchronized to Linear

Decision-complete rule:
	•	If a material decision is missing from the solution artifact, implementation is blocked.
	•	The missing decision must be documented and resolved before code slices open.

SPEC rule:
	•	For multi-SPEC initiatives, the first SPEC is mandatory and comes before delivery SPECs.
	•	La primera SPEC de la iniciativa debe estar dedicada estrictamente a TDD (diseñar y escribir los tests en fallo / RED).
	•	La última SPEC de la iniciativa debe estar dedicada estrictamente a limpieza y refactorización (Clean Code Audit / refactor-clean).
	•	The first SPEC owns the artifact pair, the atomic SPEC map, the test-plan-first contract, and RFC creation or update when RFC applies.

Linear sync rule:
	•	Linear is updated from the artifact.
	•	The artifact is not reverse-generated from comments or memory.
	•	Linear records branch and acceptance traceability; it is not a technical merge destination.

⸻

Issue-Type Artifacts For Small/Iterative Work

For branch types:
	•	`feature/*`
	•	`bugfix/*`
	•	`fix/*`
	•	`hotfix/*`
	•	`epic/*`
	•	`security/*`
	•	`nft/*`
	•	`refactor/*`

If changes touch product code (`/app`, `/programs`, `/packages`, `/lib`, `/tests`, `/e2e`), the PR must update the required branch-family artifact path:
	•	`feature/*`, `epic/*`, `security/*`, `nft/*`, `refactor/*`:
	•	`/docs/features/*.md`
	•	`fix/*`, `bugfix/*`, `hotfix/*`:
	•	`/docs/fixes/fix-*.md`
	•	`/docs/fixes/fix-*-implementation.md`
	•	Multi-SPEC issue-type-driven flows should keep one accumulated parent artifact pair and update it incrementally across SPECs.

Enforcement:
	•	If qualifying `feature/*`, `epic/*`, `security/*`, `nft/*`, or `refactor/*` changes update no `/docs/features/*.md` file, documentation is considered incomplete.
	•	If qualifying `fix/*`, `bugfix/*`, or `hotfix/*` changes update no problem artifact or no matching solution artifact under `/docs/fixes/`, documentation is considered incomplete.
	•	For single-issue SPEC flows, multiple SPEC branches may update the same parent feature-note file incrementally instead of creating one near-duplicate file per SPEC.
	•	Prefer one accumulated parent artifact pair per parent Linear issue when the SPECs belong to the same initiative.

⸻

RFC Workflow by Epic

Use RFCs to document architecture debate, multi-model review, and final technical decisions for epics/stories with relevant complexity.

Mandatory directory and file convention:
	•	`/docs/rfcs/EPIC-<id>-<slug>/`
	•	`/docs/rfcs/EPIC-<id>-<slug>/README.md`
	•	`/docs/rfcs/EPIC-<id>-<slug>/STORY-<id>-<slug>.md`

Mandatory sections per story RFC:
	•	`Context`
	•	`Proposal`
	•	`Critique`
	•	`Resolution`
	•	`Decision`
	•	`Status`

Allowed status values:
	•	`draft`
	•	`in-review`
	•	`approved`
	•	`implemented`
	•	`rejected`

Enforcement:
	•	Final implementation code must not be produced until `Decision = approved`.
	•	Each RFC must include traceability links to related issue(s), PR(s), and final commit hash(es).
	•	If the initiative uses the SPEC model, the RFC must be created or updated in that first SPEC, not invented later in delivery SPECs.
	•	If naming convention or required sections are missing, documentation is considered incomplete.
	•	`knowledge/rfcs/000-manifest.md` is intentionally blank as a bootstrap scaffold and is excluded from story/epic RFC content requirements.

Automated enforcement in project flow:
	•	`npm run validate` now includes docs governance validation (`scripts/ci/validate-doc-governance.sh`).
	•	`scripts/ci/check-required-docs.sh` validates RFC sync for story branches named with either `epic-<id>-story-<story-id>` or `epic-<id>-story-<epic-id>-<story-id>` when product code is touched:
		•	Story RFC file and EPIC `README.md` must both be updated in the same PR.
		•	Required story sections must exist.
		•	If story status is `implemented`, traceability cannot remain in `TBD` or `pending/open`.
		•	Story status in EPIC Story Index must match story RFC status, ignoring markdown-only wrapping like backticks.
		•	Local preflight includes uncommitted and untracked working-tree changes so docs validation reflects the author’s current edits before commit/PR creation.
