# Agent Routing & Unified Governance

## Canonical Truth
- `knowledge/governance/documentation-policy.md`
- `knowledge/governance/git-monorepo-policy.md`
- `knowledge/governance/frontend-ui-policy.md`
- `knowledge/governance/nft-policy.md`
- `knowledge/governance/security-quality-policy.md`
- `knowledge/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`
- If this file, `.agents/*`, or repo-local agent skills drift, update the summary to match canonical knowledge docs and scripts. Do not loosen rules here.

## Identity & Stack Alignment
- Primary stack: **Google Antigravity SDK + Gemini Models + Next.js + Solana**.
- Reference policies and workflows under `.agents/policies/` and `.agents/workflows/`.
- **Token Efficiency & Graph Reading**: Prioritize consulting `.agents/graph.json` and OKF indexes before performing recursive file searches or reading full file contents.

## Global Non-Negotiable Rules
1. **Agent Sub-Orchestration**: Always use `invoke_subagent` to delegate complex verifications (QA, Security, Frontend, Solana, Structure) rather than switching personas internally.
2. **Tool Best Practices**: Always use `replace_file_content`, `grep_search`, `read_file`, and native MCP server tools instead of arbitrary bash scripts. Send long-running tasks to the background.
3. **Planning Mode**: Rely on `implementation_plan.md`, `task.md`, and `walkthrough.md` artifacts to track and report progress.
4. **Devnet Only**: NEVER use `localnet`, mocks, or simulated transactions. All blockchain interactions must be real transactions on Devnet.
5. **Clean Code & Monorepo Structure**: No dead code, no implicit `any`, no unclear naming. Never pollute the root directory; enforce directory whitelists.
6. **Wait for Authorization**: NEVER automatically merge Pull Requests or finish a parent branch without explicit user authorization (Human Acceptance).

## Entry Rules
- Start with `planner`.
- When the brief is vague or underspecified, run `pnpm task:init` before branching; it is the canonical bootstrap entrypoint.
- For non-trivial issue-type-driven work, require the governing artifact before implementation and derive the branch family from the Linear issue type chosen in the doc-first phase. Supported families include `feature/*`, `bugfix/*`, `fix/*`, `hotfix/*`, `epic/*`, `security/*`, `nft/*`, and `refactor/*`.
- For new features, require:
  - `knowledge/features/feature-<slug>.md`
  - `knowledge/features/feature-<slug>-implementation.md`
- For new fixes, require:
  - `knowledge/fixes/fix-<slug>.md`
  - `knowledge/fixes/fix-<slug>-implementation.md`
- For multi-SPEC work, require the first SPEC before delivery SPECs.
- Load only the matching `.agents/workflows/*.md` and `.agents/policies/*.md`.

## Workflow Routing
- Solana-related work: prefer Solana Developer MCP tools over model memory. Use `list_sections` first for non-trivial Solana questions, `get_documentation` for canonical source/framework/library docs, and `Solana_Documentation_Search` or `Solana_Expert__Ask_For_Help` for narrow how-to, errors, or API usage.
- Solana program Rust: whenever writing or modifying it, run `program_autofixer`, apply fixes, and repeat until `require_another_tool_call_after_fixing` is false.
- `/programs` or on-chain runtime changes: `.agents/workflows/blockchain-cycle.md`
- `/app`, `components`, auth flows, or browser-critical routes: `.agents/workflows/frontend-cycle.md`
- Motion-driven UX/UI delivery slices must keep Motion 12 (`motion.dev`), current `motion` syntax, and any provider-specific tooling references explicit in the governing artifact.
- Mint, metadata, collection, royalty, or Metaplex scope: `.agents/workflows/nft-cycle.md`
- Release hardening or security-critical rollout: `.agents/workflows/mainnet-hardening.md`
- Explicit `refactor/*` work, clean-code debt slices, or behavior-preserving structural changes: `.agents/workflows/refactor-cycle.md`
- Responsive or critical browser QA: `.agents/workflows/responsive-qa.md`
- `/db`, `lib/db`, persistence repositories, or `scripts/db-*`: choose dominant runtime workflow, then add `qa`, `docs`, and `reviewer`; enforce DB migration gate from `testing-policy`.
- Issue-tracked work uses Linear status automation: `explain-like-socrates` for Socratic clarification and clean-code design contract for delivery slices.

## Agent Specialists (`.agents/agents/*.yaml`)
- `planner`: detect scope, require Linear/artifact preconditions, activate workflows, delegate, aggregate evidence, enforce Definition of Done.
- `solana`: Solana/Anchor/devnet execution, runtime constraints, RPC and account-state proof.
- `frontend`: Next.js App Router, SSR-first boundaries, client-wallet isolation, UI implementation.
- `nft`: mint authority, metadata, collection, royalties, Metaplex-specific invariants.
- `qa`: tests, Playwright, Synpress, MCP/browser evidence, responsive verification.
- `docs`: canonical knowledge sync, feature/fix artifacts, RFC traceability, migration notes.
- `security`: authority, replay, signer, CPI, dependency, and trust-boundary review.
- `reviewer`: explicit clean-code audit, duplication, naming, dead-code, governance, and final completion gate.
- `structure`: monorepo root directory structure, whitelist enforcement, and package boundary guardian.

## Definition of Done
- `pnpm validate`
- Explicit `clean-code` pass completed and any blocking findings are resolved
- Database-backed schema changes: tracked migrations applied, `validate:db` passes
- Required docs updated per `knowledge/governance/documentation-policy.md`
- Required PR/RFC metadata aligns with `knowledge/governance/pr-policy-source-of-truth.json`
- Final `develop` merge has explicit user manual-test approval recorded as `Human Acceptance`
- Blockchain/NFT acceptance: devnet only, real transactions, real signatures, on-chain confirmation

## 🚫 MANDATORY BOOTSTRAP SEQUENCE / PREFLIGHT

**When the user requests to "prepare preflight" or start a new task/SPEC, you MUST execute these steps in order:**

1. **Verify Previous SPEC Completion**: Ask if the current SPEC is fully finished. If yes, execute final commit, run full validation (`pnpm validate`), and merge current SPEC branch into its parent `feature/*` branch.
2. **Branch Creation**: Create the new `SPEC/*` branch strictly originating from the `feature/*` branch. 
3. **Linear Context Fetch**: Fetch issue information from Linear (via MCP). If access fails, report immediately.
4. **Summary & Wait**: Give a brief summary of what the new SPEC entails, ensure branches are prepped, and **HALT**. Wait for developer instructions.
