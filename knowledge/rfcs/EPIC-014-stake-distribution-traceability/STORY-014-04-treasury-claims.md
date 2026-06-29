# STORY-014-04-treasury-claims

## Metadata
- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-04-treasury-claims`
- Status: `planned`
- Owner: `jaysosa`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-28`
- Parent Story: `STORY-014-01-draft`
- Slice: `S04` (Delivery Slice 3 of 3)

## Context
- Problem: Implement Squads v4 treasury execution, claim lifecycle with fee policy, compliance hold TTL, and audit trail. This is the money-movement layer.
- Why now: BRI-8 (Distribution microservice & Claim/Payout) requires this layer after Distribution Engine (S03).
- Constraints:
  - Hot wallet payments forbidden; Squads multisig controls treasury
  - Single batched vault transaction with multiple legs (Squads v4 `initiate_batch_transfer`), capped at `MAX_LEGS_PER_BATCH = 20` per proposal to stay within CU limits
  - Fee applied at claim layer (after gross); versioned, per project/CM
  - Compliance re-check at claim time; `restricted_aml`/`suspended` blocked at gate
  - Compliance hold TTL: 12 months max → auto-clawback to treasury
  - Individual claim failure in batch does not stop others (granular `failed` status)
- Affected paths: lib/squads, lib/claims, API claims, Squads proposals, UI Rentas/Yield

## Proposal
### Approach Summary
Build claim lifecycle: user requests claim → fee quote locked → compliance re-check → committee review → Squads batch proposal → execution → reconciliation. Implement fee policies, compliance TTL, and audit trail.

### Technical Design

#### 1. Database Schema (Pseudocode)
```
ClaimFeePolicy
  id, scopeType(GLOBAL|PROJECT|CANDY_MACHINE), scopeAddress
  tokenMint, feeMode(FLAT|PERCENTAGE), flatFeeMinor, percentageBps
  minFeeMinor?, maxFeeMinor?
  effectiveFrom, effectiveTo, version
  createdBy, createdAt

DistributionClaim
  id, runId, distributionItemId
  beneficiaryWallet, payoutWallet (defaults to beneficiary)
  payoutWalletSource(BENEFICIARY|COMMITTEE_OVERRIDE), payoutWalletOverrideId?
  grossAmountMinor, feeAmountMinor, netAmountMinor
  claimFeePolicyId, claimFeePolicyVersion
  status(NOT_CLAIMABLE|CLAIMABLE|QUOTE_CREATED|CLAIM_REQUESTED|QUEUED_FOR_PAYOUT|
         SQUADS_PROPOSED|APPROVED_FOR_EXECUTION|EXECUTED|FAILED|CANCELED|COMPLIANCE_HOLD|
         COMPLIANCE_HOLD_EXPIRED|CLAWED_BACK)
  quoteCreatedAt, claimRequestedAt, queuedAt, proposedAt, executedAt, failedAt
  complianceSnapshot (KYC|AML|FULLY_VERIFIED at claim time)
  createdAt, updatedAt

SquadsPayoutBatch
  id, projectId, runId, tokenMint, treasuryVault
  squadsMultisigPda, squadsVaultPda, proposalPda, batchPda
  transactionIndex, status(DRAFT|PROPOSED|APPROVING|APPROVED|EXECUTING|EXECUTED|PARTIALLY_FAILED|FAILED)
  totalAmountMinor, totalFeesMinor, itemCount, successfulCount, failedCount
  creator, approvers[], executor, executionSignature?, executionSlot?, executionBlockTime?
  createdAt, updatedAt

SquadsPayoutBatchItem
  id, batchId, claimId, instructionIndex
  recipientTokenAccount, amountMinor
  transferSignature?, executionSlot?, executionBlockTime?
  status(PENDING|EXECUTED|FAILED), failureReason?
  createdAt, updatedAt

ClaimFeePolicyOverride (exceptional payout wallet change)
  id, runId, beneficiaryWallet, requestedPayoutWallet, requestReason, evidenceUri
  requestedByUserAt, committeeStatus(PENDING|APPROVED|REJECTED), committeeDecisionAt, committeeEvidence
```

