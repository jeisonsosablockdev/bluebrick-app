---
type: Playbook
title: Asset Minting and Deployment
description: Playbook for deploying Core Candy Machine collections and minting assets
tags: [operations, playbook, mint, deployment, candy-machine, metaplex-core, devnet]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/admin
---

# Asset Minting and Deployment Playbook

## Prerequisites
- Admin wallet in `ADMIN_WALLETS` env
- Devnet SOL funded (>2 SOL for deploy)
- `SQUADS_FREEZE_AUTHORITY`, `SQUADS_TRANSFER_AUTHORITY` configured
- `PURCHASE_THIRD_PARTY_SIGNER_SECRET_KEY` configured
- Pinata JWT configured (optional, for metadata)

## Phase 1: Collection Creation

### 1. Prepare Deploy
- Admin completes `/admin/assets/new` form
- Form validates: name, symbol, description, quantity, price
- Click **Create Asset** → triggers `POST /api/admin/core-candy-machine/deploy/prepare`

### 2. Sign Transaction
- Frontend prompts Phantom to sign
- Returns signed transaction to backend

### 3. Submit & Verify
- `POST /api/admin/core-candy-machine/submit`
- Backend broadcasts, waits for `finalized`
- Verifies on-chain: program = `CoREENx...`, authority = admin

## Phase 2: Candy Machine Creation

### 1. Prepare CM
- Config: `startDate`, `tokenPayment` (USDC), `thirdPartySigner`
- `POST /api/admin/core-candy-machine/mint/prepare`

### 2. Load Config Lines
- Chunked loading (adaptive sizing)
- Each chunk signed + submitted
- Progress tracked in UI

### 3. Verify CM
- `getAccountInfo` → owner = `CMACYFEN...`
- Config lines loaded = quantity
- Guards active: `startDate`, `tokenPayment`, `thirdPartySigner`

## Phase 3: Batch Mint (Admin Orchestrator)

### 1. Create Mint Job
- `POST /api/admin/mint-orchestrator/jobs` with `emission_id`
- Returns `job_id`

### 2. Request Batches
- `POST /api/admin/mint-orchestrator/jobs/:jobId/next-batch`
- Returns batch items with `asset_pubkey` + transaction

### 3. Sign Batch
- Frontend: `signAllTransactions` (or sequential)
- Collect signatures per item

### 4. Submit Signatures
- `POST /api/admin/mint-orchestrator/jobs/:jobId/batches/:batchNo/submit`
- Enforces `createdBy` authority (H7)

### 5. Reconcile
- RPC: `POST /reconcile` (signature status)
- DAS: `POST /reconcile/das` (paginated `getAssetsByGroup`)

## Phase 4: Snapshot Finalization

### 1. Finalize Snapshot
- `POST /api/admin/core-candy-machine/snapshot/finalize`
- DAS verification: `getAssetsByGroup` by collection
- Persists: `asset_mint_snapshots` + `asset_mint_onchain_proofs`

### 2. Create Asset Gate
- Enabled only when: `verificationStatus=verified` AND `status=completed`
- Creates `marketplace_entries` row with `snapshot_id`

## Devnet Verification Checklist
- [ ] Collection account exists, owned by Core program
- [ ] Candy Machine account exists, owned by CM program
- [ ] Config lines loaded = expected quantity
- [ ] Mint signatures `finalized` on devnet
- [ ] DAS reconciliation matches expected count
- [ ] Snapshot `verificationStatus = verified`
- [ ] Explorer links recorded for all signatures

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Blockhash expired` | Re-request batch, re-sign, re-submit |
| `Insufficient funds` | Fund admin wallet (`solana airdrop 2`) |
| `Config line overflow` | Reduce chunk size, retry |
| `DAS reconciliation incomplete` | Increase `maxPages`, re-run DAS reconcile |
| `Snapshot verification degraded` | Fallback to CM counters, manual review |

## Related
- [Mint Orchestrator API](../api/endpoints/mint-orchestrator.md)
- [Mint Job Model](../database/models/mint-job.md)
- [Devnet Proof](../architecture/devnet-proof.md)
- [NFT Spec](../architecture/nft-spec.md)