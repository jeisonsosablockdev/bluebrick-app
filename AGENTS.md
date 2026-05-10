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
- Load only the matching `.codex/workflows/*.md` and `.codex/policies/*.md`.
- Keep specialist context narrow; do not paste governance text into task prompts.
- When multiple scopes are touched, run every matching workflow and aggregate all gates.

## Workflow Routing
- `/programs` or on-chain runtime changes: `.codex/workflows/blockchain-cycle.md`
- `/app`, `components`, auth flows, or browser-critical routes: `.codex/workflows/frontend-cycle.md`
- Mint, metadata, collection, royalty, or Metaplex scope: `.codex/workflows/nft-cycle.md`
- Release hardening or security-critical rollout: `.codex/workflows/mainnet-hardening.md`
- Responsive or critical browser QA: `.codex/workflows/responsive-qa.md`
- `/packages`, `lib`, `tests`, `e2e`, `scripts`: choose the dominant runtime workflow, then add `reviewer`; add `docs` when canonical docs or feature/RFC traceability move.

## Agent Routing
- `planner`: detect scope, activate workflows, delegate, aggregate evidence, enforce Definition of Done.
- `solana`: Solana/Anchor/devnet execution, runtime constraints, RPC and account-state proof.
- `frontend`: Next.js App Router, SSR-first boundaries, client-wallet isolation, UI implementation.
- `nft`: mint authority, metadata, collection, royalties, Metaplex-specific invariants.
- `qa`: tests, Playwright, Synpress, MCP/browser evidence, responsive verification.
- `docs`: canonical doc sync, feature notes, RFC traceability, migration notes.
- `security`: authority, replay, signer, CPI, dependency, and trust-boundary review.
- `reviewer`: clean-code, duplication, naming, dead-code, governance, and final completion gate.

## Delegation Rules
- Delegate the smallest possible context: changed paths, active workflow, required policies, expected evidence.
- Run independent specialists in parallel only when their write scopes do not overlap.
- `security` joins blockchain, auth, admin, wallet, payment, and other high-trust-surface changes.
- `reviewer` is the final gate and should review findings before completion, not just summarize progress.

## Definition of Done
- `npm run validate`
- Required docs updated per `docs/governance/documentation-policy.md`
- Required PR/RFC metadata still aligns with `docs/governance/pr-policy-source-of-truth.json`
- Frontend/auth critical flows: Playwright passed; Synpress passed when wallet/auth applies; MCP/browser evidence captured when browser-critical
- Blockchain/NFT acceptance: devnet only, real transactions, real signatures, on-chain confirmation, fetched account state, no simulation-only proof
- Final `reviewer` pass finds no unresolved blocking issues
