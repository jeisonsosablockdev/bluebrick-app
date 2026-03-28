🔴 SECURITY + QUALITY POLICY

⸻

🔴 SECURITY PACK (MANDATORY BEFORE DEPLOY)

Run ALL:
	•	security-audit
	•	security-auditor
	•	threat-modeling-expert
	•	threat-mitigation-mapping
	•	security-scanning-security-sast
	•	security-scanning-security-hardening
	•	security-scanning-security-dependencies
	•	top-web-vulnerabilities
	•	production-code-audit

⸻

🧪 STORY-LEVEL UNIT TEST GATES (MANDATORY)

For every story:
	•	Start with unit tests first (TDD RED) before implementation code.
	•	Keep unit tests updated as acceptance criteria evolve.
	•	Before marking the story complete, run and pass unit tests.
	•	Before commit/PR, run full quality gate (`npm test` + `npm run validate`, or equivalent stack commands).

If tests are missing or failing → story is incomplete.

⸻

🏁 PRE-MAINNET CHECKLIST
	•	All Anchor tests executed on devnet.
	•	All transactions confirmed on-chain.
	•	Authority model verified.
	•	No unchecked accounts.
	•	No unsafe CPIs.
	•	No floating point math.
	•	No unchecked signer assumptions.
	•	All frontend auth verified server-side.
	•	Replay protection validated.
	•	Clean code standards enforced.
	•	No warnings in build output.
	•	Dependencies audited.

⸻

🔐 MONOREPO SECURITY RULES

If change affects /programs:
	•	Validate authority model
	•	Validate signer checks
	•	Validate PDA derivations
	•	Ensure test stack is present in program manifests:
	  `cargo add --dev litesvm mollusk-svm mollusk-svm-programs-token proptest`
	•	No unchecked CPIs
	•	No floating point arithmetic
	•	Must provide real devnet tx proof

If change affects /app:
	•	Server-side signature verification mandatory
	•	Replay protection validated
	•	No client authority trust
	•	Devnet RPC enforced

If change affects NFT logic:
	•	Validate mint authority
	•	Validate update authority
	•	Validate metadata owner
	•	Validate seller fee basis points
	•	Confirm metadata account on devnet

⸻

🧬 DEVELOPMENT PHILOSOPHY
	•	Devnet-first execution.
	•	Zero simulation.
	•	Zero mocks.
	•	Real signatures only.
	•	Clean Code always.
	•	Security before features.
	•	Deterministic state transitions.
	•	Minimal trust surface.
	•	Explicit authority validation.
	•	Refactor continuously.
