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
| E2E browser + wallet QA (frontend/auth flows) | `@frontend-cycle` + `@responsive-qa` with Playwright + Synpress + MCP evidence |
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

This playbook is intentionally only a summary. The canonical source for documentation requirements is:
- `docs/governance/documentation-policy.md`

Enforcement source:
- `scripts/ci/check-required-docs.sh`

Drift-control rules:
- Do not infer looser documentation requirements from `AGENTS.md`.
- Exact required canonical docs, RFC status values, traceability rules, and branch-driven checks are governed by `docs/governance/documentation-policy.md` and the enforcement scripts.
- If `AGENTS.md` and canonical docs differ, update `AGENTS.md` to match the canonical docs instead of treating this file as an alternate policy source.

Operational summary:
- For `/programs`, `/app`, and NFT work, update the canonical docs required by `docs/governance/documentation-policy.md`.
- For qualifying `feature/*`, `fix/*`, `nft/*`, or `refactor/*` branches that touch product code, update at least one `docs/features/*.md`.
- For RFC-governed work, follow the epic/story naming, required sections, allowed statuses, and traceability rules defined in the canonical documentation policy and RFC templates.
- `docs/rfcs/000-manifest.md` is intentionally blank as a scaffold and is not a story/epic RFC artifact.

Strict Rule:
If required documentation is missing, outdated, or fails enforcement → Definition of Done fails.

Feature Notes Rule (small/iterative features):
- For branch types `feature/*`, `fix/*`, `nft/*`, or `refactor/*` that touch product code (`/app`, `/programs`, `/packages`, `/lib`, `/tests`, `/e2e`), update at least one file under `/docs/features/*.md`.
- If missing, Definition of Done fails.

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
	•	`fix/shared-<name>`
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

🔒 PR GOVERNANCE BASELINE (MANDATORY)

Applies to every PR targeting `develop`:
1. Required CI check: `npm run validate` must pass.
2. Required docs check: missing scope docs must block merge (non-mutating docs-sync policy check).
3. Required local preflight before opening PR: `npm run pr:ready` (or `bash ./scripts/ci/pr-ready.sh`).
   - Metadata-first preflight is mandatory for opening PRs:
     - `npm run pr:metadata -- --body-file <file> --scope <scope:*> --type <type:*> --risk <risk:*> [--base develop] [--size-exempt 0|1]`
     - `npm run pr:open -- --title "..." --body-file <file> --scope <scope:*> --type <type:*> --risk <risk:*> [--base develop] [--draft 0|1]`
   - `pr:open` is the canonical command for opening PRs with required metadata and labels.
4. Source of truth for PR policy is mandatory:
   - `docs/governance/pr-policy-source-of-truth.json`
   - Labels, required PR sections, commit pattern, size/branch-age thresholds and exemption labels are defined only there.
   - `AGENTS.md`, local scripts, and CI workflows must reference this file and must not duplicate policy lists.
5. Feature-note section is mandatory for feature/fix/refactor/nft product changes:
   - `Feature Note (/docs/features/*.md)` path must be included in PR body.
6. Automatic release notes policy:
   - Release draft is generated from labels and merged PRs.
   - Semver labels (`semver:major|semver:minor|semver:patch`) drive version bump resolution.
7. Required automation checks in CI:
   - Docs governance check must run and pass (for example `validate-doc-governance`).
   - PR governance check must enforce required labels/template sections and block invalid PR metadata.

If any required governance gate fails, merge is blocked.

⸻

🚨 CONTROLLED EXCEPTIONS POLICY (HOTFIX / INCIDENT)

Scope:
- Only for urgent production incidents or security emergencies.

Mandatory requirements:
1. PR must include `Exception Waiver` section with:
   - reason
   - risk accepted
   - approver(s)
   - expiration date
2. Open follow-up issue/PR to restore full compliance immediately after stabilization.
3. Exception must be time-bounded and auditable.

Non-waivable controls:
- No fake signatures.
- No mocked RPC as final blockchain evidence.
- No skipping on-chain confirmation requirements for final acceptance.

If waiver data is missing or expired, merge is blocked.

