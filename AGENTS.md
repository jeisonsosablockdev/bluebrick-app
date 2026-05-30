# Codex Routing

## Canonical Truth
- `docs/governance/documentation-policy.md`
- `docs/governance/git-monorepo-policy.md`
- `docs/governance/frontend-ui-policy.md`
- `docs/governance/nft-policy.md`
- `docs/governance/security-quality-policy.md`
- `docs/governance/pr-policy-source-of-truth.json`
- `scripts/ci/check-required-docs.sh`
- If this file or `.codex/*` drifts, update the summary to match canonical docs and scripts. Do not loosen rules here.

## Entry Rules
- Start with `planner`.
- When the brief is vague or underspecified, run `npm run task:init` before branching; it is the canonical bootstrap entrypoint, runs preflight, asks for the task shape, and delegates to `git-start.sh` once the branch shape is clear. See the README for usage examples.
- For non-trivial `feature/*`, `fix/*`, `security/*`, `nft/*`, and `refactor/*` work, require the governing artifact before implementation.
- For new features, require:
  - `docs/features/feature-<slug>.md`
  - `docs/features/feature-<slug>-implementation.md`
- For new fixes, require:
  - `docs/fixes/fix-<slug>.md`
  - `docs/fixes/fix-<slug>-implementation.md`
- For multi-slice work, require the documentation slice before implementation slices.
- Load only the matching `.codex/workflows/*.md` and `.codex/policies/*.md`.
- Keep specialist context narrow; do not paste governance text into task prompts.
- When multiple scopes are touched, run every matching workflow and aggregate all gates.

## Workflow Routing
- `/programs` or on-chain runtime changes: `.codex/workflows/blockchain-cycle.md`
- `/app`, `components`, auth flows, or browser-critical routes: `.codex/workflows/frontend-cycle.md`
  - Motion-driven UX/UI slices must keep Motion 12 (`motion.dev`), current `motion` syntax, and any OpenAI Developers tooling references explicit in the governing artifact.
- Mint, metadata, collection, royalty, or Metaplex scope: `.codex/workflows/nft-cycle.md`
- Release hardening or security-critical rollout: `.codex/workflows/mainnet-hardening.md`
- Responsive or critical browser QA: `.codex/workflows/responsive-qa.md`
- `/db`, `lib/db`, persistence repositories, or `scripts/db-*`: choose the dominant runtime workflow, then add `qa`, `docs`, and `reviewer`; enforce the DB migration gate from `testing-policy`.
- `/packages`, `lib`, `tests`, `e2e`, `scripts`: choose the dominant runtime workflow, then add `reviewer`; add `docs` when canonical docs or feature/RFC traceability move.

## Agent Routing
- `planner`: detect scope, require Linear/artifact preconditions when applicable, activate workflows, delegate, aggregate evidence, enforce Definition of Done.
- `solana`: Solana/Anchor/devnet execution, runtime constraints, RPC and account-state proof.
- `frontend`: Next.js App Router, SSR-first boundaries, client-wallet isolation, UI implementation.
- `nft`: mint authority, metadata, collection, royalties, Metaplex-specific invariants.
- `qa`: tests, Playwright, Synpress, MCP/browser evidence, responsive verification.
- `docs`: canonical doc sync, feature/fix artifacts, RFC traceability, migration notes.
- `security`: authority, replay, signer, CPI, dependency, and trust-boundary review.
- `reviewer`: explicit clean-code audit, duplication, naming, dead-code, governance, and final completion gate.

## Delegation Rules
- Delegate the smallest possible context: changed paths, active workflow, required policies, expected evidence.
- Run independent specialists in parallel only when their write scopes do not overlap.
- `security` joins blockchain, auth, admin, wallet, payment, and other high-trust-surface changes.
- `reviewer` is the final gate and should run the explicit clean-code pass before completion, not just summarize progress.

## Definition of Done
- `npm run validate`
- Explicit `clean-code` pass completed and any blocking findings are resolved or consciously documented
- Database-backed schema or persistence changes: tracked migrations applied, no pending tracked migrations, and `validate:db` passes when `DATABASE_URL` is available
- Required docs updated per `docs/governance/documentation-policy.md`
- Required PR/RFC metadata still aligns with `docs/governance/pr-policy-source-of-truth.json`
- Frontend/auth critical flows: Playwright passed; Synpress passed when wallet/auth applies; MCP/browser evidence captured when browser-critical
- Blockchain/NFT acceptance: devnet only, real transactions, real signatures, on-chain confirmation, fetched account state, no simulation-only proof
- Final `reviewer` pass finds no unresolved blocking issues
