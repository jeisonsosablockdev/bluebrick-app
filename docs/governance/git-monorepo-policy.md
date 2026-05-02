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

🌿 BRANCH STRATEGY (DEVELOP-FIRST + PROTECTED MAIN)

Main Rules
	1.	main is protected.
	2.	develop is the default integration branch for day-to-day work.
	3.	Parent work branches (`feature/*`, `fix/*`, `security/*`, `refactor/*`, `nft/*`) MUST start from latest `develop`.
	4.	No direct commits to main.
	5.	No direct commits to develop.
	6.	All changes go through Pull Request.
	7.	Direct single-branch work targets `develop`; slice PRs target the parent `*-integration` branch.
	8.	Only release PRs may target `main` (source branch: `develop`).
	9.	Squash and merge only.
	10.	No merge commits.
	11.	No force push to main.
	12.	All CI checks must pass before merge.

GitHub Enforcement (Mandatory)
	1.	Enable Branch Protection for `main`:
	•	Require pull request before merging
	•	Require status checks to pass
	•	Restrict who can push
	•	Disallow force pushes
	•	Disallow deletions
	2.	Enable Branch Protection for `develop`:
	•	Require pull request before merging
	•	Require status checks to pass
	•	Disallow force pushes
	3.	Enable required workflow check:
	•	`.github/workflows/enforce-main-source-branch.yml`
	•	This check blocks any PR to `main` whose source branch is not `develop`.

⸻

🧪 STORY TDD WORKFLOW (MANDATORY)

For every story branch (`h1`, `h2`, `h3`, ... and independent stories):
	1.	Start in TDD RED phase: create/update unit tests for the story before implementation.
	2.	Implementation starts only after story tests are defined.
	3.	Before each story commit/PR, run unit tests and quality gates (`npm test` and `npm run validate`, or stack equivalent).
	4.	If unit tests fail or are missing, story is blocked and cannot be marked complete.

⸻

🧩 SINGLE-ISSUE SLICE PLANNING (MANDATORY FOR NON-TRIVIAL WORK)

Applies to `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work that is expected to:
	•	require more than one logical slice,
	•	require more than one PR before `develop`,
	•	or touch more than one technical area.

Rules
	1.	Use one parent Linear issue as the planning and tracking container.
	2.	Do not create multiple Linear subissues by default.
	3.	The parent issue must contain:
	•	Objective
	•	Scope
	•	Non-goals
	•	Integration branch
	•	Slice plan table
	•	Order of execution
	•	Risks
	•	Completion gate
	4.	Each slice must have one dominant responsibility and one proposed branch.
	5.	Only create separate Linear subissues when multiple owners or cross-team dependencies require independent tracking.

⸻

Branch Naming Convention (Scope Required)

feature/program-<name>
feature/app-<name>
feature/shared-<name>
fix/program-<name>
fix/app-<name>
fix/shared-<name>
security/program-<issue>
security/app-<issue>
security/shared-<issue>
nft/program-<feature>
refactor/program-<name>
refactor/app-<name>
refactor/shared-<name>

Integration branches (same type/scope family as the parent issue):

feature/shared-<name>-bri-<id>-integration
fix/app-<name>-bri-<id>-integration
security/program-<issue>-bri-<id>-integration
refactor/shared-<name>-bri-<id>-integration

Slice branches:

feature/shared-<name>-bri-<id>-s01-<slice-slug>
fix/app-<name>-bri-<id>-s02-<slice-slug>
security/program-<issue>-bri-<id>-s03-<slice-slug>
refactor/shared-<name>-bri-<id>-s04-<slice-slug>

Rules:
	•	Use the lowercase Linear issue key in branch names (example: `bri-149`).
	•	`-sNN-` is the zero-padded slice order from the parent issue Markdown table.
	•	Integration branches start from latest `develop`.
	•	Slice branches start from the parent integration branch, not directly from `develop`.

Examples:

feature/program-staking
feature/app-wallet-login
nft/program-collection-mint
security/program-authority-check
feature/shared-knowledge-promotion-bri-143-integration
feature/shared-knowledge-promotion-bri-143-s01-governance-policy

⸻

🔀 INTEGRATION BRANCH FLOW (MANDATORY WHEN USING SLICES)

	1.	Create the integration branch from latest `develop`.
	2.	Create each slice branch from the integration branch.
	3.	Open slice PRs into the integration branch.
	4.	Merge reviewed slices into the integration branch.
	5.	Open the final integration PR from the integration branch into `develop`.
	6.	Delete the temporary integration branch after the final merge.

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
	•	Issue reference
	•	RFC reference (if applicable)
	•	Risk analysis section
	•	Rollback plan section
	•	Feature note path under `/docs/features/*.md` for small/iterative feature/fix/refactor/nft product changes
	•	For slice PRs, the slice id and parent integration branch reference

No PR allowed without macro completion.

⸻

🔒 INTEGRATION-TARGET PR GATES (MANDATORY)

Every PR targeting a `*-integration` branch must pass:
	1.	`npm run validate`
	2.	Required docs scope check
	3.	Local preflight against the integration branch base (`npm run pr:ready -- --base <integration-branch>`)

Full label/template governance remains mandatory for PRs targeting `develop`.

⸻

🔒 DEVELOP PR GOVERNANCE GATES (MANDATORY)

Every PR targeting `develop` must pass:
	1.	`npm run validate` (mandatory status check)
	2.	Required docs scope check (must fail if mandatory docs for touched scope are missing)
	3.	Commit convention check (`type(scope): summary`)
	4.	Label policy check:
	•	one `scope:*`
	•	one `type:*`
	•	one `risk:*`
	5.	PR body policy check (Issue, RFC, Risks, Rollback Plan, Devnet Proof)
	6.	PR size policy:
	•	Target <= 400 added lines
	•	If larger, split into sequential PRs and use feature flags
	7.	Branch lifetime policy:
	•	Target 1-3 days
	•	Long-lived branches require explicit exception

If any governance gate fails, merge must be blocked.

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

After release PR merge from `develop` to `main`:

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

Release notes policy:
	•	Release notes are generated automatically from merged PR metadata and labels.
	•	Use semantic labels to drive version bump:
	•	`semver:major`
	•	`semver:minor`
	•	`semver:patch`