⸻

⚙️ AUTOMATION SCRIPTS (QUICK USE)

- `./scripts/docs-sync.sh <scope-list>`
  - Sync/validate required docs and stage them.
  - Example: `./scripts/docs-sync.sh program`
  - Example: `./scripts/docs-sync.sh app,nft`

- `./scripts/full-cycle.sh <scope> <name> "mensaje" [docs]`
  - Runs: start branch → program test stack bootstrap (program/nft) → docs sync → commit → push.
  - Example: `./scripts/full-cycle.sh app initial-ui "initial UI scaffold"`
  - Example: `./scripts/full-cycle.sh program nft-mint "add nft mint flow" program,nft`

- `./scripts/program-test-stack.sh`
  - Ensures Rust test stack for Solana programs in `/programs`:
    - `litesvm`
    - `mollusk-svm`
    - `mollusk-svm-programs-token`
    - `proptest`

- `./scripts/ci/pr-metadata-lint.sh`
  - Validates mandatory PR metadata before opening.
  - Reads all rules from `docs/governance/pr-policy-source-of-truth.json`.

- `./scripts/ci/pr-ready.sh`
  - Local preflight for validate + commits + size + branch-age checks.
  - Reads all rules from `docs/governance/pr-policy-source-of-truth.json`.

- `./scripts/ci/pr-open.sh`
  - Canonical PR-open workflow for `develop`:
    - runs metadata lint
    - runs `npm run pr:ready`
    - pushes branch
    - creates PR and applies mandatory labels via GitHub API

⸻

🧠 GLOBAL NON-NEGOTIABLE RULES
	1.	Always start with concise-planning.
	2.	Always enforce clean-code in every task.
	3.	No task is complete without lint-and-validate (as enforced by Definition of Done).
	4.	No task is complete without verification-before-completion (as enforced by Definition of Done).
	5.	Never merge without production-code-audit (as enforced by Definition of Done).
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
	18.	For frontend/auth stories, Playwright E2E must pass before completion.
	19.	For wallet-connected UI flows, Synpress E2E must pass before completion.
	20.	For critical UI flows, MCP browser evidence (snapshot/screenshot/log) is mandatory.
	21.	Definition of Done is the single completion gate for any task.

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

🧪 E2E TOOLING POLICY (PLAYWRIGHT + SYNPRESS + MCP)

Scope:
- Applies to frontend/auth/wallet flows and any user-critical browser journey.

Mandatory Toolchain:
1. Use `playwright-skill` for E2E design/execution guidance.
2. Run Playwright suite (`npx playwright test` or project-equivalent command).
3. Run Synpress wallet suite (`npx synpress run` or project-equivalent command).
4. Use MCP Playwright tools to capture deterministic evidence for critical flows:
   - `mcp__playwright__browser_snapshot`
   - `mcp__playwright__browser_navigate`
   - `mcp__playwright__browser_click`
   - `mcp__playwright__browser_fill_form`
   - `mcp__playwright__browser_wait_for`
   - `mcp__playwright__browser_take_screenshot`

Strict Rules:
- No mocked wallet provider for wallet E2E.
- No mocked signature validation in UI auth flows.
- If Playwright or Synpress gate fails, Definition of Done fails.

⸻

🌐 DEVNET EXECUTION POLICY (ABSOLUTE)
	1.	Default cluster is devnet.
	2.	Never use localnet.
	3.	Never use simulation as final acceptance evidence.
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
	14.	If RPC fails → stop execution. Do not fallback to simulation for final proof.

Allowed preflight/testing usage (non-acceptance phase only):
- Local deterministic simulation (for example LiteSVM/Mollusk) is allowed for TDD RED/GREEN and debugging.
- Final acceptance still requires real devnet transactions, real signatures, on-chain confirmation, and fetched account state.

⸻

🧩 AUTOMATION MACROS

