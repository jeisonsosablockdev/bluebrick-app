🚀 SOLANA FULLSTACK AGENT PLAYBOOK

Anchor + Next.js + Phantom + Devnet Only + Clean Code Enforced

⸻

📘 GOVERNANCE DOCUMENTS (SOURCE OF TRUTH)

Detailed policies are maintained here:
- [Git + Monorepo Policy](docs/governance/git-monorepo-policy.md)
- [NFT Policy](docs/governance/nft-policy.md)
- [Security + Quality Policy](docs/governance/security-quality-policy.md)
- [Frontend UI Policy](docs/governance/frontend-ui-policy.md)
- [Documentation Policy](docs/governance/documentation-policy.md)

If any conflict exists, governance documents take precedence over summaries.

⸻

🗺 PATH → MANDATORY MACRO (QUICK MAP)

| Path / Scope | Mandatory Macro / Validation |
| --- | --- |
| `/programs` | `@blockchain-cycle` |
| `/app` | `@frontend-cycle` |
| `/packages` | strict shared validation (`typescript-expert` + `clean-code` + `lint-and-validate`) |
| NFT logic (mint/metadata/collection/royalties) | `@nft-cycle` (in addition to path macro) |
| Major release / pre-mainnet | `@mainnet-hardening` |

If multiple scopes are touched, run all relevant macros.

Example (blockchain + NFT + frontend task):
1. Task touches `/programs/nft_mint`, `/app/mint`, and NFT metadata rules.
2. Run `@blockchain-cycle` (because `/programs` changed).
3. Run `@frontend-cycle` (because `/app` changed).
4. Run `@nft-cycle` (because NFT logic changed).
5. Task is complete only when all three cycles pass.

⸻

📖 CONTINUOUS DOCUMENTATION POLICY

Documentation must be created and updated alongside development.
No feature is complete without documentation.

For Blockchain Changes (`/programs`)
- Must update/create:
  - `/docs/architecture.md`
  - `/docs/authority-model.md`
  - `/docs/state-machine.md`
  - `/docs/threat-model.md`
  - `/docs/devnet-proof.md`
- Must document:
  - Account architecture
  - PDA seeds
  - Authority validation logic
  - Explicit invariants
  - Identified attack vectors
  - Mitigation mapping
  - Devnet transaction proof (real signature)

For Frontend/Auth Changes (`/app`)
- Must update/create:
  - `/docs/auth-flow.md`
  - `/docs/session-model.md`
- Must document:
  - SIWS flow
  - Nonce lifecycle
  - Cookie strategy
  - Replay protection logic
  - Trust boundaries

For NFT Features
- Must update:
  - `/docs/nft-spec.md`
- Must document:
  - Mint authority model
  - Metadata ownership
  - Royalty model
  - Collection validation
  - Devnet mint proof

Strict Rule:
If documentation is missing or outdated → task incomplete.

RFC Workflow by Epic (for architecture debate and decisions)
- Scope:
  - Use RFC files for stories/epics that require multi-model discussion, architecture decisions, or significant refactors.
- Mandatory structure:
  - Epic folder: `/docs/rfcs/EPIC-<id>-<slug>/`
  - Epic index: `/docs/rfcs/EPIC-<id>-<slug>/README.md`
  - Story RFC: `/docs/rfcs/EPIC-<id>-<slug>/STORY-<id>-<slug>.md`
- Required sections in each story RFC:
  - `Context`
  - `Proposal`
  - `Critique`
  - `Resolution`
  - `Decision`
  - `Status`
- Allowed `Status` values:
  - `draft`
  - `in-review`
  - `approved`
  - `implemented`
- Enforcement rules:
  - Final implementation code must not be produced until `Decision = approved`.
  - Every RFC must link related issue(s), PR(s), and final commit hash(es).
  - If epic/story naming format is not followed, task is incomplete.

⸻

🌿 BRANCH HANDLING (QUICK GUIDE)

