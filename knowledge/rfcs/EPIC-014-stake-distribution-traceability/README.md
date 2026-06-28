# EPIC-014-stake-distribution-traceability

## Metadata
- Epic ID: `EPIC-014`
- Title: `Stake, Distribution, Treasury, Claim, and Traceability`
- Status: `approved`
- Owner: `jaysosa`
- Spec owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-28`

## Scope
- Problem statement: BRIDS needs a system that can answer: "How much should BRIDS send this user for the amount of time they kept eligible assets staked?" The calculation starts from available treasury earnings for a scoped project eligibility window, distributed across the investor pool according to time-weighted eligible participation.
- Business goal: Provide auditable, blockchain-verified distribution of real estate project yields to NFT holders who stake/freeze their assets, with immutable audit trail from freeze events through Squads treasury execution.
- Technical goal: Implement 10-layer architecture (Stake/Unstake Event Layer, Mint Provenance, User Timeline, Project Eligibility Window, Dashboard Projection, Distribution Snapshot, Distribution Calculation, Squads Treasury, Claim Lifecycle, Traceability/Audit) using MPL Core freeze/thaw, Candy Machine as sole financial scope, finalized RPC evidence from archival nodes, deterministic `BigInt` integer math (Largest-Remainder Hamilton method), and chunked Squads v4 batch transfers.
- Out of scope: Collection-based financial scope, custom Anchor notary program, per-NFT economic tiers, multi-Candy Machine tranche merging, floating-point money math, hot wallet payouts.

## Success Criteria
- [ ] Stake/Unstake events recorded on-chain via MPL Core freeze/thaw with canonical RPC reconciliation
- [ ] Project eligibility window defines when stake time creates beneficiary rights
- [ ] Dashboard projections use Helius/webhooks for UI only; never finalize payouts
- [ ] Distribution Snapshot produces evidence package for Final Calculation using finalized RPC from archival nodes
- [ ] Final Calculation reconstructs historical disjoint freeze intervals from blockchain evidence, computes time-weighted wallet weights, allocates with exact integer math using the 2-pass Largest-Remainder (Hamilton) method to prevent dust.
- [ ] Squads multisig controls treasury execution; committee reviews dispersion package before funds move; single batched vault transaction with multiple transfer legs
- [ ] User-initiated Claim with configurable fee, compliance re-check at claim time, batch Squads execution
- [ ] Full audit trail answers: which NFT, which wallet, which Candy Machine, what window, how many seconds, KYC state, treasury source, fee policy, Squads proposal, transaction proof, exceptions
- [ ] Anti-dilution: scope_type=candy_machine, pool_composition_basis=equal_eligible_nft_count, unsold_inventory_policy=exclude_unsold; early investor dilution is intentional reward mechanism (no capital injection)
- [ ] Compliance hold TTL: 12 months max for funds locked due to `restricted_aml` or `suspended` state; automatic clawback to treasury after TTL
- [ ] Archival node requirement: all historical transaction reconstruction for Final Calculation must use Solana archival RPC endpoints with full ledger retention

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
| 2026-06-15 | STORY-014-01 | Created RFC scaffold from KNOW-2026-06-004 draft | jaysosa | #BRI-7 |
| 2026-06-16 | EPIC-014 | Approved epic and implementation slices | Staff Engineer | |
| 2026-06-28 | EPIC-014 | Spec review: resolved 6 blocking items (BigInt, zero-pool, batch chunking, quote expiry, clawback destination, FreezeDelegate alignment) | Staff Engineer | PR #300 |

## Risks and Dependencies
- Risks:
  - Mint transaction pruning by RPC providers breaks Candy Machine provenance reconstruction
  - RPC staleness/slot lag could produce stale evidence for Final Calculation
  - Committee availability blocks treasury execution
  - Compliance state changes between Final Calculation and claim execution
  - Partial failures in Squads batched transactions (due to destination account errors) causing operational gridlock.
  - Retroactive dilution if users can continue to mint from the Candy Machine after the project window has started.
  - Payout wallet override insider threat: an admin maliciously altering the destination wallet for a valid claim.
  - Early investor dilution: planned reward mechanism; no capital injection possible per business model; dilution is expected and accepted.
- Dependencies:
  - Helius MCP for enhanced RPC and webhook indexing
  - **Solana Archival RPC Nodes** (mandatory) to guarantee full historical transaction accessibility for Final Calculation (projects can exceed 12 months).
  - Solana MCP for canonical documentation search
  - Squads v4 for multisig treasury control (batch transfer support via single vault transaction with multiple legs)
  - Metaplex Core for freeze/thaw semantics
  - KYC/AML pipeline for compliance snapshots
- Mitigations:
  - Multi-provider RPC convergence (Helius primary, Alchemy secondary, public fallback) **all must be archival nodes**
  - minContextSlot checkpoint guard for RPC freshness
  - claim_fee_policies versioned and locked at Final Calculation
  - Withheld allocation bucket for non-verified wallets (future design)
  - Freeze mint authority on Candy Machine when project starts to lock the pool denominator.
  - Implement granular `failed` status for individual payout batch items allowing retry queues.
  - Force cryptographic proof (SIWS) from the original beneficiary wallet or formal KYC recovery pipeline to process a payout wallet override.
  - **Early investor dilution explicitly accepted as reward mechanism** — no capital injection, dilution is expected.
  - **Squads v4 batch transfers**: single vault transaction with multiple transfer legs (SOL + SPL) per Squads CLI `initiate_batch_transfer`.
  - **Compliance hold TTL**: 12 months max for `restricted_aml`/`suspended` funds; automatic clawback to treasury after TTL expiry.
  - **Archival node enforcement**: Final Calculation RPC calls must target archival endpoints; reject non-archival responses via `minimumLedgerSlot` check.

## Open Questions
- [ ] Exact RPC freshness threshold: max_slot_lag = 100 slots, max_age = 5000ms — validated under load?
- [ ] Multi-token/multi-vault support in v1 or defer?
- [ ] Withheld allocation bucket for non-verified wallets — scope for v1?
- [ ] Provenance backfill automation vs 3-month manual window
- [ ] Secondary marketplace transfer handling for earning interval splits
- [x] What is the TTL (Time-To-Live) for funds locked due to post-calculation `compliance_hold`? **(Resolved: 12 months, auto-clawback to per-project `TreasuryClawbackReserve`)**
- [x] Archival node provider selection: Helius Archive, Alchemy Archive, or self-hosted? **(Resolved: multi-provider convergence, all three)**
- [x] Squads v4 batch transfer compute unit limits for large payout batches (N recipients)? **(Resolved: `MAX_LEGS_PER_BATCH = 20` per Squads proposal; large distributions produce multiple sequential proposals)**
- [x] Integer overflow risk in monetary arithmetic? **(Resolved: `BigInt` mandate for all intermediate products)**
- [x] Zero pool time weight (nobody staked)? **(Resolved: run transitions to `BLOCKED` with `no_eligible_participation`)**
- [x] Quote expiry for unclaimed fee quotes? **(Resolved: 48-hour TTL, auto-return to `CLAIMABLE`)**
- [x] Clawback fund destination after 12-month TTL? **(Resolved: per-project `TreasuryClawbackReserve`; re-distribution requires new committee-approved run)**
- [x] FreezeDelegate authority strictness? **(Resolved: `Owner` OR `Address` where `address == owner` both qualify)**
- [x] `investmentModel` impact on calculation? **(Resolved: metadata only in v1)**

## Traceability
- Issue(s): BRI-5, BRI-6, BRI-7, BRI-7 (Linear: BRI-7)
- PR(s): TBD
- Final commit hash(es): TBD