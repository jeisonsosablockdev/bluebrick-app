# STORY-014-01-draft

## Metadata
- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-01-draft`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `codex`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-15`

## Context
- Problem: BRIDS needs a system that can answer: "How much should BRIDS send this user for the amount of time they kept eligible assets staked?" The calculation starts from available treasury earnings for a scoped project eligibility window, distributed across the investor pool according to time-weighted eligible participation. If the user kept an eligible NFT frozen during the project's eligible window, the system must determine: how much of that project window counts, what portion of the investor pool the user represented, what scope made the NFT eligible, what distribution pool applies, what fee policy applies, and what net amount the user can claim. The answer must be explainable from real `freeze / unfreeze` actions on Solana, wallet ownership, approved Candy Machine eligibility, collection context, validated profile stake history, project eligibility window, distribution snapshot, user's counted frozen time, investor pool composition, available treasury earnings, min/max project offer, KYC/compliance state, claim fee policy, user-facing projections, treasury availability, Squads approval/execution evidence, and immutable audit logs. The audit question: "Can BRIDS prove why this user was owed this amount, why this fee was applied, and which transaction paid it?"
- Why now: Four related BRIs (BRI-5 stake/unstake, BRI-6 distribution prep, BRI-7 traceability/audit, BRI-8 distribution microservice/claim) require a unified architecture before implementation. Current draft (KNOW-2026-06-004) captures working ideas but lacks RFC governance.
- Constraints:
  - Blockchain truth first, DB projection second
  - Candy Machine is sole financial scope for v1 (never collection)
  - Final Calculation uses finalized RPC evidence only
  - No floating point for money; integer math with Hamilton remainder
  - Squads controls treasury; committee reviews before dispersion
  - User-initiated Claim with configurable fee
  - Compliance triple-gate: KYC verified + AML clear + fully_verified
- Affected paths:
  - `/app/(protected)/stake`, `/app/(protected)/portfolio`, `/app/(protected)/rentas`, `/app/(protected)/history`
  - `/api/protected/stake/*`, `/api/webhooks/helius/stake`
  - `lib/db/` (stake_action_attempts, user_profile_stake_events, asset_project_origins, project_candy_machine_sources, distribution_runs, distribution_items, claim_fee_policies, distribution_claims, project_yield_offer_ranges, distribution_audit_events, treasury_snapshots, squads_payout_proposals, distribution_committee_reviews, distribution_payout_overrides, claim_or_payout_events)
  - `scripts/ci/`, `tests/`

## Proposal
- Approach summary: Consolidate the KNOW-2026-06-004 draft into an RFC with 8-layer architecture. Phase implementation across 4 phases aligned to BRI-5 through BRI-8.
- Technical design:

### 8-Layer Architecture
1. **Stake/Unstake Event Layer** — MPL Core freeze/thaw transactions as source of truth. Helius webhook + canonical RPC reconciliation. UI shows partial state; DB derived state never stronger than on-chain. Tables: `stake_action_attempts`, `user_profile_stake_events`.
2. **Mint Provenance / Project Origin Layer** — `asset_project_origins` links each eligible asset to approved Candy Machine via mint transaction evidence. `project_candy_machine_sources` maps project_id to exactly one approved CM. Collection membership is supporting context only; never financial scope. Provenance captured at mint or reconstructed from transaction history; missing = `needs_review`.
3. **User Timeline Layer** — Informational UI: frozen since, accumulated time, sync status, last tx. Does NOT calculate final payouts.
4. **Project Eligibility Window** — Defines when stake time creates beneficiary rights. `earning_start_at = max(project_start_at, freeze_confirmed_at)`, `earning_end_at = min(project_end_at, unfreeze_confirmed_at ?? project_end_at)`. Only owned-and-frozen time inside window counts.
5. **Dashboard Earning Projection Layer** — UI estimate using current freeze time + developer min/max range. Clear "projection, not guarantee" labeling. Detailed financial surface in `Rentas / Yield`, not `Stake / Unstake`.
6. **Distribution Snapshot Layer** — Evidence package for Final Calculation. Admin chooses: project_id, eligibility window, snapshot_at, scope_type=candy_machine, scope_address, collection_address, authorized_supply, minimum_sold_count, funding_threshold_met_at, unsold_inventory_policy, investment_model, token_mint, treasury_vault, available_treasury_earnings_minor, distribution_pool_amount_minor, pool_composition_basis=equal_eligible_nft_count, RPC commitment=finalized, context_slot, committee review fields. Final Calculation reconstructs historical intervals from blockchain/RPC.
7. **Distribution Calculation Layer** — Time-weighted participation: `asset_earning_seconds = max(0, min(project_end_at, unfreeze_confirmed_at) - max(project_start_at, freeze_confirmed_at))`. `asset_time_weight = 1 * asset_earning_seconds`. `wallet_time_weight = sum(asset_time_weight)`. `pool_time_weight = sum(all wallet_time_weight)`. `wallet_gross_amount = floor(distribution_pool_amount_minor * wallet_time_weight / pool_time_weight)`. Fee applied after gross: `net = gross - fee`. Integer math only.
8. **Squads Treasury Layer** — Deterministic claim/payout evidence from finalized items. Committee reviews dispersion package. User Claim creates request; batched Squads execution. Hot wallet payments forbidden.
9. **Claim Lifecycle Layer** — User Claim button → fee quote → claim_requested → committee_review → approved_for_dispersion → Squads batch → executed. Fee policy: versioned, per project/CM, flat or percentage with caps. Compliance re-check at claim time.
10. **Traceability / Audit Layer** — Immutable audit trail answering 11 minimum questions (NFT, wallet, CM, window, seconds, KYC, treasury, fee, claim request, tx proof, exceptions).