Workflow:
	1.	Create branch from latest `develop`.
	2.	Use scope-based name:
	•	`feature/program-<name>`
	•	`feature/app-<name>`
	•	`feature/shared-<name>`
	•	`fix/program-<name>`
	•	`fix/app-<name>`
	•	`security/program-<issue>`
	•	`security/app-<issue>`
	•	`nft/program-<feature>`
	•	`refactor/<area>`
	3.	Do not commit directly to `develop` or `main`.
	4.	Open Pull Request to `develop` (regular work).
	5.	Only release PRs go from `develop` to `main`.
	6.	Squash and merge only after all checks pass.

`main` is protected: no direct commits, no force push, no merge commits.
`develop` is protected for integration: no direct commits.
Full policy: [Git + Monorepo Policy](docs/governance/git-monorepo-policy.md)

⸻

⚙️ AUTOMATION SCRIPTS (QUICK USE)

- `./scripts/docs-sync.sh <scope-list>`
  - Sync/validate required docs and stage them.
  - Example: `./scripts/docs-sync.sh program`
  - Example: `./scripts/docs-sync.sh app,nft`

- `./scripts/full-cycle.sh <scope> <name> "mensaje" [docs]`
  - Runs: start branch → docs sync → commit → push.
  - Example: `./scripts/full-cycle.sh app initial-ui "initial UI scaffold"`
  - Example: `./scripts/full-cycle.sh program nft-mint "add nft mint flow" program,nft`

⸻

🧠 GLOBAL NON-NEGOTIABLE RULES
	1.	Always start with concise-planning.
	2.	Always enforce clean-code in every task.
	3.	No task is complete without lint-and-validate.
	4.	No task is complete without verification-before-completion.
	5.	Never merge without production-code-audit.
	6.	Prefer server-side logic over client-side logic.
	7.	Never trust client state.
	8.	No duplicated logic.
	9.	No dead code.
	10.	No unclear naming.
	11.	No implicit behavior.
	12.	Refactor before finishing any task.
	13.	Code must be readable before being clever.
	14.	No console logs in production code.
	15.	Explicit error handling required everywhere.
	16.	Every story starts by defining/updating unit tests (TDD RED first).
	17.	No story is complete unless unit tests pass at final verification.

⸻

📱 RESPONSIVE DESIGN POLICY (MANDATORY — DESKTOP + MOBILE)

All frontend work must be responsive and usable on both mobile and desktop.

Requirements:
	1.	Mobile-first layout with progressive enhancement for larger screens.
	2.	Must work at 320px width minimum (small phones).
	3.	No horizontal overflow (no sideways scrolling).
	4.	Use Tailwind responsive utilities: sm, md, lg, xl.
	5.	Touch targets must be accessible: >= 44px height for primary actions.
	6.	Modals must be usable on mobile:
	•	Full width on small screens
	•	Internal scroll if content exceeds viewport height
	•	Close button visible at all times
	7.	Test these viewport widths before marking complete:
	•	320px
	•	375px
	•	768px
	•	1024px
	8.	Provide a short “Responsive QA checklist” result in the PR description.

If UI breaks at any of the widths above → task incomplete.

⸻

🌐 DEVNET EXECUTION POLICY (ABSOLUTE)
	1.	Default cluster is devnet.
	2.	Never use localnet.
	3.	Never simulate transactions.
	4.	Never mock RPC.
	5.	Never stub smart contract calls.
	6.	Never fake transaction signatures.
	7.	Never hardcode balances or fake accounts.
	8.	Never return example transaction hashes.
	9.	Always deploy programs to devnet before testing.
	10.	Always execute real transactions.
	11.	Always confirm transactions on-chain.
	12.	Always fetch real on-chain account state.
	13.	Wallet signatures must be real cryptographic signatures.
	14.	If RPC fails → stop execution. Do not fallback to simulation.

⸻

