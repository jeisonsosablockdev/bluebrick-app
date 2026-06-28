# STORY-014-02-core-infrastructure

## Metadata
- Epic: `EPIC-014-stake-distribution-traceability`
- Story ID: `STORY-014-02-core-infrastructure`
- Status: `planned`
- Owner: `jaysosa`
- RFC owner slice: `<branch-or-slice-id>`
- Created: `2026-06-15`
- Last Updated: `2026-06-16`
- Parent Story: `STORY-014-01-draft`
- Slice: `S02` (Delivery Slice 1 of 3)

## Context
- Problem: Establish foundational infrastructure for stake/unstake event capture, mint provenance tracking, user profile history, and archival node provisioning. This is the data layer upon which all distribution calculations depend.
- Why now: BRI-5 (Stake/Unstake) and BRI-6 (Distribution Preparation) require this foundation before Distribution Engine (S03) and Treasury/Claims (S04).
- Constraints:
  - Blockchain truth first, DB projection second
  - All historical reconstruction must use archival RPC endpoints
  - Candy Machine is sole financial scope for v1
  - MPL Core freeze/thaw semantics as source of truth
- Affected paths: stake APIs, webhook handlers, lib/db, lib/stake, lib/archival

## Proposal
### Approach Summary
Build the complete data pipeline: on-chain freeze/thaw events → canonical reconciliation → persisted profile history → mint provenance registry. Provision and validate archival RPC infrastructure.

### Technical Design

#### 1. Database Schema (Pseudocode)
```
StakeActionAttempt
  id, wallet, assetAddress, actionType(FREEZE|UNFREEZE), status(PENDING|SUBMITTED|CONFIRMED|FAILED|RECONCILED)
  txSignature?, slot?, blockTime?, errorMessage?, rawPayload?
  indexes: [wallet, assetAddress], [status, createdAt]

UserProfileStakeEvent
  id, wallet, assetAddress, collectionAddress, candyMachineAddress, projectId
  eventType(FROZEN|THAWED), confirmedAt, slot, blockTime, txSignature (unique)
  provenanceId (FK), indexes: [wallet, projectId], [assetAddress, eventType], [confirmedAt]

AssetProjectOrigin
  id, assetAddress (unique), projectId, collectionAddress, candyMachineAddress, candyGuardAddress?
  mintSignature, mintSlot, mintBlockTime, minterWallet, saleEvidence?
  provenanceSource(CAPTURED_AT_MINT|PARSED_TRANSACTION|ADMIN_BACKFILL)
  provenanceStatus(VALIDATED|NEEDS_REVIEW|REJECTED)
  indexes: [projectId, candyMachineAddress], [provenanceStatus]

ProjectCandyMachineSource
  id, projectId (unique), candyMachineAddress (unique), collectionAddress
  authorizedSupply, nftPriceMinor, minimumSoldCount, fundingThresholdMinor?
  unsoldInventoryPolicy(EXCLUDE_UNSOLD|INCLUDE_UNSOLD)
  mintAuthorityFrozenAt?  // timestamp when mint authority was frozen
  indexes: [candyMachineAddress]

ArchivalRpcEndpoint
  id, name (unique: helius-archive|alchemy-archive|self-hosted), url, provider
  isPrimary, isActive, minLedgerSlot?, lastCheckedAt?
```

