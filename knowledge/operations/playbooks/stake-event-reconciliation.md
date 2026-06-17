---
type: Playbook
title: Stake Event Reconciliation
description: Playbook for reconciling stake/unstake events from Helius webhooks and manual recovery
tags: [operations, playbook, stake, unstake, helius, reconciliation, nft]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/stake-webhook-reconciliation.ts
---

# Stake Event Reconciliation Playbook

## Overview
Reconcile stake/unstake actions from Helius webhooks with canonical RPC verification before updating user profile history.

## Normal Flow (Automated)

### 1. Webhook Received
- Endpoint: `POST /api/webhooks/helius/stake`
- Validates: Optional `HELIUS_WEBHOOK_SECRET`
- Parses: `freezeAsset` / `thawAsset` instructions

### 2. Deduplication
- Key: `(provider, eventId)` and `(provider, eventFingerprint)`
- In-memory store prevents duplicate processing

### 3. Canonical Verification
```typescript
// For each candidate event:
const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed' });
assert(tx.meta.err === null);
assert(tx.slot > lastKnownSlot);
```

### 4. Profile Update
- Update `stake_profile_events` with `validated` status
- Update `user_profiles` derived stake state
- Emit metrics

## Manual Reconciliation (When Automated Fails)

### Trigger
- Webhook delivery failed (Helius retry exhausted)
- Webhook signature validation failed
- RPC verification timeout
- Manual audit discrepancy

### Procedure

#### 1. Identify Missing Events
```sql
-- Find stake attempts without webhook confirmation
SELECT * FROM stake_action_attempts 
WHERE status IN ('submitted', 'reconcile_pending') 
AND submitted_at < NOW() - INTERVAL '1 hour';
```

#### 2. Fetch Signatures from Helius API
```bash
# Use Helius enhanced API
curl "https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY" \
  -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSignaturesForAsset","params":["<ASSET_MINT>"]}'
```

#### 3. Verify Each Signature
```typescript
for (const sig of signatures) {
  const tx = await connection.getParsedTransaction(sig, { commitment: 'finalized' });
  if (tx.meta.err === null && isStakeInstruction(tx)) {
    await reconcileStakeEvent(sig, tx);
  }
}
```

#### 4. Update Records
- Set `stake_action_attempts.status = 'validated'`
- Insert into `stake_profile_events` with `source: 'manual'`
- Update `user_profiles` stake counts

## Blockhash Expiry Recovery

### User-Facing
1. User sees "Blockhash expired" error
2. UI prompts: "Sign fresh transaction"
3. New attempt created, old marked `failed`

### Backend
- Old attempt: `status = 'failed'`, `error_code = 'BLOCKHASH_EXPIRED'`
- New attempt: `status = 'prepared'` → user signs → `submitted`

## Monitoring & Alerts
- Alert if `reconcile_pending` > 10 for >15 min
- Alert if webhook failure rate > 5%
- Daily reconciliation report: `npm run stake:reconcile:report`

## Related
- [Stake Distribution API](../api/endpoints/stake-distribution.md)
- [Stake Action Model](../database/models/stake-action.md)
- [Helius Webhook](../api/endpoints/webhooks.md)