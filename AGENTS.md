# Agent Routing

## Canonical Truth
- `knowledge/governance/documentation-policy.md`
- `knowledge/governance/git-monorepo-policy.md`
- `knowledge/governance/frontend-ui-policy.md`
- `knowledge/governance/nft-policy.md`
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`
- If this file, `.codex/*`, `.opencode/*`, or repo-local agent skills drift, update the summary to match canonical knowledge docs and scripts. Do not loosen rules here.

## Runner Scope
- This routing contract is runner-agnostic. It applies to Codex, ChatGPT-backed agents, OpenCode, Nemotron 3, local MCP-backed agents, and any future agent runner operating in this repo.
- Agent names such as `planner`, `docs`, `frontend`, and `reviewer` describe responsibilities, not a single vendor or model provider.
- Model/provider-specific skills may exist under `.codex`, `.opencode`, or `.agents`, but they must defer to this file, `/knowledge`, and executable scripts for governance.
- Prefer provider-neutral prompts and handoffs. Mention OpenAI, ChatGPT, Nemotron, or another model only when a workflow truly depends on provider-specific tooling.

## Entry Rules
- Start with `planner`.
- When the brief is vague or underspecified, run `pnpm task:init` before branching; it is the canonical bootstrap entrypoint, runs preflight, asks for the task shape, and delegates to `git-start.sh` once the branch shape is clear. See the README for usage examples.
- For non-trivial issue-type-driven work, require the governing artifact before implementation and derive the branch family from the Linear issue type chosen in the doc-first phase. Supported families include `feature/*`, `bugfix/*`, `fix/*`, `hotfix/*`, `epic/*`, `security/*`, `nft/*`, and `refactor/*`.
- For new features, require:
  - `knowledge/features/feature-<slug>.md`
  - `knowledge/features/feature-<slug>-implementation.md`
- For new fixes, require:
  - `knowledge/fixes/fix-<slug>.md`
  - `knowledge/fixes/fix-<slug>-implementation.md`
- For multi-SPEC work, require the first SPEC before delivery SPECs.
- Load only the matching `.codex/workflows/*.md` and `.codex/policies/*.md`.
- Keep specialist context narrow; do not paste governance text into task prompts.
- When multiple scopes are touched, run every matching workflow and aggregate all gates.

## Workflow Routing
- Solana-related work: prefer Solana Developer MCP tools over model memory. Use `list_sections` first for non-trivial Solana questions, `get_documentation` for canonical source/framework/library docs, and `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to, errors, or API usage.
- Solana program Rust: whenever writing or modifying it, run `program_autofixer`, apply fixes, and repeat until `require_another_tool_call_after_fixing` is false.
- `/programs` or on-chain runtime changes: `.codex/workflows/blockchain-cycle.md`
- `/app`, `components`, auth flows, or browser-critical routes: `.codex/workflows/frontend-cycle.md`
- Motion-driven UX/UI delivery slices must keep Motion 12 (`motion.dev`), current `motion` syntax, and any provider-specific tooling references explicit in the governing artifact.
- Mint, metadata, collection, royalty, or Metaplex scope: `.codex/workflows/nft-cycle.md`
- Release hardening or security-critical rollout: `.codex/workflows/mainnet-hardening.md`
- Explicit `refactor/*` work, clean-code debt slices, or behavior-preserving structural changes: `.codex/workflows/refactor-cycle.md`
- Responsive or critical browser QA: `.codex/workflows/responsive-qa.md`
- `/db`, `lib/db`, persistence repositories, or `scripts/db-*`: choose the dominant runtime workflow, then add `qa`, `docs`, and `reviewer`; enforce the DB migration gate from `testing-policy`.
- `/packages`, `lib`, `tests`, `e2e`, `scripts`: choose the dominant runtime workflow, then add `reviewer`; add `docs` when canonical docs or feature/RFC traceability move.
- Issue-tracked work uses Linear status automation: `explain-like-socrates` for Socratic clarification and clean-code design contract for delivery slices.

## Agent Routing
- `planner`: detect scope, require Linear/artifact preconditions when applicable, activate workflows, delegate, aggregate evidence, enforce Definition of Done, and block final `develop` merge until Human Acceptance is approved.
- `solana`: Solana/Anchor/devnet execution, runtime constraints, RPC and account-state proof.
- `frontend`: Next.js App Router, SSR-first boundaries, client-wallet isolation, UI implementation.
- `nft`: mint authority, metadata, collection, royalties, Metaplex-specific invariants.
- `qa`: tests, Playwright, Synpress, MCP/browser evidence, responsive verification.
- `docs`: canonical knowledge sync, feature/fix artifacts, RFC traceability, migration notes.
- `security`: authority, replay, signer, CPI, dependency, and trust-boundary review.
- `reviewer`: explicit clean-code audit, duplication, naming, dead-code, governance, and final completion gate. Human Acceptance is a mandatory gate.

## Delegation Rules
- Delegate the smallest possible context: changed paths, active workflow, required policies, expected evidence.
- Run independent specialists in parallel only when their write scopes do not overlap.
- `security` joins blockchain, auth, admin, wallet, payment, and other high-trust-surface changes.
- `reviewer` is the final gate and should run the explicit clean-code pass before completion, not just summarize progress.

## Linear Status Automation
- Start of implementation work syncs the governing issue to `In Progress` when Linear automation is available.
- PR/review handoff syncs the issue to `In Review`.
- Completion after accepted validation and Human Acceptance syncs the issue to `Done`.

## Definition of Done
- `pnpm validate`
- Explicit `clean-code` pass completed and any blocking findings are resolved or consciously documented
- Database-backed schema or persistence changes: tracked migrations applied, no pending tracked migrations, and `validate:db` passes when `DATABASE_URL` is available
- Required docs updated per `knowledge/governance/documentation-policy.md`
- Required PR/RFC metadata still aligns with `knowledge/governance/pr-policy-source-of-truth.json`
- Final `develop` merge has explicit user manual-test approval recorded as `Human Acceptance`
- Frontend/auth critical flows: Playwright passed; Synpress passed when wallet/auth applies; MCP/browser evidence captured when browser-critical
- Blockchain/NFT acceptance: devnet only, real transactions, real signatures, on-chain confirmation, fetched account state, no simulation-only proof
- Final `reviewer` pass finds no unresolved blocking issues

## 🚫 MANDATORY BOOTSTRAP SEQUENCE / PREFLIGHT

**When the user requests to "prepare preflight" or start a new task/SPEC, you MUST execute these steps in order:**

1. **Verify Previous SPEC Completion**: Ask if the current SPEC is fully finished. If yes, execute the final commit, run full validation (`npm run validate`), and merge the current SPEC branch into its parent `feature/*` branch.
2. **Branch Creation**: Create the new `SPEC/*` branch strictly originating from the `feature/*` branch. 
3. **Linear Context Fetch**: Fetch the issue information from Linear (via MCP). If access to Linear fails for any reason, **report the reason immediately** to the developer and propose a fix to regain access before creating the slug.
4. **Summary & Wait**: Give a brief summary of what the new SPEC entails, ensure the branches are prepped, resolve any immediate conflicts, report the current state, and **HALT**. Wait for developer instructions.
   - *CRITICAL*: Do NOT generate or output an implementation plan (either in chat or as a file) unless the developer explicitly requests one. Antigravity will auto-execute file plans, so only create plans on direct demand.

**If you bypass this, STOP and restart from step 1.**
