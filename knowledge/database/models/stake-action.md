---
type: Data Model
title: Stake Action Attempt
description: Stake/unstake action records with idempotency and webhook reconciliation
tags: [database, model, stake, unstake, nft, freeze, helius]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/stake-attempts-repository.ts
---

# Stake Action Attempt

## Database Tables
- `stake_action_attempts` (migration `031_stake_profile_persistence.sql`)
- `stake_profile_events` (profile history)
- `user_profile_stake_events` (validated events for distribution)

## Type Definitions
From `lib/stake-attempts-repository.ts`:

```typescript
export type StakeProductAction = "stake" | "unstake";

export type StakeAttemptStatus = 
  | "prepared" 
  | "submitted" 
  | "validated" 
  | "reconcile_pending" 
  | "rejected" 
  | "failed";

export type StakeActionAttemptRecord = {
  id: string;                    // UUID
  wallet_public_key: string;     // Owner wallet
  asset_mint_address: string;    // NFT mint
  action: StakeProductAction;    // stake | unstake
  status: StakeAttemptStatus;
  tx_signature: string | null;
  idempotency_key: string;       // Server-issued
  idempotency_expires_at: Date;
  error_code: string | null;
  error_message: string | null;
  prepared_at: Date;
  submitted_at: Date | null;
  validated_at: Date | null;
  created_at: Date;
  updated_at: Date;
};
```

From `lib/stake-profile-events-repository.ts`:

```typescript
export type StakeProfileValidationStatus = 
  | "pending" 
  | "validated" 
  | "reconcile_pending" 
  | "rejected";

export type StakeProfileEventRecord = {
  id: string;
  wallet_public_key: string;
  asset_mint_address: string;
  action: StakeProductAction;
  status: StakeProfileValidationStatus;
  tx_signature: string | null;
  source: "webhook" | "manual";
  helius_event_id: string | null;
  created_at: Date;
  validated_at: Date | null;
};
```

## State Machine
```
prepared → submitted → validated | reconcile_pending → validated | rejected | failed
```

## Blockhash Expiry Handling
- `BLOCKHASH_EXPIRED` → status = `failed`, error_code = `BLOCKHASH_EXPIRED`
- Recoverable: UI prompts fresh signature, new attempt created

## Eligibility Requirements
Asset must:
1. Be in BRIDS-tracked collection (persisted in DB)
2. Be currently owned by authenticated wallet
3. Have `FreezeDelegate` with `Owner` authority

## Webhook Reconciliation
- Helius webhook (`/api/webhooks/helius/stake`) observes `freezeAsset` / `thawAsset`
- Canonical RPC revalidation required before profile persistence
- Dedupe by `(provider, eventId)` and `(provider, eventFingerprint)`

## Related
- [Stake Distribution API](../api/endpoints/stake-distribution.md)
- [Stake Service](../lib/stake-service.ts)
- [Helius Webhook](../api/endpoints/webhooks.md)