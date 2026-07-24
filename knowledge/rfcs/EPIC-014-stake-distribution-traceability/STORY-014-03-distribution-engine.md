---
type: RFC
title: STORY- 014 03 Distribution Engine
description: STORY- 014 03 Distribution Engine - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-014-stake-distribution-traceability/STORY-014-03-distribution-engine.md
---

# STORY-014-03-distribution-engine

## Metadata
- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-03-distribution-engine`
- Status: `planned`
- Owner: `jaysosa`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-28`
- Parent Story: `STORY-014-01-draft`
- Slice: `S03` (Delivery Slice 2 of 3)

## Context
- Problem: Implement the Distribution Snapshot, Final Calculation, and RPC Finalization Protocol. This is the computational core that determines how much each wallet receives.
- Why now: BRI-7 (Traceability/Audit) requires the distribution engine before Treasury/Claims (S04).
- Constraints:
  - Archival RPC mandatory for all historical queries
  - Integer math only (minor units), Hamilton largest-remainder
  - Candy Machine sole financial scope; collection never financial denominator
  - Committee review required before dispersion
  - Final Calculation reconstructs intervals from blockchain evidence only
- Affected paths: lib/distribution, lib/archival, lib/rpc-finalization, API admin

## Proposal
### Approach Summary
Build the distribution engine: admin configures snapshot parameters → engine reconstructs historical freeze intervals from archival RPC → computes time-weighted wallet weights → allocates with integer math + Hamilton remainder → produces committee-reviewable dispersion package.

### Technical Design

#### 1. Database Schema (Pseudocode)
```
DistributionRun
  id, projectId, snapshotAt
  eligibilityStartAt, eligibilityEndAt
  scopeType(CANDY_MACHINE), scopeAddress (candyMachineAddress), collectionAddress
  authorizedSupply, minimumSoldCount, soldCountAtStart
  unsoldInventoryPolicy(EXCLUDE_UNSOLD),  investmentModel(FIX_FLIP|FIX_HOLD|REAL_ESTATE_DEV)  // metadata only in v1; does not affect calculation
  tokenMint, treasuryVault
  availableTreasuryEarningsMinor, distributionPoolAmountMinor
  poolCompositionBasis(EQUAL_ELIGIBLE_NFT_COUNT)
  finalRpcCommitment(FINALIZED), finalRpcContextSlot, finalRpcSnapshotAt
  status(DRAFT|CALCULATING|READY_FOR_REVIEW|COMMITTEE_REVIEW|COMMITTEE_REJECTED|APPROVED_FOR_DISPERSION|EXECUTING|EXECUTED|FINAL)
  committeeReviewStatus, committeeReviewedAt, committeeApprovalEvidence?
  roundingRemainderMinor, totalPoolTimeWeightSeconds
  createdAt, updatedAt

DistributionItem
  id, runId
  beneficiaryWallet, assetAddress
  earningStartAt, earningEndAt, earningSeconds
  assetTimeWeight (== earningSeconds for v1)
  walletTimeWeight (sum of assetTimeWeight for wallet)
  poolTimeWeight (sum of all walletTimeWeight)
  grossAmountMinor, feeAmountMinor, netAmountMinor
  claimFeePolicyId, claimFeePolicyVersion
  complianceSnapshot (KYC_VERIFIED|AML_CLEAR|FULLY_VERIFIED at snapshot)
  status(PENDING|CALCULATED|COMMITTEE_REVIEWED|APPROVED|CLAIMABLE|CLAIMED|EXPIRED)
  evidenceRefs (RPC reads, tx signatures, slots)
  createdAt, updatedAt

DistributionAuditEvent
  id, runId, eventType, payload, createdAt
  // Immutable log of all calculation steps, RPC calls, committee actions
```

