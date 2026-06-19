---
type: Playbook
title: Admin Asset Creation Workflow
description: Complete workflow for admin-driven asset creation from form to marketplace
tags: [operations, playbook, admin, asset, creation, workflow, marketplace]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/app/admin
---

# Admin Asset Creation Workflow

## Workflow Stages

### Stage 1: Form Completion (`/admin/assets/new`)
- Admin fills all required fields
- Uploads images/documents (Vercel Blob)
- Form validates client + server side
- **Output**: `draftId` + `uploadRefs`

### Stage 2: Deploy & Mint
- Click **Create Asset** → triggers deploy
- **Collection + CM Deploy** (atomic)
- **Config Lines Load** (chunked)
- **Batch Mint** (via orchestrator if qty > 1)
- **Progress UI** shows: preparing → signing → submitting → confirming

### Stage 3: Snapshot Finalization
- Auto-triggered after mint
- **DAS Verification** (primary)
- **Fallback**: CM counters (`degraded`)
- **Retry**: Auto at 15s, then manual button

### Stage 4: Marketplace Handoff
- **Create Asset** button enabled when verified
- Creates `marketplace_entries` with:
  - Form data (project, economics, governance)
  - Verified snapshot reference
  - On-chain proofs
- Promotes uploads: `asset_uploaded_files.promoted_at`

### Stage 5: Collection Editor
- Redirects to `/admin/collections/[id]`
- Bootstrap from `form_snapshot.uploadRefs`
- Admin edits content, saves per section
- Ownership verified on each save

## Error Handling

| Stage | Common Errors | Resolution |
|-------|---------------|------------|
| Form | Validation, upload fail | Fix input, re-upload |
| Deploy | Blockhash, insufficient funds | Fund wallet, retry |
| Config | Serialization overflow | Smaller chunks |
| Mint | Batch failure | Re-submit batch (idempotent) |
| Snapshot | DAS timeout | Auto re-check 15s, then manual |
| Handoff | Snapshot not ready | Wait for verification |

## Status Tracking

### Job States
```
queued → preparing → signing → submitting → confirming → completed|partial|failed
```

### Snapshot States
```
pending → verifying → verified|degraded|failed
```

### Marketplace Entry States
```
draft → funding → active → sold_out → hidden
```

## Monitoring
- Admin dashboard: `/admin` shows recent jobs
- `GET /api/admin/mint-orchestrator/jobs` lists with progress
- Devnet explorer links on all signatures

## Rollback
- No automatic rollback
- Manual: Delete collection (if no mints), re-create
- If mints exist: Mark entry `hidden`, create new

## Related
- [Collection Creation Playbook](collection-creation-minting.md)
- [Mint Orchestrator API](../api/endpoints/mint-orchestrator.md)
- [Admin Assets API](../api/endpoints/admin-assets.md)