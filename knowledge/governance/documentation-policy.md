---
type: Policy
title: Continuous Documentation Policy
description: Mandatory documentation governance for all development work — blockchain, frontend, NFT, and general features
tags: [governance, documentation, policy, required-docs, artifact-first]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/governance/documentation-policy.md
---

📖 CONTINUOUS DOCUMENTATION POLICY

(MANDATORY – NON-NEGOTIABLE)

⸻

Documentation must be created and updated alongside development.

No feature is complete without documentation.

Canonical precedence and drift control:
	•	This file is the canonical documentation policy for the repository.
	•	`AGENTS.md`, guides, helper scripts, and workflow summaries may reference this policy, but must not redefine it with conflicting or looser rules.
	•	The executable enforcement source is `scripts/ci/check-required-docs.sh`.
	•	If a summary drifts from this file, this file and the enforcement scripts govern.

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

Strict Rule

If documentation is missing or outdated → task incomplete.

⸻

Artifact-First Rule

For non-trivial `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work:
	•	Implementation must not start until the governing artifact exists locally.
	•	The artifact is an input to planning, slicing, review, QA, and Linear sync.
	•	If the solution artifact is not decision-complete, implementation remains blocked.

For new feature initiatives, the required artifact pair is:
	•	Problem artifact: `/docs/features/feature-<slug>.md`
	•	Solution artifact: `/docs/features/feature-<slug>-implementation.md`

For new fix initiatives, the required artifact pair is:
	•	Problem artifact: `/docs/fixes/fix-<slug>.md`
	•	Solution artifact: `/docs/fixes/fix-<slug>-implementation.md`

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

Spec slice rule:
	•	For multi-slice initiatives, the spec slice is mandatory and comes before delivery slices.
	•	The spec slice owns the artifact pair, the atomic slice map, the test-plan-first contract, and RFC creation or update when RFC applies.
	•	The spec slice is the documentation slice and must use `explain-like-socrates` before finalizing the artifact pair, assumptions, slice map, and test-plan-first contract.
	•	Delivery slices remain blocked until the Socratic planning result is reflected in the solution artifact.

Linear sync rule:
	•	Linear is updated from the artifact.
	•	The artifact is not reverse-generated from comments or memory.
	•	Linear records branch and acceptance traceability; it is not a technical merge destination.

⸻

Feature And Fix Artifacts For Small/Iterative Work

For branch types:
	•	`feature/*`
	•	`fix/*`
	•	`nft/*`
	•	`refactor/*`

If changes touch product code (`/app`, `/programs`, `/packages`, `/lib`, `/tests`, `/e2e`), the PR must update the required branch-family artifact path:
	•	`feature/*`, `security/*`, `nft/*`, `refactor/*`:
	•	`/docs/features/*.md`
	•	`fix/*`:
	•	`/docs/fixes/fix-*.md`
	•	`/docs/fixes/fix-*-implementation.md`

Enforcement:
	•	If qualifying `feature/*`, `security/*`, `nft/*`, or `refactor/*` changes update no `/docs/features/*.md` file, documentation is considered incomplete.
	•	If qualifying `fix/*` changes update no problem artifact or no matching solution artifact under `/docs/fixes/`, documentation is considered incomplete.
	•	For single-issue slice flows, multiple slice branches may update the same parent feature-note file incrementally instead of creating one near-duplicate file per slice.
	•	Prefer one accumulated parent artifact pair per parent Linear issue when the slices belong to the same initiative.

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
	•	If the initiative uses the spec-slice model, the RFC must be created or updated in that spec slice, not invented later in delivery slices.
	•	If naming convention or required sections are missing, documentation is considered incomplete.
	•	`docs/rfcs/000-manifest.md` is intentionally blank as a bootstrap scaffold and is excluded from story/epic RFC content requirements.

Automated enforcement in project flow:
	•	`npm run validate` now includes docs governance validation (`scripts/ci/validate-doc-governance.sh`).
	•	`scripts/ci/check-required-docs.sh` validates RFC sync for story branches named with either `epic-<id>-story-<story-id>` or `epic-<id>-story-<epic-id>-<story-id>` when product code is touched:
		•	Story RFC file and EPIC `README.md` must both be updated in the same PR.
		•	Required story sections must exist.
		•	If story status is `implemented`, traceability cannot remain in `TBD` or `pending/open`.
		•	Story status in EPIC Story Index must match story RFC status, ignoring markdown-only wrapping like backticks.
		•	Local preflight includes uncommitted and untracked working-tree changes so docs validation reflects the author’s current edits before commit/PR creation.
