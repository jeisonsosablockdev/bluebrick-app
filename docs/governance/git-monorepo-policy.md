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
	3.	Direct work branches and parent work branches MUST start from latest `develop`. SPEC branches MUST start from the parent work branch they refine.
	4.	No direct commits to main.
	5.	No direct commits to develop.
	6.	All changes go through Pull Request.
	7.	Direct single-branch work targets `develop`; SPEC PRs target the parent work branch from the same Linear issue.
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

Applies to issue-type-driven work that is expected to:
	•	require more than one logical slice,
	•	require more than one PR before `develop`,
	•	or touch more than one technical area.

The issue type is established in the human-plus-agent documentation phase before any branch is created. The selected issue type determines the parent work branch family, the docs track, and the SPEC map. Do not assume `feature` unless the issue itself was classified that way.

	Rules
		1.	Use one parent Linear issue as the planning and tracking container.
		2.	Create the parent issue before starting non-trivial work.
		3.	For parent work branches with multiple SPECs, use the parent work branch from the parent issue `git branch name` field.
		4.	Do not create multiple Linear subissues by default.
		5.	The parent issue must contain:
		•	Human brief
		•	Objective
		•	Scope
		•	Non-goals
		•	Acceptance criteria
		•	Risks
		•	Open questions
		•	Technical protocol for agents
		•	Problem artifact path
		•	Solution artifact path
		•	Parent work branch
		•	SPEC plan table
		•	Order of execution
		•	Test plan first
		•	Completion gate
		6.	Each SPEC must have one dominant responsibility and one proposed branch.
		7.	The first SPEC in multi-SPEC work is the planning SPEC.
		8.	Later SPECs open only after the previous SPEC stabilizes the artifact, branch map, and test-plan-first contract.
		9.	Only create separate Linear subissues when multiple owners or cross-team dependencies require independent tracking.

Artifact-first and SPEC rule:
	•	Non-trivial issue-type-driven work starts with an artifact before implementation.
	•	Feature, security, nft, refactor, and epic planning use the feature-note track plus the relevant RFC traceability when applicable.
	•	Fix, bugfix, and hotfix planning use a problem artifact plus a solution artifact under `docs/fixes/`.
	•	If the solution artifact is not decision-complete, code implementation remains blocked.
	•	The documentation/spec slice must record that `explain-like-socrates` was used before delivery slices open.

⸻

Branch Naming Convention (Scope Required)

feature/<developer>-<issue>-<name>
bugfix/<developer>-<issue>-<name>
fix/<developer>-<issue>-<name>
hotfix/<developer>-<issue>-<name>
epic/<developer>-<issue>-<name>
security/<developer>-<issue>-<name>
nft/<developer>-<issue>-<name>
refactor/<developer>-<issue>-<name>

Parent work branches (Git branch name stored on the parent Linear issue):

feature/<developer>-<issue>-<name>
fix/czambrano-BRI-171-landing-copy-cleanup
bugfix/czambrano-BRI-172-list-scroll-jump
hotfix/czambrano-BRI-173-login-redirect-fix
epic/czambrano-EPIC-011-admin-collections-console

SPEC branches (created one at a time from the parent work branch):

SPEC/<developer>-<issue>-<spec-slug>

BRIDS SPEC branches for feature issues intentionally split from a main `Feature` branch:

SPEC/<developer>-bri<id>-specNN-<spec-slug>

Example:

SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel

Rules:
	•	Use the lowercase Linear issue key in branch names (example: `bri-149`).
	•	`-sNN-` is the zero-padded slice order from the parent issue Markdown table.
	•	For `SPEC/*` branches, `specNN` is the zero-padded SPEC number from the parent issue body, and the number organizes scope rather than mandatory execution priority.
	•	Linear initiative branches start from latest `develop`.
	•	The Linear initiative branch name must match the parent issue `git branch name` field.
	•	Slice branches start from the Linear initiative branch, not directly from `develop`.
	•	Each completed `SPEC/*` branch must document `SPEC HISTORY` before integration.
	•	For BRIDS SPEC branches, `SPEC MERGE` is the internal merge from `SPEC/*` back into the issue `Feature` branch and does not require a PR.
	•	The Feature branch still requires the project-defined PR before integration into the base branch.

Examples:

feature/czambrano-BRI-149-staking-architecture
feature/<developer>-<issue>-<name>
epic/czambrano-EPIC-011-admin-collections-console
SPEC/<developer>-<issue>-<spec-slug>

⸻

🔀 PARENT WORK BRANCH FLOW (MANDATORY WHEN USING SPECs)

	1.	Create the parent work branch from latest `develop`.
	2.	Create the first SPEC from the parent work branch.
	3.	Create each next SPEC only after the previous SPEC merges into the parent work branch.
	4.	Open SPEC PRs into the parent work branch.
	5.	Merge reviewed SPECs into the parent work branch.
	6.	Open the final parent work branch PR from the parent work branch into `develop`.
	7.	Delete the temporary parent work branch after the final merge.

⸻

🔀 BRIDS SPEC MERGE FLOW (MANDATORY WHEN USING SPEC/* BRANCHES)

VERSION ESPAÑOL

	1.	Confirmar que el desarrollador responsable y el SPEC destino están definidos.
	2.	Actualizar `SPEC HISTORY` en el documento del Feature, el documento del SPEC y el documento de implementación.
	3.	Sincronizar el cuerpo del issue de Linear como fuente principal.
	4.	Ejecutar validaciones razonables según el alcance tocado.
	5.	Revisar `git status` y separar cambios ajenos al SPEC.
	6.	Integrar la rama `SPEC/*` hacia la rama `Feature` del issue.
	7.	Dejar la rama `Feature` lista para continuar con el siguiente SPEC.
	8.	No crear PR para el merge interno `SPEC/*` → `Feature`; el PR corresponde al cierre de la rama `Feature`.

ENGLISH VERSION

	1.	Confirm that the responsible developer and target SPEC are defined.
	2.	Update `SPEC HISTORY` in the Feature document, SPEC document, and implementation document.
	3.	Sync the Linear issue body as the primary source.
	4.	Run reasonable validations for the touched scope.
	5.	Review `git status` and separate changes unrelated to the SPEC.
	6.	Integrate the `SPEC/*` branch into the issue `Feature` branch.
	7.	Leave the `Feature` branch ready for the next SPEC.
	8.	Do not create a PR for the internal `SPEC/*` → `Feature` merge; the PR belongs to the Feature branch closure.

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
	•	Feature note path under `/docs/features/*.md` for small/iterative feature/security/refactor/nft/epic product changes
	•	Fix note path under `/docs/fixes/*.md` for fix/bugfix/hotfix product changes
	•	For SPEC PRs, the SPEC id and parent work branch reference

No PR allowed without macro completion.

⸻

🔒 LINEAR INITIATIVE-TARGET PR GATES (MANDATORY)

Every PR targeting a parent work branch must pass:
	1.	`npm run validate`
	2.	Required docs scope check
	3.	Local preflight against the parent work branch base (`npm run pr:ready -- --base <parent-work-branch>`)

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
