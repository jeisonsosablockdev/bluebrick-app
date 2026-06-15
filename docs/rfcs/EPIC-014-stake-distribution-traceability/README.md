# EPIC-014-stake-distribution-traceability

## Metadata
- Epic ID: `EPIC-014`
- Title: `Stake, Distribution, Treasury, Claim, and Traceability`
- Status: `draft`
- Owner: `codex`
- Spec owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-15`

## Scope
- Problem statement: BRIDS needs a system that can answer: "How much should BRIDS send this user for the amount of time they kept eligible assets staked?" The calculation starts from available treasury earnings for a scoped project eligibility window, distributed across the investor pool according to time-weighted eligible participation.
- Business goal: Provide auditable, blockchain-verified distribution of real estate project yields to NFT holders who stake/freeze their assets, with immutable audit trail from freeze events through Squads treasury execution.
- Technical goal: Implement 8-layer architecture (Stake/Unstake Event Layer, Project Eligibility Window, Dashboard Projection, Distribution Snapshot, Distribution Calculation, Squads Treasury, Claim Lifecycle, Traceability/Audit) using MPL Core freeze/thaw, Candy Machine as sole financial scope, finalized RPC evidence, and deterministic integer math.
- Out of scope: Collection-based financial scope, custom Anchor notary program, per-NFT economic tiers, multi-Candy Machine tranche merging, floating-point money math, hot wallet payouts.

## Success Criteria
- [ ] Stake/Unstake events recorded on-chain via MPL Core freeze/thaw with canonical RPC reconciliation
- [ ] Project eligibility window defines when stake time creates beneficiary rights
- [ ] Dashboard projections use Helius/webhooks for UI only; never finalize payouts
- [ ] Distribution Snapshot produces evidence package for Final Calculation using finalized RPC
- [ ] Final Calculation reconstructs historical freeze intervals from blockchain evidence, computes time-weighted wallet weights, allocates with integer math + Hamilton remainder
- [ ] Squads multisig controls treasury execution; committee reviews dispersion package before funds move
- [ ] User-initiated Claim with configurable fee, compliance re-check at claim time, batch Squads execution
- [ ] Full audit trail answers: which NFT, which wallet, which Candy Machine, what window, how many seconds, KYC state, treasury source, fee policy, Squads proposal, transaction proof, exceptions
- [ ] Anti-dilution: scope_type=candy_machine, pool_composition_basis=equal_eligible_nft_count, unsold_inventory_policy=exclude_unsold

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-014-01 | Draft Specification | `STORY-014-01-draft.md` | `draft` | `TBD` | Consolidated from KNOW-2026-06-004 |
| STORY-014-02 | Core Infrastructure (BRI-5, BRI-6) | `STORY-014-02-core-infrastructure.md` | `planned` | `TBD` | Stake/Unstake events, provenance, profile history |
| STORY-014-03 | Distribution Engine (BRI-7) | `STORY-014-03-distribution-engine.md` | `planned` | `TBD` | Snapshot, Final Calculation, RPC protocol |
| STORY-014-04 | Treasury & Claims (BRI-8) | `STORY-014-04-treasury-claims.md` | `planned` | `TBD` | Squads, fee policy, claim lifecycle, audit |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-06-15 | STORY-014-01 | Created RFC scaffold from KNOW-2026-06-004 draft | codex | #BRI-7 |

## Risks and Dependencies
- Risks:
  - Mint transaction pruning by RPC providers breaks Candy Machine provenance reconstruction
  - RPC staleness/slot lag could produce stale evidence for Final Calculation
  - Committee availability blocks treasury execution
  - Compliance state changes between Final Calculation and claim execution
- Dependencies:
  - Helius MCP for enhanced RPC and webhook indexing
  - Solana MCP for canonical documentation search
  - Squads v4 for multisig treasury control
  - Metaplex Core for freeze/thaw semantics
  - KYC/AML pipeline for compliance snapshots
- Mitigations:
  - Multi-provider RPC convergence (Helius primary, Alchemy secondary, public fallback)
  - minContextSlot checkpoint guard for RPC freshness
  - claim_fee_policies versioned and locked at Final Calculation
  - Withheld allocation bucket for non-verified wallets (future design)

## Open Questions
- [ ] Exact RPC freshness threshold: max_slot_lag = 100 slots, max_age = 5000ms — validated under load?
- [ ] Multi-token/multi-vault support in v1 or defer?
- [ ] Withheld allocation bucket for non-verified wallets — scope for v1?
- [ ] Provenance backfill automation vs 3-month manual window
- [ ] Secondary marketplace transfer handling for earning interval splits

## Traceability
- Issue(s): BRI-5, BRI-6, BRI-7, BRI-7 (Linear: BRI-7)
- PR(s): TBD
- Final commit hash(es): TBD