#### 2. Distribution Snapshot Configuration (Pseudocode)
```
SNAPSHOT_CONFIG = {
  projectId,
  eligibilityStartAt, eligibilityEndAt,
  snapshotAt,  // when the "photo" is taken
  scopeType: "candy_machine",
  scopeAddress: approvedCandyMachineAddress,
  collectionAddress,
  authorizedSupply, minimumSoldCount, soldCountAtStart,
  fundingThresholdMetAt,
  unsoldInventoryPolicy: "exclude_unsold",
  investmentModel: "fix_flip" | "fix_hold" | "real_estate_dev",
  tokenMint, treasuryVault,
  availableTreasuryEarningsMinor,
  distributionPoolAmountMinor,
  poolCompositionBasis: "equal_eligible_nft_count",
  archivalEndpoints: ["helius-archive", "alchemy-archive"]
}
```

#### 3. Final Calculation Engine (Pseudocode)
```
CALCULATE_DISTRIBUTION(runId, config):
  run = DB.create(DistributionRun, {status: CALCULATING, ...config})
  LOG_AUDIT(runId, "CALCULATION_STARTED", config)

  // 1. Build eligible asset set from provenance
  eligibleAssets = DB.find(AssetProjectOrigin, {
    projectId: config.projectId,
    provenanceStatus: "VALIDATED"
  })
  // Exclude unsold: only assets with saleEvidence and freeze events
  eligibleAssets = FILTER(eligibleAssets, HAS_SALE_EVIDENCE_AND_FREEZE)

  // 2. For each asset, reconstruct freeze intervals from archival RPC
  assetIntervals = []
  FOR asset IN eligibleAssets:
    intervals = RECONSTRUCT_FREEZE_INTERVALS(
      asset.assetAddress,
      config.eligibilityStartAt,
      config.eligibilityEndAt,
      archivalEndpoints: config.archivalEndpoints
    )
    // intervals = [{frozenAt, thawedAt?, slot, blockTime, txSig}, ...]
    assetIntervals.push({asset, intervals})

  // 3. Validate intervals against project window
  validIntervals = []
  FOR {asset, intervals} IN assetIntervals:
    FOR interval IN intervals:
      start = MAX(config.eligibilityStartAt, interval.frozenAt)
      end = MIN(config.eligibilityEndAt, interval.thawedAt ?? config.eligibilityEndAt)
      IF start < end:
        validIntervals.push({
          assetAddress: asset.assetAddress,
          wallet: interval.wallet,
          projectId: asset.projectId,
          startAt: start,
          endAt: end,
          earningSeconds: end - start,
          evidence: {txSig: interval.txSig, slot: interval.slot, rpcContextSlot: interval.rpcContextSlot}
        })

  // 4. Aggregate by wallet
  walletWeights = {}
  FOR interval IN validIntervals:
    walletWeights[interval.wallet] = walletWeights.get(interval.wallet, 0) + interval.earningSeconds

  poolTimeWeight = SUM(walletWeights.values())

  // 4b. Zero-pool guard — prevent division by zero
  IF poolTimeWeight == 0:
    run.status = BLOCKED
    run.blockedReason = "no_eligible_participation"
    DB.update(run)
    LOG_AUDIT(runId, "CALCULATION_BLOCKED", {reason: "pool_time_weight_is_zero"})
    RETURN run

  // 5. Integer allocation with Hamilton largest-remainder
  items = []
  FOR wallet, walletTimeWeight IN walletWeights:
    // Compliance check at snapshot
    compliance = GET_COMPLIANCE_SNAPSHOT(wallet, config.snapshotAt)
    IF compliance != FULLY_VERIFIED:
      items.push({wallet, status: "EXCLUDED_COMPLIANCE", reason: compliance})
      CONTINUE

    // BigInt arithmetic to prevent overflow on large pools
    // (e.g., 1B USDC × 31.5M seconds > Number.MAX_SAFE_INTEGER)
    exactShare = BigInt(config.distributionPoolAmountMinor) * BigInt(walletTimeWeight) / BigInt(poolTimeWeight)
    grossAmountMinor = Number(exactShare)  // safe after division
    remainder = (config.distributionPoolAmountMinor * walletTimeWeight) % poolTimeWeight  // exact remainder for Hamilton

    items.push({
      wallet,
      walletTimeWeight,
      poolTimeWeight,
      grossAmountMinor,
      remainder,
      feeAmountMinor: 0,  // applied at claim layer
      netAmountMinor: grossAmountMinor,
      complianceSnapshot: compliance
    })

  // 6. Hamilton remainder distribution
  remainderTotal = config.distributionPoolAmountMinor - SUM(i.grossAmountMinor for i in items if i.status != EXCLUDED)
  // Sort by the 3-level tie-breaking rule for deterministic distribution
  // 1. Largest fractional remainder DESC
  // 2. Earliest first_freeze_confirmed_at for the wallet (FIFO) ASC
  // 3. Wallet address lexicographically ASC
  sorted = SORT(items, BY remainder DESC, THEN BY wallet.firstFreezeAt ASC, THEN BY wallet.address ASC)
  FOR i = 0 to remainderTotal - 1:
    sorted[i].grossAmountMinor += 1
    sorted[i].netAmountMinor += 1

  // 7. Persist DistributionItems
  FOR item IN items:
    IF item.status != EXCLUDED_COMPLIANCE:
      DB.create(DistributionItem, {runId, ...item, status: CALCULATED})

  // 8. Update run
  run.totalPoolTimeWeightSeconds = poolTimeWeight
  run.roundingRemainderMinor = 0  // should be 0 after Hamilton
  run.status = READY_FOR_REVIEW
  DB.update(run)

  LOG_AUDIT(runId, "CALCULATION_COMPLETE", {itemCount: items.length, poolTimeWeight})
  RETURN run

RECONSTRUCT_FREEZE_INTERVALS(assetAddress, windowStart, windowEnd, archivalEndpoints):
  // Get all signatures for asset within extended window (buffer for edge cases)
  signatures = archivalEndpoints[0].getSignaturesForAddress(assetAddress, 
    beforeSlot: SLOT_AT(windowEnd), untilSlot: SLOT_AT(windowStart))

  intervals = []
  FOR sig IN signatures:
    tx = GET_TRANSACTION_ARCHIVAL(sig.signature, archivalEndpoints)
    IF !tx OR tx.meta.err: CONTINUE

    freezeEvent = PARSE_FREEZE_THAW(tx)
    IF !freezeEvent OR freezeEvent.assetAddress != assetAddress: CONTINUE

    intervals.push({
      wallet: freezeEvent.wallet,
      frozenAt: freezeEvent.blockTime,
      thawedAt: freezeEvent.eventType == THAWED ? freezeEvent.blockTime : null,
      txSig: sig.signature,
      slot: sig.slot,
      rpcContextSlot: sig.rpcContextSlot  // from archival endpoint response
    })

  // Sort by time, merge if needed (re-freeze after thaw creates new interval)
  RETURN SORT_AND_MERGE(intervals)
```