#### 2. Fee Calculation (Pseudocode)
```
CALCULATE_CLAIM_FEE(grossAmountMinor, policy):
  IF policy.feeMode == FLAT:
    rawFeeMinor = policy.flatFeeMinor
  ELSE IF policy.feeMode == PERCENTAGE:
    rawFeeMinor = FLOOR(grossAmountMinor * policy.percentageBps / 10000)

  // Apply caps
  IF policy.minFeeMinor AND rawFeeMinor < policy.minFeeMinor:
    rawFeeMinor = policy.minFeeMinor
  IF policy.maxFeeMinor AND rawFeeMinor > policy.maxFeeMinor:
    rawFeeMinor = policy.maxFeeMinor

  // Fee cannot exceed gross
  feeAmountMinor = MIN(rawFeeMinor, grossAmountMinor)
  netAmountMinor = grossAmountMinor - feeAmountMinor

  RETURN {feeAmountMinor, netAmountMinor}

GET_ACTIVE_FEE_POLICY(projectId, candyMachineAddress, tokenMint, timestamp):
  // Priority: candy_machine > project > global
  FOR scope IN [candy_machine, project, global]:
    policy = DB.find(ClaimFeePolicy, {
      scopeType: scope,
      scopeAddress: scope == candy_machine ? candyMachineAddress : 
                    scope == project ? projectId : "global",
      tokenMint,
      effectiveFrom <= timestamp,
      effectiveTo >= timestamp,
      status: ACTIVE
    })
    IF policy: RETURN policy
  RETURN DEFAULT_POLICY
```

#### 3. Claim Lifecycle (Pseudocode)
```
CLAIM_FLOW(wallet, runId):
  // 0. Concurrent claim guard — advisory lock prevents duplicate quotes
  ACQUIRE_ADVISORY_LOCK(wallet, runId)
  
  // 1. Validate claimable
  items = DB.find(DistributionItem, {runId, beneficiaryWallet: wallet, status: CALCULATED})
  FOR item IN items:
    IF item.complianceSnapshot != FULLY_VERIFIED:
      RETURN ERROR("wallet_not_fully_verified")
    IF item.status != CALCULATED:
      RETURN ERROR("item_not_claimable")

  // 2. Create claims with a "locked quote" to prevent race conditions with fee policy changes.
  claims = []
  FOR item IN items:
    policy = GET_ACTIVE_FEE_POLICY(item.projectId, item.candyMachineAddress, item.tokenMint, NOW())
    feeCalc = CALCULATE_CLAIM_FEE(item.grossAmountMinor, policy)

    claim = DB.create(DistributionClaim, {
      runId: item.runId,
      distributionItemId: item.id,
      beneficiaryWallet: wallet,
      payoutWallet: wallet,
      grossAmountMinor: item.grossAmountMinor,
      feeAmountMinor: feeCalc.feeAmountMinor,
      netAmountMinor: feeCalc.netAmountMinor,
      claimFeePolicyId: policy.id,
      claimFeePolicyVersion: policy.version,
      status: QUOTE_CREATED,
      quoteCreatedAt: NOW(),
      complianceSnapshot: RECHECK_COMPLIANCE(wallet)
    })
    claims.push(claim)

  RETURN {claims, quote: MAP(claims, c => ({gross: c.grossAmountMinor, fee: c.feeAmountMinor, net: c.netAmountMinor}))}

QUOTE_EXPIRY_MONITOR():
  // Cron job runs every hour
  expired = DB.find(DistributionClaim, {status: QUOTE_CREATED, quoteCreatedAt < NOW() - 48_HOURS})
  FOR claim IN expired:
    claim.status = CLAIMABLE
    DB.update(claim)
    AUDIT_LOG(claim.id, "QUOTE_EXPIRED", {quoteCreatedAt: claim.quoteCreatedAt})

CONFIRM_CLAIM(claimIds, wallet):
  // Use the locked quote from the existing claim record, do not recalculate.
  claims = DB.find(DistributionClaim, {id IN claimIds, beneficiaryWallet: wallet, status: QUOTE_CREATED}) 
  
  // Re-verify compliance at claim time
  FOR claim IN claims:
    currentCompliance = RECHECK_COMPLIANCE(wallet)
    IF currentCompliance != FULLY_VERIFIED:
      IF currentCompliance IN [RESTRICTED_AML, SUSPENDED]:
        claim.status = COMPLIANCE_HOLD
        claim.complianceSnapshot = currentCompliance
        DB.update(claim)
      RETURN ERROR("compliance_check_failed")

  // All good - mark requested
  FOR claim IN claims:
    claim.status = CLAIM_REQUESTED
    claim.claimRequestedAt = NOW()
    DB.update(claim)

  // Trigger backoffice batching job
  ENQUEUE_BATCHING_JOB(claims.map(c => c.id))
  RETURN {status: "queued_for_payout"}

BATCHING_JOB(claimIds):
  claims = DB.find(DistributionClaim, {id IN claimIds, status: CLAIM_REQUESTED})
  
  // Group by: project, run, tokenMint, feePolicy, treasuryVault
  batches = GROUP_BY(claims, [projectId, runId, tokenMint, claimFeePolicyId, treasuryVault])
  
  FOR batchClaims IN batches:
    batch = DB.create(SquadsPayoutBatch, {
      projectId: batchClaims[0].projectId,
      runId: batchClaims[0].runId,
      tokenMint: batchClaims[0].tokenMint,
      treasuryVault: batchClaims[0].treasuryVault,
      totalAmountMinor: SUM(c.netAmountMinor),
      totalFeesMinor: SUM(c.feeAmountMinor),
      itemCount: batchClaims.length,
      status: DRAFT
    })

    // Build Squads batch transfer legs
    legs = []
    FOR claim IN batchClaims:
      // PRE-FLIGHT CHECK: Ensure destination Associated Token Account (ATA) exists.
      // If not, the batch transaction should include a createATA instruction.
      // For simplicity here, we assume a helper handles this.
      // In reality, this would add an instruction to the transaction builder for Squads.
      ataExists = CHECK_ATA_EXISTS(claim.payoutWallet, claim.tokenMint)
      IF !ataExists:
        // PREPEND_CREATE_ATA_INSTRUCTION_TO_BATCH(legs, claim.payoutWallet, claim.tokenMint)
      legs.push(`${claim.tokenMint}:${claim.payoutWallet}:${claim.netAmountMinor}`)
      claim.status = QUEUED_FOR_PAYOUT
      claim.queuedAt = NOW()
      DB.update(claim)
      DB.create(SquadsPayoutBatchItem, {
        batchId: batch.id,
        claimId: claim.id,
        instructionIndex: legs.length - 1,
        recipientTokenAccount: GET_ATA(claim.payoutWallet, claim.tokenMint),
        amountMinor: claim.netAmountMinor,
        status: PENDING
      })

    // Create Squads proposal via `initiate_batch_transfer`
    proposal = SQUADS_INITIATE_BATCH_TRANSFER({
      multisig: SQUADS_MULTISIG_PDA,
      vaultIndex: VAULT_INDEX_FOR_TREASURY(batch.treasuryVault),
      transfers: legs,  // e.g., "USDC:wallet1:1000000", "USDC:wallet2:2000000"
      memo: `BRIDS distribution run ${batch.runId} batch ${batch.id}`
    })

    batch.proposalPda = proposal.proposalPda
    batch.batchPda = proposal.batchPda
    batch.transactionIndex = proposal.transactionIndex
    batch.status = PROPOSED
    DB.update(batch)

    // Notify committee for review
    NOTIFY_COMMITTEE(batch.id)
```