🧩 AUTOMATION MACROS

🔵 @blockchain-cycle
Trigger:
Run @blockchain-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	architecture-patterns
	3.	blockchain-developer
	4.	test-driven-development
	5.	tdd-workflow
	6.	Deploy program to devnet
	7.	Execute real on-chain transactions
	8.	Confirm transaction signatures
	9.	Fetch and validate real account state
	10.	clean-code
	11.	lint-and-validate
	12.	verification-before-completion
	13.	production-code-audit
	14.	requesting-code-review
	15.	create-pr

Strict Rules
	•	Devnet only
	•	No simulation
	•	No mocked RPC
	•	No fake accounts
	•	No fake signatures
	•	Must return real transaction hashes
	•	Must confirm transactions on-chain

⸻

🟣 @frontend-cycle
Trigger:
Run @frontend-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	react-nextjs-development
	3.	nextjs-app-router-patterns
	4.	frontend-developer
	5.	react-best-practices
	6.	typescript-expert
	7.	Implement SSR-first architecture
	8.	Wallet interaction in client-only components
	9.	Server-side signature verification
	10.	clean-code
	11.	lint-and-validate
	12.	web-performance-optimization
	13.	verification-before-completion
	14.	requesting-code-review

Strict Rules
	•	No client-side authority validation
	•	No trusting wallet state from frontend
	•	All signatures verified server-side
	•	No mock Phantom provider
	•	Devnet RPC only

⸻

🟡 @nft-cycle
Trigger:
Run @nft-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	nft-standards
	3.	blockchain-developer
	4.	Design mint authority model
	5.	Define PDA seeds explicitly
	6.	test-driven-development
	7.	Deploy to devnet
	8.	Execute real mint on devnet
	9.	Validate metadata on-chain
	10.	Validate royalty configuration
	11.	clean-code
	12.	lint-and-validate
	13.	security-audit
	14.	production-code-audit

Strict Rules
	•	Devnet only
	•	Real mint transaction required
	•	Real metadata account verification required
	•	No mocked mint
	•	No fake supply
	•	No unchecked authority

⸻

🔴 @mainnet-hardening
Trigger:
Run @mainnet-hardening

Mandatory Execution Order
	1.	threat-modeling-expert
	2.	threat-mitigation-mapping
	3.	security-audit
	4.	security-auditor
	5.	security-scanning-security-sast
	6.	security-scanning-security-hardening
	7.	security-scanning-security-dependencies
	8.	top-web-vulnerabilities
	9.	production-code-audit
	10.	Authority model validation
	11.	Replay attack validation
	12.	CPI validation
	13.	Dependency audit
	14.	Confirm all tests passed on devnet
	15.	Final clean-code enforcement

Strict Rules
	•	No unchecked signer assumptions
	•	No unsafe CPIs
	•	No floating point arithmetic
	•	No unchecked account constraints
	•	No insecure deserialization
	•	All authority transitions explicitly validated
	•	All replay protections verified
	•	All sessions cryptographically verified

⸻

🟢 @responsive-qa
Trigger:
Run @responsive-qa

Mandatory Checklist
	1.	Validate layout at 320px, 375px, 768px, 1024px.
	2.	Confirm no horizontal overflow at all tested widths.
	3.	Confirm primary actions have touch target height >= 44px.
	4.	Confirm modals are mobile-safe:
	•	Full width on small screens
	•	Internal scroll for long content
	•	Close button always visible
	5.	Attach short “Responsive QA checklist” result in PR description.

Strict Rule
If any viewport fails or checklist is missing in PR → task incomplete.

⸻

🔥 FINAL ENFORCEMENT RULE

Before marking ANY task complete:
	1.	Run clean-code
	2.	Run lint-and-validate
	3.	Run verification-before-completion
	4.	Confirm blockchain interaction happened on devnet
	5.	Confirm no mocks were used

If any fail → task is not complete.
