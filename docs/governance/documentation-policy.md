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