#### 4. Squads Execution & Reconciliation (Pseudocode)
```
COMMITTEE_REVIEW_BATCH(batchId, reviewer, action, evidence):
  batch = DB.find(SquadsPayoutBatch, batchId)
  IF action == REJECT:
    batch.status = REJECTED
    FOR item IN batch.items:
      claim = DB.find(DistributionClaim, item.claimId)
      claim.status = CLAIMABLE  // back to claimable
      DB.update(claim)
    AUDIT_LOG(batchId, "COMMITTEE_REJECTED", {reviewer, reason})
    RETURN

  // APPROVE
  batch.status = APPROVED_FOR_EXECUTION
  DB.update(batch)
  AUDIT_LOG(batchId, "COMMITTEE_APPROVED", {reviewer, evidence})

EXECUTE_BATCH(batchId, executor):
  batch = DB.find(SquadsPayoutBatch, batchId)
  batch.status = EXECUTING
  DB.update(batch)

  // Execute via Squads: vault_transaction_execute
  execution = SQUADS_EXECUTE({
    multisig: SQUADS_MULTISIG_PDA,
    proposal: batch.proposalPda,
    transactionIndex: batch.transactionIndex,
    vaultIndex: batch.vaultIndex
  })

  IF execution.success:
    batch.status = EXECUTED
    batch.executionSignature = execution.signature
    batch.executionSlot = execution.slot
    batch.executionBlockTime = execution.blockTime
    batch.executor = executor
    batch.successfulCount = batch.itemCount
    batch.failedCount = 0
    
    FOR item IN batch.items:
      item.status = EXECUTED
      item.transferSignature = execution.signature  // same for all in batch
      item.executionSlot = execution.slot
      item.executionBlockTime = execution.blockTime
      DB.update(item)
      
      claim = DB.find(DistributionClaim, item.claimId)
      claim.status = EXECUTED
      claim.executedAt = execution.blockTime
      DB.update(claim)
  ELSE:
    // Partial failure handling
    batch.status = PARTIALLY_FAILED
    // Individual item statuses updated based on execution logs
    // Failed items → claim.status = FAILED; can retry
  DB.update(batch)
  AUDIT_LOG(batchId, "EXECUTION_COMPLETE", {success: execution.success, ...})

RECONCILE_BATCH(batchId):
  // Called after execution to verify on-chain
  batch = DB.find(SquadsPayoutBatch, batchId)
  FOR item IN batch.items:
    tx = ARCHIVAL_RPC.getTransaction(item.transferSignature)
    IF tx AND NOT tx.meta.err:
      item.status = EXECUTED
      claim = DB.find(DistributionClaim, item.claimId)
      claim.status = EXECUTED
    ELSE:
      item.status = FAILED
      item.failureReason = "on_chain_verification_failed"
      claim = DB.find(DistributionClaim, item.claimId)
      claim.status = FAILED
    DB.update(item); DB.update(claim)
  
  // Recalculate batch counts
  batch.successfulCount = COUNT(items, EXECUTED)
  batch.failedCount = COUNT(items, FAILED)
  IF batch.failedCount == 0: batch.status = EXECUTED
  ELSE: batch.status = PARTIALLY_FAILED
  DB.update(batch)
```