🔵 @blockchain-cycle
Trigger:
Run @blockchain-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	solana-dev
	3.	metaplex (only when NFT/asset scope applies)
	4.	test-driven-development
	5.	tdd-workflow
	6.	Bootstrap program test stack (`cargo add --dev litesvm mollusk-svm mollusk-svm-programs-token proptest`)
	7.	Deploy program to devnet
	8.	Execute real on-chain transactions
	9.	Confirm transaction signatures
	10.	Fetch and validate real account state
	11.	clean-code
	12.	lint-and-validate
	13.	verification-before-completion
	14.	production-code-audit
	15.	requesting-code-review
	16.	create-pr

Strict Rules
	•	Devnet only
	•	No simulation-only acceptance
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
	7.	playwright-skill
	8.	e2e-testing
	9.	Implement SSR-first architecture
	10.	Wallet interaction in client-only components
	11.	Server-side signature verification
	12.	Run Playwright E2E suite
	13.	Run Synpress wallet E2E suite (if wallet/auth/browser extension flow is in scope)
	14.	Collect MCP browser evidence for critical path
	15.	clean-code
	16.	lint-and-validate
	17.	web-performance-optimization
	18.	verification-before-completion
	19.	requesting-code-review

Strict Rules
	•	No client-side authority validation
	•	No trusting wallet state from frontend
	•	All signatures verified server-side
	•	No mock Phantom provider
	•	No mocked E2E assertions for critical flows
	•	Devnet RPC only

⸻

🟡 @nft-cycle
Trigger:
Run @nft-cycle

Mandatory Execution Order
	1.	concise-planning
	2.	solana-dev
	3.	metaplex
	4.	Design mint authority model
	5.	Define PDA seeds explicitly
	6.	test-driven-development
	7.	Bootstrap program test stack (`cargo add --dev litesvm mollusk-svm mollusk-svm-programs-token proptest`)
	8.	Deploy to devnet
	9.	Execute real mint on devnet
	10.	Validate metadata on-chain
	11.	Validate royalty configuration
	12.	clean-code
	13.	lint-and-validate
	14.	security-audit
	15.	production-code-audit

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

🧠 OFFICIAL SOLANA SKILLS BASELINE (CODEX)

Canonical source:
- https://solana.com/skills
- https://github.com/solana-foundation/solana-dev-skill

Installed official skill packages:
- `solana-dev` (Solana Foundation maintained)
- `metaplex` (Metaplex Foundation maintained)
- `playwright-skill` (browser E2E automation and QA evidence)

Installed locations:
- Codex: `~/.codex/skills/solana-dev`
- Codex: `~/.codex/skills/metaplex`
- Codex: `~/.codex/skills/playwright-skill`

Mandatory usage rule:
1. For any Solana task (wallet, tx, Anchor, Pinocchio, tokens, payments, testing, security), invoke `solana-dev` as the first contextual skill.
2. For Metaplex tasks (Core, Token Metadata, Bubblegum, Candy Machine, Genesis), invoke `metaplex` after `solana-dev`.
3. Keep this playbook as governance. Skills augment implementation guidance but must not bypass governance docs or required macros.
4. If task touches `/programs`, `/app`, or NFT logic, still execute `@blockchain-cycle`, `@frontend-cycle`, and/or `@nft-cycle` as required.
5. For frontend/auth/browser-critical tasks, invoke `playwright-skill` and execute MCP Playwright tooling for verification evidence.
6. Blockchain workflow in Codex is Solana-only: do not invoke Ethereum/EVM-oriented skills (including Solidity/Hardhat/Foundry/ethers/viem/web3.js-EVM toolchains) unless the user explicitly requests cross-chain work.

Official Solana references included via `solana-dev`:
- common errors and solutions
- version compatibility matrix
- confidential transfers
- frontend with framework-kit
- IDL and client code generation
- `@solana/kit` ↔ `@solana/web3.js` interop
- payments and commerce
- programs with Anchor
- programs with Pinocchio
- curated resources
- security checklist
- Surfpool cheatcodes
- Surfpool guide
- testing strategy

⸻

🛰️ SOLANA MCP OPERATIONAL POLICY (`mcp.solana.com`)

Project integration files:
- Claude/Codex project scope: `/.mcp.json`
- Cursor workspace scope: `/.cursor/mcp.json`