#### 2. Reconciliation Engine (Pseudocode)
```
RECONCILE(attemptId):
  attempt = DB.find(StakeActionAttempt, attemptId)
  if !attempt.txSignature: return PENDING

  // Multi-endpoint archival RPC call
  FOR endpoint IN archivalEndpoints ORDER BY primary DESC:
    IF NOT validateEndpoint(endpoint, requiredSlot): CONTINUE
    tx = endpoint.getTransaction(attempt.txSignature, {commitment: "finalized"})
    IF tx AND NOT tx.meta.err: BREAK

  IF !tx OR tx.meta.err: return FAILED("tx not found or failed")

  freezeEvent = PARSE_FREEZE_THAW(tx)
  IF !freezeEvent: return FAILED("no freeze/thaw instruction")

  provenance = VERIFY_PROVENANCE(freezeEvent.assetAddress)
  IF !provenance OR provenance.status != VALIDATED:
    return FAILED("invalid provenance")

  DB.create(UserProfileStakeEvent, {
    wallet: freezeEvent.wallet,
    assetAddress: freezeEvent.assetAddress,
    collectionAddress: provenance.collectionAddress,
    candyMachineAddress: provenance.candyMachineAddress,
    projectId: provenance.projectId,
    eventType: freezeEvent.eventType,
    confirmedAt: blockTime,
    slot: tx.slot,
    blockTime: blockTime,
    txSignature: attempt.txSignature,
    provenanceId: provenance.id
  })

  DB.update(attempt, {status: RECONCILED, slot: tx.slot, blockTime})
  return CONFIRMED(event)

PARSE_FREEZE_THAW(tx):
  FOR instruction IN tx.instructions:
    IF instruction.program == MPL_CORE_PROGRAM:
      IF instruction.discriminator == FREEZE_DISCRIMINATOR:
        RETURN {wallet: instruction.authority, asset: instruction.asset, type: FROZEN}
      IF instruction.discriminator == THAW_DISCRIMINATOR:
        RETURN {wallet: instruction.authority, asset: instruction.asset, type: THAWED}
  RETURN NULL

VERIFY_PROVENANCE(assetAddress):
  origin = DB.find(AssetProjectOrigin, assetAddress)
  IF !origin: TRIGGER_BACKFILL_JOB(assetAddress); RETURN NULL
  RETURN origin
```

#### 3. Archival RPC Client (Pseudocode)
```
ArchivalRpcClient(endpoints[], maxSlotLag=100, maxAgeMs=5000):
  GET_TRANSACTION(signature, requiredSlot?):
    FOR endpoint IN endpoints ORDER BY primary:
      minSlot = endpoint.minimumLedgerSlot()
      IF minSlot > requiredSlot: CONTINUE  // not archival enough
      TRY:
        tx = endpoint.getTransaction(signature, {commitment: "finalized", minContextSlot: requiredSlot})
        IF tx: RETURN tx
      CATCH: CONTINUE
    RETURN NULL

  GET_ACCOUNT_INFO(address, requiredSlot?):
    // Similar multi-endpoint with minContextSlot guard

  GET_SIGNATURES_FOR_ADDRESS(address, beforeSlot?, untilSlot?):
    // Requires archival endpoint for historical range

  VALIDATE_ENDPOINT(endpoint, requiredSlot):
    minSlot = endpoint.minimumLedgerSlot()
    RETURN minSlot <= requiredSlot

  HEALTH_CHECK():
    PARALLEL FOR endpoint IN endpoints:
      minSlot = endpoint.minimumLedgerSlot()
      currentSlot = endpoint.getSlot({commitment: "finalized"})
      RETURN {name, healthy: true, minLedgerSlot: minSlot, currentSlot}
```

#### 4. Provenance Backfill Job (Pseudocode)
```
BACKFILL_PROJECT_PROVENANCE(projectId, maxAgeMonths=3):
  cmSource = DB.find(ProjectCandyMachineSource, projectId)
  assets = GET_ALL_ASSETS_FROM_CM(cmSource.candyMachineAddress)  // via Helius DAS or RPC

  FOR asset IN assets:
    IF DB.exists(AssetProjectOrigin, asset.address): CONTINUE

    signatures = archivalRpc.getSignaturesForAddress(asset.address, beforeSlot: cmSource.fundingThresholdMetAt?)
    mintTx = NULL
    FOR sig IN signatures ORDER BY blockTime ASC:
      tx = archivalRpc.getTransaction(sig.signature)
      IF tx AND HAS_MINT_INSTRUCTION(tx, cmSource.candyMachineAddress):
        mintTx = tx; BREAK

    IF mintTx:
      DB.create(AssetProjectOrigin, {
        assetAddress: asset.address,
        projectId: projectId,
        collectionAddress: cmSource.collectionAddress,
        candyMachineAddress: cmSource.candyMachineAddress,
        candyGuardAddress: EXTRACT_CANDY_GUARD(mintTx),
        mintSignature: mintTx.signature,
        mintSlot: mintTx.slot,
        mintBlockTime: mintTx.blockTime,
        minterWallet: EXTRACT_MINTER(mintTx),
        saleEvidence: EXTRACT_PAYMENT(mintTx),
        provenanceSource: PARSED_TRANSACTION,
        provenanceStatus: VALIDATED
      })
    ELSE:
      DB.create(AssetProjectOrigin, {
        assetAddress: asset.address,
        projectId: projectId,
        // ... other fields from cmSource ...
        provenanceSource: PARSED_TRANSACTION,
        provenanceStatus: NEEDS_REVIEW  // tx pruned or unavailable
      })
```

