---
type: Procedure
title: DevNet Authority Lifecycle Proof
description: Procedure for executing and verifying NFT authority rotation/revocation on devnet
tags: [operations, procedure, authority, rotation, revocation, devnet, multisig, nft]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/scripts/devnet-authority-lifecycle-proof.ts
---

# DevNet Authority Lifecycle Proof Procedure

## Overview
Execute and verify on-chain authority rotation/revocation for `transfer_delegate` and `appdata_authority` roles using Squads multisig.

## Prerequisites
- Devnet SOL funded (>1 SOL)
- `SQUADS_TRANSFER_AUTHORITY`, `SQUADS_APPDATA_AUTHORITY` configured
- Squads multisig deployed with known `proposalId` flow
- Admin wallet in `ADMIN_WALLETS`

## Procedure

### 1. Prepare Rotation/Revocation

#### Request Prepare
```bash
POST /api/admin/core-candy-machine/authorities/prepare
{
  "collectionAddress": "<COLLECTION_PUBKEY>",
  "role": "appdata_authority",  # or "transfer_delegate"
  "operation": "rotate",         # or "revoke", "emergency_rotate"
  "newAuthority": "<NEW_PUBKEY>",  # required for rotate/emergency
  "multisig": {
    "proposalId": "unique-proposal-id",
    "proposer": "<PROPOSER_PUBKEY>",
    "executor": "<EXECUTOR_PUBKEY>",
    "approverSigners": ["<SIGNER1>", "<SIGNER2>"],
    "reason": "Authority rotation per governance"
  }
}
```

#### Response
```json
{
  "operationId": "uuid",
  "transactionBase64": "...",
  "authorityVersion": 2,
  "requiredThreshold": 2,
  "cooldownBypassed": false
}
```

### 2. Sign Transaction
- Decode `transactionBase64`
- Sign with appropriate wallet (executor or proposer)
- Use Phantom or CLI: `solana sign-transaction <file>`

### 3. Submit
```bash
POST /api/admin/core-candy-machine/authorities/submit
{
  "operationId": "uuid",
  "signedTransactionBase64": "..."
}
```

### 4. Verify On-Chain
```bash
# Check authority registry
solana account <COLLECTION_ADDRESS> --url devnet | grep -A5 "updateAuthority"

# Or via DAS
curl -X POST https://devnet.helius-rpc.com/?api-key=$HELIUS_API_KEY \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAsset","params":{"id":"<COLLECTION>"}}'
```

### 4. Verify Audit Record
```sql
SELECT * FROM authority_audit_events 
WHERE collection_address = '<COLLECTION>' 
ORDER BY created_at DESC LIMIT 5;
```

Expected: `status = 'submitted'`, `signature` populated, `new_version = old_version + 1`

## Operations Reference

### Rotate (Standard)
- Requires: Regular threshold (default 2)
- Cooldown: 6 hours (configurable)
- New authority takes effect immediately

### Revoke
- Sets authority to sentinel: `11111111111111111111111111111111`
- Requires: Regular threshold
- Cooldown applies

### Emergency Rotate
- Bypasses cooldown
- Requires: Emergency threshold (default 3)
- Use for: Compromised authority, urgent governance

## Verification Checklist
- [ ] Prepare returns valid transaction
- [ ] Signature collected from correct wallet
- [ ] Submit returns `finalized` signature
- [ ] On-chain authority matches new authority
- [ ] `authority_version` incremented by 1
- [ ] Audit event created with `status = submitted`
- [ ] Explorer link works for signature

## Common Issues

| Issue | Resolution |
|-------|------------|
| `403 Authority mismatch` | Ensure signer = `executor` from multisig |
| `400 Cooldown active` | Wait or use `emergency_rotate` |
| `400 Threshold not met` | Need more approver signatures |
| `409 Buffer account` | Clear stale buffer: `solana program close` |
| Webhook not firing | Check `HELIUS_WEBHOOK_SECRET` config |

## Devnet Evidence (Required for Acceptance)
1. Collection address
2. All transaction signatures with explorer links
3. Pre/post authority state (DAS or RPC)
4. Audit event records
5. Multisig proposal IDs

## Related
- [Rotation Spec](../architecture/rotation-spec.md)
- [Authority Model](../architecture/authority-model.md)
- [Mint Orchestrator API](../api/endpoints/mint-orchestrator.md)