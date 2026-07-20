---
type: Feature Spec
title: Feature Nft Authority Lifecycle Rotation Revocation
description: Feature Nft Authority Lifecycle Rotation Revocation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-nft-authority-lifecycle-rotation-revocation.md
---

# Feature: NFT Authority Lifecycle Rotation and Revocation (STORY-006-04)

## Summary
This feature adds a backend lifecycle for critical collection authorities:
- `transfer_delegate` (`PermanentTransferDelegate` plugin authority)
- `appdata_authority` (collection `updateAuthority` used by AppData writes)

Supported operations:
- `rotate(role, new_authority)`
- `revoke(role)`
- `emergency_rotate(role, new_authority)`

## API Surface
- `POST /api/admin/core-candy-machine/authorities/prepare`
- `POST /api/admin/core-candy-machine/authorities/submit`

Both routes are admin-only (SIWS role checks) and bind payer identity to session wallet server-side.

## Security Controls
- Multisig evidence is mandatory (`proposalId`, `proposer`, `executor`, `approverSigners`).
- Quorum policy:
  - `SQUADS_MULTISIG_THRESHOLD` for regular operations.
  - `SQUADS_EMERGENCY_MULTISIG_THRESHOLD` for emergency operations.
- Optional allowlists:
  - `SQUADS_PROPOSER_ALLOWLIST`
  - `SQUADS_APPROVER_ALLOWLIST`
  - `SQUADS_EXECUTOR_ALLOWLIST`
- Cooldown policy:
  - `AUTHORITY_ROTATION_COOLDOWN_SECONDS` for non-emergency operations.
  - Emergency bypass only with elevated quorum.

## Persistence and Audit
Migration `017_authority_lifecycle_registry.sql` introduces:
- `authority_registry` (role + collection scoped state, monotonic version)
- `authority_audit_events` (prepared/submitted lifecycle and evidence)

## Testing
Added tests:
- `tests/lib/core-authority-lifecycle.test.ts`
- `tests/api/admin-core-candy-machine-authorities-prepare-route.test.ts`
- `tests/api/admin-core-candy-machine-authorities-submit-route.test.ts`

## Devnet Proof (2026-04-01)
- RPC: `https://solana-devnet.g.alchemy.com/v2/0yIenKKNLWTTAWxKRcUvB`
- Collection: `DZ7sRMPFCPm5SFeEAc7JN8LQPRtcfi1JFor4QuWRvR1F`
- `emergency_rotate` signature: `DWJkjKQeaeXUXAJdXHmWtZjmsHdqmRcTyGRSHZ5wWyA7Aa1EnNZMwq3kWMmYebfQE8BQxQzZZz2e6QbBcZWcsXg`
- `rotate` (restore) signature: `38enfrc4UXg3s7WEBzoeAsx29tRChFmuVZhvWGGEibnbs7k6Nw1tERv8imma9iDgh4idFEe7xJcN4SznFDzsDBy`
- Audit operation IDs:
  - `ccedf55f-7f75-4088-8e81-7faaf2220da1`
  - `817d5ef3-10a0-4c87-b1f5-21052a7232b4`
- Full verification details: `knowledge/devnet-proof.md`.

## Notes
- This implementation validates and records multisig evidence server-side.
- Real Squads proposal execution and signer cryptographic attestation remain external prerequisites for production governance workflows.