#### 4. RPC Finalization Protocol (Pseudocode)
```
ARCHIVAL_RPC_GET_TRANSACTION(signature, requiredSlot?):
  FOR endpoint IN archivalEndpoints ORDER BY primary:
    minSlot = endpoint.minimumLedgerSlot()
    IF requiredSlot AND minSlot > requiredSlot: CONTINUE  // not archival enough
    TRY:
      tx = endpoint.getTransaction(signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion: 0,
        minContextSlot: requiredSlot
      })
      IF tx:
        RETURN {tx, endpoint: endpoint.name, contextSlot: tx.context.slot}
    CATCH: CONTINUE
  RETURN NULL

GET_BLOCK_TIME_SAFE(slot, archivalEndpoints):
  // Use getBlockTime with fallback; record endpoint used
  FOR endpoint IN archivalEndpoints:
    TRY: RETURN endpoint.getBlockTime(slot)
    CATCH: CONTINUE
  RETURN NULL

VALIDATE_FINALIZATION(runId):
  run = DB.find(DistributionRun, runId)
  // Verify all RPC calls used finalized commitment
  // Verify contextSlot >= run.finalRpcContextSlot
  // Verify minimumLedgerSlot <= run.eligibilityStartSlot
  // Log any discrepancies as audit events
```

