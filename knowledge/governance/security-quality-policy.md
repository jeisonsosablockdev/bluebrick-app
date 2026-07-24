---
type: Policy
title: Security Quality Policy
description: Security Quality Policy - migrated from knowledge/
tags: [governance]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/governance/security-quality-policy.md
---

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

🗃 DATABASE SCHEMA CHANGE GATE (MANDATORY)

Applies when changes affect:
	•	`/db/migrations`
	•	`/lib/db`
	•	DB-backed repositories, persistence adapters, or SQL assumptions

Rules:
	•	Tracked SQL migrations must exist before DB-backed schema changes are considered complete.
	•	Local development must not depend on remembering manual migration runs; the canonical dev flow must apply tracked migrations automatically when `DATABASE_URL` is configured.
	•	`npm run validate` must include DB migration validation.
	•	PR CI must exercise migration application against a clean Postgres instance.
	•	If tracked migrations are pending on the target database, task completion is blocked until `npm run db:migrate` is applied successfully.

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
	•	Prefer Solana Developer MCP tools over model memory for Solana-specific decisions.
	•	Use `list_sections` first for non-trivial Solana questions, then select the matching documentation source ids or section ids.
	•	Use `get_documentation` for canonical docs on a specific Solana source, framework, library, or ecosystem area.
	•	Use `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to questions, errors, or API usage.
	•	When writing or modifying Solana program Rust, run `program_autofixer` before returning code, apply the fixes, and repeat until `require_another_tool_call_after_fixing` is false.
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
	•	Zero simulation as final blockchain acceptance evidence.
	•	Zero mocked blockchain RPC, signatures, accounts, balances, or on-chain data as final acceptance evidence.
	•	Application-layer mocks remain allowed for non-blockchain tests when they do not replace required devnet execution proof.
	•	Real signatures only.
	•	Clean Code always.
	•	Security before features.
	•	Deterministic state transitions.
	•	Minimal trust surface.
	•	Explicit authority validation.
	•	Refactor continuously.
