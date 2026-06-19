---
type: Data Model
title: Authority Registry
description: NFT collection authority lifecycle — transfer_delegate and appdata_authority rotation/revocation with multisig
tags: [database, model, authority, nft, rotation, revocation, multisig, squads]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/tree/develop/lib/core-authority-lifecycle.ts
---

# Authority Registry

## Database Tables (Migration `017_authority_lifecycle_registry.sql`)
- `authority_registry` — current authority state
- `authority_audit_events` — operation history

## Type Definitions
From `lib/core-authority-lifecycle.ts`:

### Authority Role
```typescript
type AuthorityRole = "transfer_delegate" | "appdata_authority";

type AuthorityRecord = {
  role: AuthorityRole;
  collection_address: string;
  authority_pubkey: string;
  authority_version: number;      // Monotonic (n → n+1)
  updated_by: string;             // Wallet pubkey or "system"
  updated_at: Date;
  last_operation_id: string;
};
```

### Audit Event
```typescript
type AuthorityAuditEvent = {
  id: string;                     // UUID
  role: AuthorityRole;
  collection_address: string;
  operation: "rotate" | "revoke" | "emergency_rotate";
  previous_authority: string | null;
  new_authority: string | null;
  previous_version: number;
  new_version: number;
  status: "prepared" | "submitted" | "failed";
  multisig: MultisigEvidence;
  cooldown_bypassed: boolean;
  cooldown_remaining_seconds: number;
  signature: string | null;       // On-chain tx signature
  prepared_at: Date;
  submitted_at: Date | null;
  created_at: Date;
};

type MultisigEvidence = {
  proposal_id: string;
  proposer: string;
  executor: string;
  approver_signers: string[];
  reason: string | null;
  requested_at: string;           // ISO timestamp
};
```

## Operations
| Operation | Description | Threshold |
| --- | --- | --- |
| `rotate(role, new_authority)` | Swap authority | Regular |
| `revoke(role)` | Move to sentinel `11111111111111111111111111111111` | Regular |
| `emergency_rotate(role, new_authority)` | Bypass cooldown | Emergency |

## Policy Configuration (Environment)
```bash
SQUADS_MULTISIG_THRESHOLD=2                    # Regular
SQUADS_EMERGENCY_MULTISIG_THRESHOLD=3          # Emergency (max(regular+1, 3))
AUTHORITY_ROTATION_COOLDOWN_SECONDS=21600      # 6 hours
# Optional allowlists:
SQUADS_PROPOSER_ALLOWLIST=
SQUADS_APPROVER_ALLOWLIST=
SQUADS_EXECUTOR_ALLOWLIST=
```

## Invariants (Enforced)
- [x] `authority_version` strictly monotonic (`n → n+1`)
- [x] Non-emergency cooldown enforced
- [x] Emergency ops bypass cooldown only with elevated quorum
- [x] Every operation emits audit event with proposal metadata + signature
- [x] Registry changes are collection-scoped and conflict-checked

## Bootstrap
- On first access, registry bootstrapped from env:
  - `SQUADS_TRANSFER_AUTHORITY` → `transfer_delegate`
  - `SQUADS_APPDATA_AUTHORITY` (fallback to transfer) → `appdata_authority`

## API Endpoints
- `POST /api/admin/core-candy-machine/authorities/prepare` — build tx
- `POST /api/admin/core-candy-machine/authorities/submit` — submit signed tx
- `GET /api/admin/core-candy-machine/authorities/registry` — current state (future)
- `GET /api/admin/core-candy-machine/authorities/audit` — history (future)

## Devnet Evidence
- Collection: `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F`
- Signatures recorded in `authority_audit_events`
- Explorer links in PR #86

## Related
- [Rotation Spec](../architecture/rotation-spec.md)
- [Authority Model](../architecture/authority-model.md)
- [NFT Spec](../architecture/nft-spec.md#delegate-authority-lifecycle)