#### 5. Committee Review Package (Pseudocode)
```
GENERATE_DISPERSION_PACKAGE(runId):
  run = DB.find(DistributionRun, runId)
  items = DB.find(DistributionItem, {runId, status: CALCULATED})

  package = {
    run: {id: run.id, projectId, eligibilityWindow, snapshotAt, poolAmount},
    scope: {type: "candy_machine", address: run.scopeAddress, collection: run.collectionAddress},
    totals: {
      totalItems: items.length,
      totalGrossMinor: SUM(i.grossAmountMinor),
      totalNetMinor: SUM(i.netAmountMinor),
      roundingRemainderMinor: run.roundingRemainderMinor,
      poolTimeWeightSeconds: run.totalPoolTimeWeightSeconds
    },
    items: MAP(items, i => ({
      wallet: i.beneficiaryWallet,
      asset: i.assetAddress,
      earningSeconds: i.earningSeconds,
      grossMinor: i.grossAmountMinor,
      netMinor: i.netAmountMinor,
      compliance: i.complianceSnapshot,
      evidence: i.evidenceRefs
    })),
    exceptions: FILTER(items, i => i.status == EXCLUDED_COMPLIANCE),
    rpcEvidence: {
      endpointsUsed: UNIQUE(i.evidenceRefs.endpoint),
      minContextSlot: run.finalRpcContextSlot,
      snapshotAt: run.finalRpcSnapshotAt
    }
  }
  RETURN package
```

#### 6. State Transitions (Pseudocode)
```
DISTRIBUTION_RUN_STATES:
  DRAFT → CALCULATING → READY_FOR_REVIEW → COMMITTEE_REVIEW
    → COMMITTEE_REJECTED → DRAFT (recalc)
    → APPROVED_FOR_DISPERSION → EXECUTING → EXECUTED → FINAL

COMMITTEE_ACTIONS:
  REVIEW(package): status = COMMITTEE_REVIEW
  REJECT(reason): status = COMMITTEE_REJECTED; audit.log(reason)
  APPROVE(approvalEvidence): status = APPROVED_FOR_DISPERSION; store evidence
```

## Spec Breakdown

> This story already satisfies SRP (single responsibility: "calculate the distribution"). These specs decompose the internal pipeline into ordered delivery units to enforce disciplined development.

---

### SPEC-S03-A: Distribution Snapshot & Eligible Asset Resolution

- **Single Responsibility**: Configure the snapshot parameters and resolve the set of eligible assets from provenance data.
- **Scope**:
  - Tables: `distribution_runs` (DRAFT creation only)
  - Paths: `lib/distribution/snapshot.ts`, `api/admin/distribution/*`
  - Pseudocode sections: §1 (DistributionRun schema — creation only), §2 (Snapshot Configuration)
- **Inputs**: Admin-provided snapshot config (projectId, eligibility window, scope, treasury amounts)
- **Outputs**: `DistributionRun` in DRAFT status; resolved list of eligible `AssetProjectOrigin` records with `provenanceStatus: VALIDATED`
- **Dependencies**: SPEC-S02-B (provenance registry must be populated), SPEC-S02-C (archival endpoints configured)
- **Exit Criteria**:
  - [ ] Admin can create a `DistributionRun` with all required snapshot fields
  - [ ] Eligible asset filtering correctly excludes `NEEDS_REVIEW` and `REJECTED` provenance
  - [ ] Unsold inventory excluded per `unsold_inventory_policy`
  - [ ] `investmentModel` stored as metadata (no calculation impact verified)
  - [ ] Validation rejects runs where `distributionPoolAmountMinor > availableTreasuryEarningsMinor`

---

### SPEC-S03-B: Interval Reconstruction & Hamilton Calculation

- **Single Responsibility**: Reconstruct historical freeze intervals from archival RPC and compute time-weighted allocation using BigInt Hamilton method.
- **Scope**:
  - Tables: `distribution_items`, `distribution_audit_events`
  - Paths: `lib/distribution/calculation.ts`, `lib/distribution/hamilton.ts`, `lib/distribution/intervals.ts`
  - Pseudocode sections: §3 (Final Calculation Engine — steps 2-7), §4 (RPC Finalization Protocol)
