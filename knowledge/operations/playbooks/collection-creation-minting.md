---
type: Playbook
title: Collection Creation and Minting
description: End-to-end playbook for creating NFT collections and minting assets via admin panel
tags: [operations, playbook, collection, minting, admin, marketplace, metaplex-core]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/admin
---

# Collection Creation and Minting Playbook

## Overview
This playbook covers the full lifecycle: form → deploy → mint → snapshot → marketplace handoff.

## Step 1: Admin Form (`/admin/assets/new`)

### Required Fields
| Field | Validation |
|-------|------------|
| Collection Name | ≤32 chars (on-chain limit) |
| Symbol | Symbol | ≤10 chars |
 | Description | Markdown supported |
 | Quantity | Positive integer |
 | Price per NFT | USDC atomic units |
 | Cover Image | Required, uploaded to Vercel Blob |
 | Gallery/Property Images | Optional, multiple |
 | Documents | Optional (brochure, legal, financial) |
 | Location | Google Maps place (optional) |

### Project/Economics/Governance (JSON)
- Auto-populated from form, editable in collection editor later

## Step 2: Deploy Collection & Candy Machine

### Actions (in order)
1. **Create Asset** → Prepares collection + CM deploy transactions
2. **Sign** → Phantom signs all transactions
3. **Submit** → Backend broadcasts, verifies on devnet
4. **Load Config** → Chunked config line loading
4. **Mint** → Batch mint via orchestrator (if quantity > 1)

## Step 3: Snapshot Finalization

### Automatic
- After mint completes, UI calls `POST /snapshot/finalize`
- DAS verification runs
- On success: `verificationStatus = verified`

### Manual Re-check
- If DAS not ready: auto re-check at 15s
- Manual button after auto re-check fails
- Reuses same deploy evidence

## Step 4: Marketplace Handoff

### Trigger
- `Create Asset` button enabled only when:
  - `verificationStatus = verified`
  - `mint_jobs.status = completed`

### Data Transferred
- Form snapshot → `marketplace_entries`
- Verified snapshot → `asset_mint_snapshots`
- On-chain proofs → `asset_mint_onchain_proofs`
- Upload refs → `asset_uploaded_files` (promoted)

### Collection Editor Bootstrap
- Gallery/property images from `form_snapshot.uploadRefs`
- Matched to finalized uploads by `fileRefId`
- Raw snapshot URLs as fallback

## Step 5: Collection Editor (`/admin/collections/[id]`)

### Editable Sections
| Section | Fields | Immutable |
|---------|--------|-----------|
| Summary | title, description | - |
| Property Info | project_json, economics_json, governance_json | - |
| Gallery | gallery_images | Cover image |
| Documents | documents | - |
| Location | location_json (Google Maps) | - |

### Ownership Enforcement
- `GET/PATCH /api/admin/collections/:id` require:
  - `marketplace_entries.created_by === admin wallet`
  - Matching `asset_mint_snapshots` evidence

## Verification Checklist
- [ ] Form submitted without errors
- [ ] Collection + CM deployed, verified on devnet
- [ ] Assets minted, signatures finalized
- [ ] Snapshot verified (DAS)
- [ ] Marketplace entry created with `snapshot_id`
- [ ] Collection editor loads with bootstrap data
- [ ] Public marketplace shows listing

## Related
- [Admin Assets API](../api/endpoints/admin-assets.md)
- [Collections API](../api/endpoints/collections.md)
- [Marketplace Entry Model](../database/models/marketplace-entry.md)
- [Mint Job Model](../database/models/mint-job.md)