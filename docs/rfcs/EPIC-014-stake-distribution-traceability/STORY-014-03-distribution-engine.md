# STORY-014-03-distribution-engine

## Metadata
- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-03-distribution-engine`
- Status: `planned`
- Owner: `codex`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-15`
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
  unsoldInventoryPolicy(EXCLUDE_UNSOLD), investmentModel(FIX_FLIP|FIX_HOLD|REAL_ESTATE_DEV)
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
  archivalEndpoints: ["helius-archive", "alchemy-archive", "self-hosted"]
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

  // 5. Integer allocation with Hamilton largest-remainder
  items = []
  FOR wallet, walletTimeWeight IN walletWeights:
    // Compliance check at snapshot
    compliance = GET_COMPLIANCE_SNAPSHOT(wallet, config.snapshotAt)
    IF compliance != FULLY_VERIFIED:
      items.push({wallet, status: "EXCLUDED_COMPLIANCE", reason: compliance})
      CONTINUE

    exactShare = config.distributionPoolAmountMinor * walletTimeWeight / poolTimeWeight
    grossAmountMinor = FLOOR(exactShare)
    remainder = exactShare - grossAmountMinor

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
  sorted = SORT(items, BY remainder DESC, THEN BY firstFreezeAt ASC, THEN BY wallet ASC)
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

## Resolution
- DistributionRun + DistributionItem + DistributionAuditEvent schemas defined
- Final Calculation: provenance filtering → archival RPC interval reconstruction → wallet aggregation → Hamilton integer allocation
- RPC Protocol: multi-endpoint archival, minimumLedgerSlot guard, minContextSlot, contextSlot recording
- Committee package: totals, per-item breakdown, exceptions, RPC evidence
- State machine with committee gate before dispersion

## Decision
- Decision: `pending`
- Decision date: `2026-06-15`
- Decision owner:
- Approval notes:

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
- Property-based: Invariant ΣgrossAmountMinor == distributionPoolAmountMinor
- RPC: minimumLedgerSlot rejection on non-archival endpoints

## Traceability
- Related: BRI-7
- Parent: STORY-014-01-draft
- PR(s): TBD