#### 5. Mint Authority Freeze (Pseudocode)
```
FREEZE_MINT_AUTHORITY(projectId):
  project = DB.find(ProjectCandyMachineSource, projectId)
  IF !project OR project.mintAuthorityFrozenAt: RETURN

  mintAuthority = DERIVE_MINT_AUTHORITY_PDA(project.candyMachineAddress)
  ixs = [
    FREEZE_MINT_AUTHORITY_IX(mintAuthority, project.candyMachineAddress),
    UPDATE_PROJECT_IX(projectId, {mintAuthorityFrozenAt: NOW()})
  ]
  SUBMIT_VIA_ADMIN_OR_SQUADS(ixs)
  // Event: MintAuthorityFrozen {projectId, candyMachineAddress, timestamp}
```

#### 6. API Surface (Specification)
| Endpoint | Method | Spec |
|---|---|---|
| `/api/protected/stake/assets` | GET | Returns user's stake-eligible NFTs with CM provenance, current freeze state, accumulated time |
| `/api/protected/stake/prepare` | POST | Input: {assetAddress, actionType}. Output: unsigned transaction + recent blockhash |
| `/api/protected/stake/submit` | POST | Input: {signedTx, assetAddress, actionType}. Creates StakeActionAttempt, returns attemptId |
| `/api/webhooks/helius/stake` | POST | Helius webhook payload → queue reconciliation job |
| `/api/admin/archival/health` | GET | Returns health status of all archival endpoints |
| `/api/admin/provenance/backfill` | POST | Triggers provenance backfill for project |

## Resolution
- Schema defined for 5 core tables with indexes
- Reconciliation engine: webhook → multi-endpoint archival RPC → canonical event persistence
- ArchivalRpcClient: multi-provider, freshness guards, minimumLedgerSlot validation
- Provenance backfill: 3-month window, transaction parsing, NEEDS_REVIEW fallback
- Mint authority freeze at project start prevents late minting
- API surface covers stake actions, webhook, admin operations

## Decision
- Decision: `approved`
- Decision date: `2026-06-16`
- Decision owner: Staff Engineer
- Approval notes: Core infra schemas and reconciliation engine state-machine design are robust and aligned with Archival Node requirements.

## Status
- Current status: `planned`
- Next action: Open delivery slice branch, implement RED tests first
- Exit criteria:
  - [ ] Prisma migrations applied
  - [ ] Reconciliation engine passes integration tests (devnet MPL Core freeze/thaw)
  - [ ] ArchivalRpcClient health checks pass for all endpoints
  - [ ] Provenance backfill processes test assets
  - [ ] Mint authority freeze verified on devnet

## Test and Validation Plan
- Unit: freeze/thaw instruction parsing, provenance verification, Hamilton remainder
- Integration: webhook → reconciliation → profile event (devnet)
- Devnet: real freeze/thaw, archival endpoint validation
- Load: 1000 concurrent reconciliation attempts

## Traceability
- Related: BRI-5, BRI-6
- Parent: STORY-014-01-draft
- PR(s): TBD