- **Inputs**: Eligible asset set from SPEC-S03-A; archival RPC endpoints; compliance snapshots
- **Outputs**: `DistributionItem` records with `grossAmountMinor`, `walletTimeWeight`, `earningSeconds`; run transitions to `READY_FOR_REVIEW`
- **Dependencies**: SPEC-S03-A (eligible assets resolved), SPEC-S02-C (archival RPC client)
- **Exit Criteria**:
  - [ ] `BigInt` arithmetic used for all intermediate products — no `Number` overflow
  - [ ] Zero-pool guard: `pool_time_weight == 0` → run transitions to `BLOCKED`
  - [ ] Hamilton remainder: `Σ grossAmountMinor == distributionPoolAmountMinor` (property-based test)
  - [ ] 3-level tie-breaking deterministic: remainder DESC → first_freeze_at ASC → wallet ASC
  - [ ] Disjoint intervals across re-freeze events correctly summed per asset
  - [ ] Transfer mid-window gap: no wallet earns during ownership gap
  - [ ] `EXCLUDED_COMPLIANCE` items logged but not allocated
  - [ ] All RPC calls use `commitment: finalized` + `minContextSlot` guard

---

### SPEC-S03-C: Committee Review Package & State Machine

- **Single Responsibility**: Generate the dispersion package for committee review and enforce the state machine transitions.
- **Scope**:
  - Tables: `distribution_runs` (status transitions), `distribution_audit_events`
  - Paths: `lib/distribution/committee.ts`, `lib/distribution/state-machine.ts`
  - Pseudocode sections: §5 (Committee Review Package), §6 (State Transitions)
- **Inputs**: Calculated `DistributionRun` in `READY_FOR_REVIEW` status
- **Outputs**: Structured dispersion package (JSON) with totals, per-item breakdown, exceptions, RPC evidence; run transitions through committee gates
- **Dependencies**: SPEC-S03-B (calculation must be complete)
- **Exit Criteria**:
  - [ ] Committee package includes: totals, per-item breakdown, compliance exceptions, RPC evidence
  - [ ] State machine enforces: `DRAFT → CALCULATING → READY_FOR_REVIEW → COMMITTEE_REVIEW → APPROVED_FOR_DISPERSION`
  - [ ] `COMMITTEE_REJECTED → DRAFT` recalculation path works
  - [ ] Single-wallet concentration flagged in committee package
  - [ ] Audit events logged for every state transition

---

### Spec Dependency Order

```
SPEC-S03-A  (Snapshot & Asset Resolution)     ← build first
    └── SPEC-S03-B  (Intervals & Hamilton)    ← requires S03-A
        └── SPEC-S03-C  (Committee Package)   ← requires S03-B
```

> [!NOTE]
> These specs are sequential — each depends on the previous. They cannot be parallelized, but they can be delivered and reviewed as independent PRs.

---

## Resolution
- DistributionRun + DistributionItem + DistributionAuditEvent schemas defined
- Final Calculation: provenance filtering → archival RPC interval reconstruction → wallet aggregation → Hamilton integer allocation
- RPC Protocol: multi-endpoint archival, minimumLedgerSlot guard, minContextSlot, contextSlot recording
- Committee package: totals, per-item breakdown, exceptions, RPC evidence
- State machine with committee gate before dispersion

## Decision
- Decision: `approved`
- Decision date: `2026-06-16`
- Decision owner: Staff Engineer
- Approval notes: Deterministic tie-breaking rules for the Largest-Remainder (Hamilton) method are mathematically sound.

## Status
- Current status: `planned`
- Next action: Open delivery slice branch
- Exit criteria:
  - [ ] Calculation engine passes unit tests (Hamilton math, edge cases)
  - [ ] Archival RPC integration works with Helius/Alchemy archive
  - [ ] Committee package generation verified
  - [ ] State transitions enforce committee review

## Test and Validation Plan
- Unit: Hamilton allocation with various pool sizes, remainder edge cases
- Integration: Full calculation on devnet test data
- Property-based: Invariant ΣgrossAmountMinor == distributionPoolAmountMinor; BigInt arithmetic never truncates
- Edge: pool_time_weight == 0 → BLOCKED state transition
- RPC: minimumLedgerSlot rejection on non-archival endpoints

## Traceability
- Related: BRI-7
- Parent: STORY-014-01-draft
- PR(s): TBD