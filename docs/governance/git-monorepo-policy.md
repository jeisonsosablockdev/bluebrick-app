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
	2.	develop is the default consolidation branch for day-to-day work.
	3.	Direct work branches and Linear initiative branches MUST start from latest `develop`.
	4.	No direct commits to main.
	5.	No direct commits to develop.
	6.	All changes go through Pull Request.
	7.	Direct single-branch work targets `develop`; slice PRs target the Linear initiative branch from the parent Linear issue.
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
	2.	Create the parent issue before starting non-trivial work.
	3.	For initiatives with multiple slices, use the Linear initiative branch from the parent issue `git branch name` field.
	4.	Do not create multiple Linear subissues by default.
	5.	The parent issue must contain:
	•	Objective
	•	Scope
	•	Non-goals
	•	Problem artifact path
	•	Solution artifact path
	•	Linear initiative branch
	•	Spec slice
	•	Slice plan table
	•	Order of execution
	•	Risks
	•	Test plan first
	•	Completion gate
	6.	Each slice must have one dominant responsibility and one proposed branch.
	7.	The first slice in multi-slice work is the spec slice.
	8.	The spec slice is also the documentation slice and MUST use `explain-like-socrates` before finalizing the artifact, slice map, assumptions, and test-plan-first contract.
	9.	Delivery slices open only after the spec slice stabilizes the artifact, slice map, and test-plan-first contract.
	10.	Only create separate Linear subissues when multiple owners or cross-team dependencies require independent tracking.

Artifact-first and spec-slice rule:
	•	Non-trivial feature/fix/security/nft/refactor work starts with an artifact before implementation.
	•	Features and fixes use a problem artifact plus a solution artifact.
	•	If the solution artifact is not decision-complete, code implementation remains blocked.
	•	The documentation/spec slice must record that `explain-like-socrates` was used before delivery slices open.

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

Linear initiative branches (Git branch name stored on the parent Linear issue):

initiative/bri-<id>-<name>

Slice branches:

feature/shared-<name>-bri-<id>-s01-<slice-slug>
fix/app-<name>-bri-<id>-s02-<slice-slug>
security/program-<issue>-bri-<id>-s03-<slice-slug>
refactor/shared-<name>-bri-<id>-s04-<slice-slug>

Rules:
	•	Use the lowercase Linear issue key in branch names (example: `bri-149`).
	•	`-sNN-` is the zero-padded slice order from the parent issue Markdown table.
	•	Linear initiative branches start from latest `develop`.
	•	The Linear initiative branch name must match the parent issue `git branch name` field.
	•	Slice branches start from the Linear initiative branch, not directly from `develop`.

Examples:

feature/program-staking
feature/app-wallet-login
nft/program-collection-mint
security/program-authority-check
initiative/bri-143-knowledge-promotion
feature/shared-knowledge-promotion-bri-143-s01-governance-policy

⸻

🔀 LINEAR INITIATIVE BRANCH FLOW (MANDATORY WHEN USING SLICES)

	1.	Create the Linear initiative branch from latest `develop`.
	2.	Create the spec slice first from the Linear initiative branch.
	3.	In the spec/documentation slice, use `explain-like-socrates` to explain the proposed work and let the user redirect scope before delivery slices open.
	4.	Create each delivery slice from the Linear initiative branch after the spec slice closes the planning contract.
	5.	Open slice PRs into the Linear initiative branch.
	6.	Merge reviewed slices into the Linear initiative branch.
	7.	Open the final initiative PR from the Linear initiative branch into `develop`.
	8.	Stop before merging the final PR to `develop` until the user manually tests and explicitly approves Human Acceptance.
	9.	Delete the temporary Linear initiative branch after the final merge.

⸻

🧍 HUMAN ACCEPTANCE GATE BEFORE DEVELOP (MANDATORY)

Applies to every final PR or merge path targeting `develop`.

Rules
	1.	Automated validation is necessary but not sufficient for the final merge to `develop`.
	2.	After implementation slices, local validation, CI, and final reviewer pass, the agent MUST stop and wait for explicit user manual-test approval.
	3.	The PR body must include `Human Acceptance`.
	4.	The governance check only passes when the Human Acceptance section records `Status: approved`.
	5.	If Human Acceptance is pending, missing, or ambiguous, merge to `develop` is blocked.
	6.	Approval evidence must include who approved, when, what was manually tested, and any accepted residual risk.
	7.	The agent must not enable auto-merge or perform the final merge to `develop` before this approval.
	8.	Linear records traceability and status sync; Linear is not a technical merge destination.

Traceability record must include:
	•	Parent Linear issue
	•	Linear initiative branch
	•	Documentation/spec slice branch
	•	Delivery slice branches and PRs
	•	Validation evidence
	•	Manual test evidence
	•	Human Acceptance approval
	•	Final merge commit or squash commit

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
	•	Human Acceptance section; final PRs into `develop` require `Status: approved`
	•	Feature note path under `/docs/features/*.md` for small/iterative feature/fix/refactor/nft product changes
	•	For slice PRs, the slice id and parent Linear initiative branch reference

No PR allowed without macro completion.

⸻

🔒 LINEAR INITIATIVE-TARGET PR GATES (MANDATORY)

Every PR targeting an `initiative/*` branch must pass:
	1.	`npm run validate`
	2.	Required docs scope check
	3.	Local preflight against the Linear initiative branch base (`npm run pr:ready -- --base <initiative-branch>`)

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
	5.	PR body policy check (Issue, RFC, Risks, Rollback Plan, Devnet Proof, Human Acceptance)
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
	9.	Run DB migration validation against clean Postgres when schema or persistence work is in scope
	10.	Run security scans

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
