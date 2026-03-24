📖 CONTINUOUS DOCUMENTATION POLICY

(MANDATORY – NON-NEGOTIABLE)

⸻

Documentation must be created and updated alongside development.

No feature is complete without documentation.

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

Enforcement:
	•	Final implementation code must not be produced until `Decision = approved`.
	•	Each RFC must include traceability links to related issue(s), PR(s), and final commit hash(es).
	•	If naming convention or required sections are missing, documentation is considered incomplete.