Primary endpoint:
- `https://mcp.solana.com/mcp`

When MCP usage is mandatory:
1. Anchor design/API questions (accounts, constraints, CPI, events, IDL patterns).
2. Solana runtime/debugging questions (transaction errors, account model, PDA derivation mistakes, signer/authority mismatches).
3. Token/NFT implementation decisions where current Solana guidance matters.
4. Security-sensitive Solana decisions before final implementation.

Recommended MCP query order:
1. Solana Documentation Search → gather canonical docs context.
2. Ask Solana Anchor Framework Expert → resolve Anchor-specific design details.
3. Solana Expert: Ask For Help → resolve cross-cutting issues (runtime + SDK + architecture).

Required query context (always include):
- Target cluster: `devnet`
- Solana/Anchor versions in use
- Relevant code snippet (minimal reproducible excerpt)
- Exact error logs / transaction signature (when debugging)
- Current expected vs actual behavior

Verification and evidence rule:
1. Summarize key MCP conclusions in the task notes/PR description.
2. Map each conclusion to concrete code/test changes.
3. Validate changes with real devnet execution and project test gates.
4. Never mark complete based only on MCP guidance; implementation proof is mandatory.

Strict safeguards:
- MCP guidance does not override governance docs in `/docs/governance`.
- For conflicts: governance docs + official Solana docs + real devnet behavior take precedence.
- Do not use Ethereum/EVM recommendations unless user explicitly requests cross-chain work.
- If MCP is unavailable, fallback to `solana-dev` skill references and continue with explicit uncertainty notes.

⸻

🛰️ HELIUS MCP OPERATIONAL POLICY (`helius-mcp@latest`)

Project integration files:
- Claude/Codex project scope: `/.mcp.json`
- Cursor workspace scope: `/.cursor/mcp.json`

Server runtime:
- `npx helius-mcp@latest`

Credential and network requirements:
1. `HELIUS_API_KEY` must be configured (or use `setHeliusApiKey` tool).
2. Project policy is devnet-only, so Helius MCP must run on devnet:
   - `HELIUS_NETWORK=devnet` or call `setNetwork` to `devnet` at session start.
3. If network is not devnet, task is blocked until corrected.

When Helius MCP usage is mandatory:
1. DAS/NFT ownership lookups, metadata reads, and asset inventory queries.
2. Enhanced transaction parsing/inspection from real signatures.
3. Webhook/streaming setup or event-delivery debugging.
4. Priority fee, balance, transfer history, and wallet analytics investigations.

Recommended Helius session start sequence:
1. Confirm API key availability (`HELIUS_API_KEY` or `setHeliusApiKey`).
2. Explicitly set/confirm network = `devnet`.
3. Run a lightweight sanity query (`getBalance` / equivalent) before critical actions.

Required Helius query context:
- Target network: `devnet`
- Wallet/account/signature under investigation
- Relevant snippet + observed error/log
- Expected vs actual behavior

Verification and evidence rule:
1. Include Helius tool outputs used for decisions in task notes/PR summary.
2. Record real signatures/accounts used for validation (no placeholders).
3. Cross-check Helius output with on-chain state and project tests.
4. Never complete a task from Helius output alone without repo-level verification.

Strict safeguards:
- Do not run autonomous signup flows unless explicitly requested by user (billing-sensitive).
- No mocked signatures, mocked RPC, or simulated-only conclusions.
- Helius MCP guidance must follow governance docs and devnet execution policy.

⸻

🔥 DEFINITION OF DONE (SINGLE COMPLETION GATE)

Before marking ANY task complete:
	1.	Run clean-code
	2.	Run lint-and-validate
	3.	Run verification-before-completion
	4.	Confirm required docs for the detected impact tier were updated
	5.	Confirm blockchain interaction happened on devnet
	6.	Confirm no mocks were used as final acceptance evidence
	7.	For frontend/auth changes, confirm Playwright E2E passed
	8.	For wallet-connected frontend flows, confirm Synpress E2E passed
	9.	For critical browser flows, confirm MCP evidence was captured

If any fail → task is not complete.
