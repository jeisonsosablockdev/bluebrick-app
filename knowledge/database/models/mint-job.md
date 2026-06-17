---
type: Data Model
title: Mint Job
description: Batch mint job orchestration — jobs, batches, items, signatures, reconciliation
tags: [database, model, mint, orchestrator, batch, reconciliation, das, metaplex-core]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/mint-orchestrator-store.ts
---

# Mint Job

## Database Tables (Migration `001_mint_job_idempotency.sql` + later)
- `mint_jobs`
- `mint_job_batches`
- `mint_job_items`
- `mint_item_signatures`
- `webhook_events`

## Type Definitions
From `lib/mint-orchestrator-store.ts`:

### Mint Job
```typescript
export type MintJobStatus = 
  | "queued" 
  | "preparing" 
  | "signing" 
  | "submitting" 
  | "confirming" 
  | "partial" 
  | "completed" 
  | "failed";

export type MintJobRecord = {
  id: string;                    // UUID
  emission_id: string;           // Business identifier
  created_by: string;            // Admin wallet (immutable authority)
  total_items: number;
  status: MintJobStatus;
  current_batch: number;
  created_at: Date;
  updated_at: Date;
};
```

### Mint Job Batch
```typescript
export type MintBatchRecord = {
  id: string;
  job_id: string;
  batch_no: number;
  batch_token: string;           // Deterministic token
  status: "reserved" | "prepared" | "submitted" | "confirming" | "completed" | "partial" | "failed";
  items_count: number;
  idempotency_key: string;       // For next-batch idempotency
  created_at: Date;
  updated_at: Date;
};
```

### Mint Job Item
```typescript
export type MintItemRecord = {
  id: string;
  job_id: string;
  batch_no: number;
  serial_no: number;
  asset_pubkey: string | null;   // Expected address
  status: "pending" | "prepared" | "submitted" | "confirmed" | "failed";
  created_at: Date;
  updated_at: Date;
};
```

### Mint Item Signature
```typescript
export type MintItemSignatureRecord = {
  id: string;
  job_id: string;
  batch_no: number;
  serial_no: number;
  signature: string;             // Base58 transaction signature
  signer_pubkey: string;
  created_at: Date;
};
```

### Webhook Event
```typescript
export type WebhookEventRecord = {
  id: string;
  provider: "helius";
  event_id: string;
  event_fingerprint: string;
  job_id: string | null;
  payload: Record<string, unknown>;
  processed_at: Date;
  created_at: Date;
};
```

## Authority Model (H7)
- **Permanent job authority**: `created_by` wallet is immutable per job
- Manual mutations (`next-batch`, `submit`, `reconcile`) require `actorPubkey === job.created_by`
- Different admin wallet can read but cannot mutate
- Webhook/DAS reconciliation is server-initiated

## Reconciliation
| Method | Endpoint | Description |
| --- | --- | --- |
| RPC | `/reconcile` | Signature status via `getSignatureStatuses` |
| DAS | `/reconcile/das` | Paginated `getAssetsByGroup` by collection |

## State Machine
```
queued → preparing → signing → submitting → confirming → completed | partial | failed
```

## Illegal Transitions (Enforced)
- `completed` → `preparing` (immutable)
- `failed` → `signing` (requires recovery)
- `submitting` → `preparing` (duplicate risk)

## Related
- [Mint Orchestrator API](../api/endpoints/mint-orchestrator.md)
- [Devnet Proof](../architecture/devnet-proof.md)
- [State Machine](../architecture/state-machine.md)