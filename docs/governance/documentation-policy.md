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

Feature Notes for Small/Iterative Work

For branch types:
	•	`feature/*`
	•	`fix/*`
	•	`nft/*`
	•	`refactor/*`

If changes touch product code (`/app`, `/programs`, `/packages`, `/lib`, `/tests`, `/e2e`), the PR must update at least one Markdown file under:
	•	`/docs/features/*.md`

Enforcement:
	•	If no `/docs/features/*.md` file is updated for qualifying changes, documentation is considered incomplete.
	•	For single-issue slice flows, multiple slice branches may update the same parent feature-note file incrementally instead of creating one near-duplicate file per slice.
	•	Prefer one accumulated feature note per parent Linear issue when the slices belong to the same initiative.

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