#### 5. Compliance Hold & TTL (Pseudocode)
```
RECHECK_COMPLIANCE(wallet):
  kyc = DB.find(KycCase, {wallet, status: VERIFIED})
  aml = DB.find(UserProfile, {wallet, amlStatus: CLEAR})
  compliance = DB.find(UserProfile, {wallet, complianceStatus: FULLY_VERIFIED})
  IF !kyc: RETURN PENDING_KYC
  IF !aml: RETURN PENDING_AML
  IF !compliance: RETURN PENDING_REVIEW
  IF compliance == SUSPENDED: RETURN SUSPENDED
  IF aml == FLAGGED: RETURN RESTRICTED_AML
  RETURN FULLY_VERIFIED

COMPLIANCE_TTL_MONITOR():
  // Cron job runs daily
  holds = DB.find(DistributionClaim, {status: COMPLIANCE_HOLD})
  FOR claim IN holds:
    holdDuration = NOW() - claim.claimRequestedAt
    IF holdDuration >= 12 MONTHS:
      // Auto-clawback
      claim.status = COMPLIANCE_HOLD_EXPIRED
      DB.update(claim)
      
      // Create clawback record
      DB.create(ClaimOrPayoutEvent, {
        type: CLAWBACK,
        claimId: claim.id,
        amountMinor: claim.netAmountMinor,
        reason: "compliance_hold_ttl_expired",
        timestamp: NOW()
      })
      
      // Funds return to per-project clawback reserve
      TREASURY_CREDIT(claim.netAmountMinor, claim.tokenMint, "clawback_ttl_expired", targetAccount: PROJECT_CLAWBACK_RESERVE(claim.projectId))
      // Re-distribution requires a new committee-approved distribution run
      AUDIT_LOG(claim.id, "CLAWBACK_TTL_EXPIRED", {amount: claim.netAmountMinor})
```

#### 6. State Machines (Pseudocode)
```
DISTRIBUTION_CLAIM_STATES:
  NOT_CLAIMABLE → CLAIMABLE → QUOTE_CREATED → CLAIM_REQUESTED → QUEUED_FOR_PAYOUT
    → SQUADS_PROPOSED → APPROVED_FOR_EXECUTION → EXECUTED
    → FAILED (any stage) → retry possible
    → CANCELED (user cancels before execution)
    → COMPLIANCE_HOLD → COMPLIANCE_HOLD_EXPIRED → CLAWED_BACK (to project reserve)
    → COMPLIANCE_HOLD → (compliance clears) → back to QUEUED_FOR_PAYOUT
    → QUOTE_CREATED → (48h expiry) → CLAIMABLE

SQUADS_PAYOUT_BATCH_STATES:
  DRAFT → PROPOSED → APPROVING → APPROVED_FOR_EXECUTION → EXECUTING
    → EXECUTED | FAILED
    → REJECTED (committee) → back to DRAFT (rebuild)
```

