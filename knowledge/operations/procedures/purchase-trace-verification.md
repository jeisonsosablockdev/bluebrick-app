---
type: Procedure
title: Purchase Trace Verification
description: Procedure for verifying purchase flow traces using flow_id correlation
tags: [operations, procedure, purchase, trace, verification, flow-id, debugging]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/docs/purchase-tracing.md
---

# Purchase Trace Verification Procedure

## Overview
Verify end-to-end purchase flow using `flow_id` correlation across quote → challenge → prepare → submit.

## Prerequisites
- `PURCHASE_TRACE_ENABLED=true` (default)
- Access to PostgreSQL database
- `flow_id` from UI (shown on purchase card as "Flow ID de trazado")

## Procedure

### 1. Get Flow ID
- From UI: Purchase card shows "Flow ID de trazado: `<UUID>`"
- From logs: Search for `x-flow-id` header in API requests
- From DB: Query recent `purchase_flow_events`

### 2. Query Trace Events
```bash
# Via CLI
npm run purchase:trace -- --flow-id <FLOW_ID>

# Or direct SQL
psql $DATABASE_URL -c "
SELECT flow_id, endpoint, phase, status_code, error_code, 
       attempt_id, idempotency_key, created_at
FROM purchase_flow_events
WHERE flow_id = '<FLOW_ID>'
ORDER BY created_at ASC;
"
```

### 3. Expected Timeline
```
quote/request      → quote/success
challenge/request  → challenge/success
prepare/request    → prepare/success
submit/request     → submit/success (or submit/error)
```

### 4. Verify Each Phase

#### Quote Phase
- `status_code = 200`
- Response includes: `priceLamports`, `paymentCurrency`, `quantityMode`, `itemsRemaining`
- No `error_code`

#### Challenge Phase
- `status_code = 200`
- Response includes: `challengeId`, `nonce`, `message`, `expiresAt`
- Challenge stored in `purchase_challenges` with `status = issued`

#### Prepare Phase
- `status_code = 200`
- Response includes: `transactionBase64`, `attemptId`, `idempotencyKey`, `expectedAssetAddresses`
- Attempt created in `purchase_attempts` with `status = prepared`

#### Submit Phase
- `status_code = 200` (success) or error code
- On success:
  - `txSignature` returned
  - `purchase_attempts.status = submitted`
  - `verified_asset_addresses` populated after verification
- On error:
  - `error_code` populated (e.g., `INSUFFICIENT_FUNDS`, `TRANSACTION_FAILED`)
  - Attempt status = `failed`

### 5. Verify Idempotency
- Replay submit with same `attemptId + idempotencyKey`
- Should return same `txSignature` without re-sending
- Check: `purchase_attempts` has single row for `(wallet, idempotency_key)`

### 6. Verify Asset Verification
```sql
SELECT * FROM purchase_attempts 
WHERE id = '<ATTEMPT_ID>';

-- Check:
-- verified_asset_addresses = expected_asset_addresses
-- asset_verification_status = 'verified'
-- asset_verification_checked_at populated
```

### 7. On-Chain Verification
```bash
# Check transaction status
solana getTransaction <TX_SIGNATURE> --url devnet

# Verify:
# confirmationStatus = finalized
# meta.err = null
# Logs show MintV1 + MintAsset + FreezeDelegate
```

## Common Issues & Checks

| Issue | Check | Resolution |
|-------|-------|------------|
| Missing phase | Query `purchase_flow_events` | Trace dropped, check logs |
| `PRICE_CHANGED` | Quote cache vs fresh guard | User must re-quote |
| `INVALID_CHALLENGE` | Challenge expired/consumed | Re-issue challenge |
| `BLOCKHASH_EXPIRED` | Submit took >120s | Retry with fresh prepare |
| Duplicate submit | Same `attemptId + idempotencyKey` | Idempotent, returns same result |
| Asset not verified | `verified_asset_addresses` empty | Re-run verification job |

## Automation
```bash
# Daily verification report
npm run purchase:verify:daily

# Alert on failed submits
SELECT COUNT(*) FROM purchase_attempts 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour';
```

## Related
- [Purchase Tracing Infra](../architecture/purchase-tracing.md)
- [Purchase Flow API](../api/endpoints/purchase-flow.md)
- [Purchase Attempt Model](../database/models/purchase-attempt.md)