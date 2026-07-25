---
type: Feature Spec
title: Rfc EPIC- 014
description: Rfc EPIC- 014 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-7/rfc-epic-014.md
---

# RFC EPIC-014: Stake Distribution Traceability System

## Executive Summary
The BRIDS Stake Distribution Traceability System answers: "How much should BRIDS send this user for the amount of time they kept eligible assets staked?"

## Business Context
- Candy Machine is the ONLY financial scope for v1
- Investment models: fix_flip, fix_hold, real_estate_dev
- Partner risk: developer cannot expand pool beyond approved CM

## 8-Layer Architecture
1. Stake/Unstake Event Layer (MPL Core freeze/thaw)
2. Project Eligibility Window
3. Dashboard Projection Layer
4. Distribution Snapshot Layer (evidence package)
5. Distribution Calculation Layer (time-weighted, integer math)
6. Squads Treasury Layer
7. Claim Lifecycle Layer
8. Traceability/Audit Layer

## Key Data Models
- stake_action_attempts
- user_profile_stake_events
- asset_project_origins
- project_candy_machine_sources
- distribution_runs
- distribution_items
- claim_fee_policies
- distribution_claims
- project_yield_offer_ranges
- distribution_audit_events
- treasury_snapshots
- squads_payout_proposals
- distribution_committee_reviews
- distribution_payout_overrides
- claim_or_payout_events

## The Final Calculation Algorithm
- earning_start_at = max(project_start_at, freeze_confirmed_at)
- earning_end_at = min(project_end_at, unfreeze_confirmed_at ?? project_end_at)
- earning_seconds = max(0, earning_end_at - earning_start_at)
- Sum all freeze intervals per asset (re-freeze adds intervals)
- wallet_time_weight = sum(earning_seconds for all wallet assets)
- pool_time_weight = sum(all wallet_time_weights)
- gross = floor(pool_amount * wallet_time_weight / pool_time_weight)
- Remainder distributed via largest-remainder (Hamilton method):
  1. Primary: largest fractional remainder
  2. Secondary: earliest `first_freeze_confirmed_at` (FIFO - early commitment)
  3. Tertiary: lower wallet address (lexicographic, deterministic fallback)

## RPC Finalization Protocol
- commitment: finalized
- Record context_slot, RPC endpoint, timestamp
- Staleness guard: max_slot_lag = 100 slots, max_age = 5000ms
- Validate freshness before committee review

## State Machines
### Distribution Run
draft -> calculating -> ready_for_review -> approved -> executing -> executed
                                      -> rejected -> draft (recalc)
                                      
### Claim Lifecycle
not_claimable -> claimable -> claim_requested -> fee_quoted -> committee_review -> approved_for_dispersion -> submitted -> executed

## Anti-Dilution Guards
- scope_type = candy_machine (never collection)
- pool_composition_basis = equal_eligible_nft_count
- unsold_inventory_policy = exclude_unsold (time_weight = 0)
- Funding threshold: 70% of CM minted before project starts
- Project starts at funding_threshold_met_at (blockchain time)

## UI Layer Boundaries
- Overview: portfolio summary only
- Portfolio: investment composition by project
- Stake/Unstake: freeze/unfreeze actions only
- Rentas/Yield: claimable balance, fee quote, net claim, projections, Claim button
- History: chronological ledger (stake, unstake, distributions, claims, fees, payouts)

## Implementation Phases
Phase 1: Core Infrastructure (BRI-5, BRI-6)
Phase 2: Distribution Engine (BRI-7)
Phase 3: Treasury & Claims (BRI-8)
Phase 4: UI & Polish

## Open Questions Resolved
- Freeze intervals: summed across re-freeze events (blockchain source of truth)
- NFT transfer: freeze time follows asset, not wallet
- Evidence timing: post-project-end, pre-dispersion
- Unsold inventory: excluded, 100% pool to qualified
- Fee applied: claim layer
- Rejected state: added for audit trail
- Historical fee quotes: in /protected/rentas
- Provenance backfill: manual, 3 months post-project
- Tie-breaking: 1) largest fractional remainder, 2) earliest first_freeze_confirmed_at (FIFO), 3) lower wallet address