#### 7. Audit Trail (Pseudocode)
```
CLAIM_OR_PAYOUT_EVENT:
  type: STAKE|UNSTAKE|DISTRIBUTION_CALCULATED|CLAIM_QUOTED|CLAIM_REQUESTED|
        BATCH_PROPOSED|COMMITTEE_REVIEW|BATCH_APPROVED|BATCH_EXECUTED|
        CLAIM_EXECUTED|CLAIM_FAILED|CLAWBACK_TTL_EXPIRED|PAYOUT_WALLET_OVERRIDE
  claimId?, batchId?, runId?, wallet?, amountMinor?, tokenMint?, reason?, metadata?, timestamp
```

## Spec Breakdown

> Each spec below is a **single-responsibility delivery unit**. During development, work on one spec at a time. Do not mix code from different specs in the same PR.

---

### SPEC-S04-A: Fee Policy Engine

- **Single Responsibility**: Manage versioned, scoped claim fee policies with hierarchical resolution (candy_machine > project > global).
- **Scope**:
  - Tables: `claim_fee_policies`
  - Paths: `lib/claims/fee-policy.ts`, `api/admin/fee-policies/*`
  - Pseudocode sections: §1 (ClaimFeePolicy schema), §2 (Fee Calculation, GET_ACTIVE_FEE_POLICY)
- **Inputs**: Admin CRUD operations (scope, fee mode, caps, effective dates)
- **Outputs**: Active fee policy resolved by scope + timestamp; fee calculation (`gross → fee → net`)
- **Dependencies**: None (standalone — can be built first or in parallel with S04-B)
- **Exit Criteria**:
  - [ ] `claim_fee_policies` migration applied with version tracking
  - [ ] CRUD: create, read, update (new version), deactivate
  - [ ] Hierarchical resolution: candy_machine policy overrides project, which overrides global
  - [ ] Flat fee mode: exact minor units, capped by `minFeeMinor`/`maxFeeMinor`
  - [ ] Percentage fee mode: `FLOOR(gross * bps / 10000)`, respects caps
  - [ ] Fee cannot exceed gross amount (`feeAmountMinor = MIN(rawFee, gross)`)
  - [ ] Default global policy exists and resolves when no scoped policy matches
  - [ ] Versioning: new version does not retroactively affect locked quotes

---

### SPEC-S04-B: Claim Lifecycle

- **Single Responsibility**: Allow the user to request a claim with a locked fee quote, enforce compliance gates, and manage quote expiry and concurrency.
- **Scope**:
  - Tables: `distribution_claims`, `claim_fee_policy_overrides`
  - Paths: `lib/claims/claim-flow.ts`, `lib/claims/quote-monitor.ts`, `api/protected/claims/*`
  - Pseudocode sections: §3 (CLAIM_FLOW, QUOTE_EXPIRY_MONITOR, CONFIRM_CLAIM), §6 (DistributionClaim state machine)
- **Inputs**: User wallet + runId; fee policy from SPEC-S04-A; compliance status from KYC/AML pipeline
- **Outputs**: `DistributionClaim` records transitioning through: `CLAIMABLE → QUOTE_CREATED → CLAIM_REQUESTED → QUEUED_FOR_PAYOUT`
- **Dependencies**: SPEC-S04-A (fee policy resolution for quote lock), SPEC-S03 (distribution items must exist)
- **Exit Criteria**:
  - [ ] `distribution_claims` and `claim_fee_policy_overrides` migrations applied
  - [ ] `CLAIM_FLOW`: creates claims with locked fee quote from active policy
  - [ ] Concurrent claim guard: DB advisory lock per `(wallet, runId)` prevents duplicate quotes
  - [ ] Quote expiry: `QUOTE_CREATED` claims auto-return to `CLAIMABLE` after 48 hours
  - [ ] `QUOTE_EXPIRY_MONITOR` cron job runs hourly, expires stale quotes
  - [ ] Compliance re-check at `CONFIRM_CLAIM`: `restricted_aml`/`suspended` → `COMPLIANCE_HOLD`
  - [ ] Payout wallet override requires SIWS proof + committee approval (`ClaimFeePolicyOverride`)
  - [ ] User-facing quote shows `gross / fee / net` breakdown before confirmation
  - [ ] `CANCELED` state reachable by user before execution