### Key Data Models (new)
- `asset_project_origins`: asset_address, project_id, collection_address, candy_machine_address, candy_guard_address, mint_signature, mint_slot, mint_block_time, minter_wallet, sale_evidence, provenance_source, provenance_status
- `project_candy_machine_sources`: project_id → approved_candy_machine_address
- `claim_fee_policies`: scope_type (global/project/candy_machine), scope_address, token_mint, fee_mode (flat/percentage), flat_fee_minor, percentage_bps, min/max caps, effective_from/to, version
- `distribution_claims`: run_id, distribution_item_id, beneficiary_wallet, payout_wallet, gross/fee/net_minor, claim_fee_policy_id/version, status, compliance snapshot
- `squads_payout_batches` + `squads_payout_batch_items`: project_id, run_id, token_mint, treasury_vault, squads multisig/vault/proposal/batch PDAs, instruction_index, recipient_token_account, amount_minor, transfer_signature, execution_slot, reconciliation

### Resolved Decisions (from draft)
- Freeze intervals: summed across re-freeze events (blockchain source of truth)
- NFT transfer: freeze time follows asset, not wallet
- Evidence timing: post-project-end, pre-dispersion
- Unsold inventory: excluded, 100% pool to qualified
- Fee applied: claim layer (after gross)
- Rejected state added for audit trail
- Historical fee quotes in `/protected/rentas`
- Provenance backfill: manual, 3 months post-project
- Tie-breaking: 1) largest fractional remainder, 2) earliest first_freeze_confirmed_at (FIFO), 3) lower wallet address

### RPC Finalization Protocol
- commitment: finalized
- Record: context_slot, RPC endpoint, timestamp, asset owner, collection, approved CM origin, project id, FreezeDelegate.frozen state
- Staleness guard: max_slot_lag = 100 slots, max_age = 5000ms
- Multi-provider convergence: Helius primary, Alchemy secondary, public fallback
- Block reasons: `rpc_stale`, `provider_divergence`, `history_incomplete`, `evidence_parse_mismatch`

### State Machines
**Distribution Run**: draft → calculating → ready_for_review → approved → executing → executed; rejected → draft (recalc)
**Claim Lifecycle**: not_claimable → claimable → claim_requested → fee_quoted → committee_review → approved_for_dispersion → submitted → executed; failed, canceled, compliance_hold

### Anti-Dilution Guards
- scope_type = candy_machine (never collection)
- pool_composition_basis = equal_eligible_nft_count
- unsold_inventory_policy = exclude_unsold (time_weight = 0)
- Funding threshold: 70% of CM minted before project starts
- Project starts at funding_threshold_met_at (blockchain time)

### UI Layer Boundaries
- Overview: portfolio summary only
- Portfolio: investment composition by project, NFTs per project, approved CM origin
- Stake/Unstake: freeze/unfreeze actions + current actionable state only
- Rentas/Yield: claimable balance, fee quote, net claim, projections, Claim button
- History: chronological ledger (stake, unstake, distributions, claims, fees, payouts)

### Implementation Phases
- Phase 1 (BRI-5, BRI-6): Core Infrastructure — Stake/Unstake events, provenance, profile history
- Phase 2 (BRI-7): Distribution Engine — Snapshot, Final Calculation, RPC protocol
- Phase 3 (BRI-8): Treasury & Claims — Squads, fee policy, claim lifecycle, audit
- Phase 4: UI & Polish

## Critique
- Reviewer(s): TBD
- Critical findings:
  1. 
  2. 
  3. 
- Blocking concerns:

## Resolution
- Final approach after critique:
- Changes accepted:
- Changes rejected (with rationale):

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-06-15`
- Decision owner:
- Approval notes:

## Status
- Current status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Next action: explain-like-socrates pass on spec slice, then open delivery slices
- Exit criteria:
  - [ ] All critical critique points addressed
  - [ ] Decision is `approved`
  - [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests: Final Calculation integer math, remainder distribution, RPC freshness guards, fee policy application, state machine transitions
- Integration tests: Stake/Unstake → reconciliation → profile events → snapshot → calculation → Squads batch → claim reconciliation
- Devnet validation: Real MPL Core freeze/thaw, Candy Machine mint, Squads treasury execution, RPC finalized reads
- Responsive QA: Stake/Unstake action state + sync state separation; Rentas/Yield projection labeling

## Traceability
- Related issue(s): BRI-5, BRI-6, BRI-7, BRI-8 (Linear: BRI-7)
- Related PR(s): TBD
- Final commit hash(es): TBD