🌿 GIT GOVERNANCE + MONOREPO POLICY

(MANDATORY – NON-NEGOTIABLE)

⸻

🏗 MONOREPO STRUCTURE

Repository must follow:

/programs        → Anchor programs
/app             → Next.js frontend
/packages        → Shared types / SDK / utils
/tests           → Integration tests
/scripts         → Deploy / automation

Optional:

/infra
/.github

No business logic outside defined boundaries.

⸻

🌿 BRANCH STRATEGY (TRUNK-BASED + PROTECTED MAIN)

Main Rules
	1.	main is protected.
	2.	No direct commits to main.
	3.	All changes go through Pull Request.
	4.	Squash and merge only.
	5.	No merge commits.
	6.	No force push to main.
	7.	All CI checks must pass before merge.

⸻

🧪 STORY TDD WORKFLOW (MANDATORY)

For every story branch (`h1`, `h2`, `h3`, ... and independent stories):
	1.	Start in TDD RED phase: create/update unit tests for the story before implementation.
	2.	Implementation starts only after story tests are defined.
	3.	Before each story commit/PR, run unit tests and quality gates (`npm test` and `npm run validate`, or stack equivalent).
	4.	If unit tests fail or are missing, story is blocked and cannot be marked complete.

⸻

Branch Naming Convention (Scope Required)

feature/program-<name>
feature/app-<name>
feature/shared-<name>
fix/program-<name>
fix/app-<name>
security/program-<issue>
security/app-<issue>
nft/program-<feature>
refactor/<area>

Examples:

feature/program-staking
feature/app-wallet-login
nft/program-collection-mint
security/program-authority-check

⸻

🔄 PATH-AWARE EXECUTION RULE (CRITICAL)

Agent must detect affected folders and automatically invoke proper macro.

If changes touch:
	•	/programs → run @blockchain-cycle
	•	/app → run @frontend-cycle
	•	/packages → run strict shared validation
	•	NFT logic → also run @nft-cycle
	•	Major release → run @mainnet-hardening

If multiple areas are affected → run ALL relevant cycles.

Task is not complete until all relevant cycles succeed.

⸻

📦 SHARED PACKAGE RULES (/packages)

If modifying shared code:
	1.	Strict typing enforced.
	2.	No circular dependencies.
	3.	Must pass full repo type-check.
	4.	Must run:
	•	typescript-expert
	•	clean-code
	•	lint-and-validate
	5.	Version bump required (semver discipline).

⸻

🧪 PR REQUIREMENTS

Before creating PR:
	1.	Run clean-code
	2.	Run lint-and-validate
	3.	Run verification-before-completion
	4.	Run production-code-audit
	5.	Run relevant macro(s) based on path

PR must include:
	•	Clear description
	•	Devnet transaction proof (if blockchain change)
	•	Security impact analysis
	•	Screenshots (if frontend change)

No PR allowed without macro completion.

⸻

🚀 MONOREPO CI POLICY (MANDATORY CHECKS)

Every PR must:
	1.	Build Anchor programs
	2.	Deploy to devnet
	3.	Execute real on-chain tests
	4.	Confirm transaction signatures
	5.	Fetch real devnet state
	6.	Build Next.js app
	7.	Full repo type-check
	8.	Lint entire repo
	9.	Run security scans

If any fails → block merge.

⸻

🏷 RELEASE TAGGING RULE

After merge to main:

Use semantic versioning:

v<major>.<minor>.<patch>

Examples:

v1.0.0
v1.1.0
v1.1.1

No release without:
	•	Passing @mainnet-hardening
	•	Passing full CI
	•	Clean-code validation