---

### SPEC-S04-C: Squads Treasury Execution & Compliance Monitor

- **Single Responsibility**: Execute approved claims via Squads v4 batched vault transactions, reconcile on-chain, and monitor compliance hold TTL with auto-clawback.
- **Scope**:
  - Tables: `squads_payout_batches`, `squads_payout_batch_items`, `claim_or_payout_events`
  - Paths: `lib/squads/`, `lib/claims/compliance-monitor.ts`, `api/admin/batches/*`
  - Pseudocode sections: §3 (BATCHING_JOB), §4 (Squads Execution & Reconciliation), §5 (Compliance Hold & TTL), §7 (Audit Trail)
- **Inputs**: Claims in `CLAIM_REQUESTED` status; Squads multisig configuration; archival RPC for reconciliation
- **Outputs**: Executed on-chain transfers via Squads; reconciled batch items; clawback records for expired compliance holds
- **Dependencies**: SPEC-S04-B (claims must be in `CLAIM_REQUESTED` status), SPEC-S02-C (archival RPC for reconciliation)
- **Exit Criteria**:
  - [ ] `squads_payout_batches`, `squads_payout_batch_items`, `claim_or_payout_events` migrations applied
  - [ ] Batch chunking: `MAX_LEGS_PER_BATCH = 20` per Squads proposal (CU limit guard)
  - [ ] ATA pre-flight: destination Associated Token Account existence checked before batch
  - [ ] Squads `initiate_batch_transfer` creates proposal with correct legs
  - [ ] Committee review/reject/approve flow for each batch
  - [ ] On-chain reconciliation: `getTransaction` verifies execution after Squads execute
  - [ ] Partial failure: individual items marked `FAILED` while batch marked `PARTIALLY_FAILED`
  - [ ] Failed items return claims to retryable state (new batch, excluding failed wallet)
  - [ ] Compliance hold TTL: daily cron, 12-month expiry → `COMPLIANCE_HOLD_EXPIRED` → `CLAWED_BACK`
  - [ ] Clawback funds credited to per-project `TreasuryClawbackReserve`
  - [ ] Immutable audit trail: every state transition logged in `claim_or_payout_events`
  - [ ] End-to-end claim → Squads → execution verified on devnet

---

### Spec Dependency Order

```
SPEC-S04-A  (Fee Policy Engine)               ← can build first (standalone)
    └── SPEC-S04-B  (Claim Lifecycle)         ← requires S04-A for fee resolution
        └── SPEC-S04-C  (Squads + Compliance) ← requires S04-B for claimed items
```

> [!NOTE]
> SPEC-S04-A is fully independent and can be developed in parallel with any S02 or S03 spec. SPEC-S04-B and S04-C are sequential.

---

## Resolution
- ClaimFeePolicy: versioned, scoped (global/project/CM), flat or percentage with caps
- Claim lifecycle: quote lock → compliance re-check → committee → Squads batch → execution → reconciliation
- Squads v4: single `initiate_batch_transfer` with multiple token legs; granular item status for partial failures
- Compliance: `restricted_aml`/`suspended` blocked at gate; 12-month TTL with auto-clawback
- Fee applied at claim layer (after gross); quote shows gross/fee/net before confirmation
- Full audit trail with immutable event log

## Decision
- Decision: `approved`
- Decision date: `2026-06-16`
- Decision owner: Staff Engineer
- Approval notes: Solana batch transfer atomicity correctly modeled. SIWS signature requirement for payout override adds proper insider-threat mitigation.

## Status
- Current status: `planned`
- Next action: Open delivery slice branch
- Exit criteria:
  - [ ] Fee policy CRUD + versioning works
  - [ ] Claim flow end-to-end on devnet (Squads devnet)
  - [ ] Compliance hold TTL + clawback verified
  - [ ] Partial batch failure handling tested
  - [ ] Audit trail immutable and queryable

## Test and Validation Plan
- Unit: fee calculation with caps, Hamilton math not affected by fees
- Integration: Claim → batch → Squads proposal → execution → reconciliation (devnet)
- Edge: compliance state changes between quote and claim, partial batch failures, quote expiry after 48h
- Concurrency: duplicate CLAIM_FLOW calls with same (wallet, runId) must not produce duplicate quotes
- Security: payout wallet override requires committee approval

## Traceability
- Related: BRI-8
- Parent: STORY-014-01-draft
- PR(s): TBD