---
type: Data Model
title: Purchase Attempt
description: Purchase attempt record for marketplace mint flow — quote, challenge, prepare, submit with idempotency and asset verification
tags: [database, model, purchase, mint, nft, candy-machine, idempotency]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/purchase-attempts-repository.ts
---

# Purchase Attempt

## Database Table
`purchase_attempts` (migration `007_purchase_attempts.sql` + later migrations)

## Type Definition
From `lib/purchase-attempts-repository.ts`:

```typescript
export type PurchaseAttemptStatus = 
  | "created" 
  | "prepared" 
  | "submitted" 
  | "confirmed" 
  | "failed";

export type PurchaseAttemptAssetVerificationStatus = 
  | "not_required" 
  | "pending" 
  | "verified" 
  | "failed";

export type PurchaseAttemptRecord = {
  id: string;                          // UUIDv7
  wallet_public_key: string;           // Buyer wallet
  candy_machine_address: string;       // CM address
  challenge_id: string | null;         // FK to purchase_challenges
  client_ip: string | null;
  quantity: number;
  idempotency_key: string;             // UUIDv7, 5-min TTL
  idempotency_expires_at: Date;
  tx_signature: string | null;
  status: PurchaseAttemptStatus;
  error_code: string | null;
  error_message: string | null;
  expected_asset_addresses: string[];  // Expected mint addresses
  verified_asset_addresses: string[];  // Confirmed on-chain
  asset_verification_status: PurchaseAttemptAssetVerificationStatus;
  asset_verification_error: string | null;
  asset_verification_checked_at: Date | null;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CreatePurchaseAttemptInput = {
  wallet_public_key: string;
  candy_machine_address: string;
  challenge_id: string | null;
  client_ip: string | null;
  quantity: number;
  idempotency_key: string;
  idempotency_expires_at: Date;
  expected_asset_addresses: string[];
};
```

## State Machine
```
created → prepared → submitted → confirmed | failed
                    ↘ confirmed (idempotent replay)
```

## Idempotency
- Unique key: `(wallet_public_key, idempotency_key)`
- TTL: 5 minutes (configurable)
- Replay returns existing `submitted` state without re-send

## Asset Verification
Post-submit verification checks:
1. Asset exists on-chain
2. Owner === buyer wallet
3. Collection === expected BRIDS collection
4. `freezeDelegate.authority === Owner` (for Stake eligibility)

## Related Tables
- `purchase_challenges` — challenge issuance/consumption
- `purchase_flow_events` — tracing (`request/success/error per step)
- `purchase_rate_limit_events` — rate limit evidence
- `purchase_webhook_events` — Helius webhook records

## Related
- [Purchase Flow API](../api/endpoints/purchase-flow.md)
- [Purchase Challenges](purchase-challenge.md)
- [Purchase Webhook Events](../api/schemas/purchase-webhook-events.md)