---
id: KNOW-2026-08-001
title: Candy Machine deploy iteration 2026-08-11 BRI-186
status: verified
promotion_target: guide
scope: admin-assets-new-core-candy-machine
owner: jeisonsosa
created_at: 2026-08-11T00:00:00.000Z
updated_at: 2026-08-11T00:00:00.000Z
source_issue: BRI-186
source_feature: admin-assets-new
enforcement_candidate: yes
---

# Candy Machine Deploy Iteration: 2026-08-11

## Purpose

Record the Candy Machine deploy system repair in the BRI-186 monorepo FDD architecture branch.

## Iteration Metadata

- Date: 2026-08-11
- Branch: `refactor/jeisonsosa-BRI-186-monorepo-fdd-architecture`
- Base branch: `develop`
- PR: `N/A - Active Branch`
- Final merged PR: `N/A`
- Related issue: `BRI-186`
- Human acceptance: `Approved`
- Runtime target: devnet
- Scope: Fix deferred transaction confirmation strategy from parallel Promise.all back to sequential iteration to prevent Devnet RPC rate limits (HTTP 429).

## Functional Baseline

Preserved full functional baseline from BRI-182. Reverted regression where transaction confirmations were being executed in parallel via Promise.all.

## Implementation Snapshot

Frontend:
- File: `apps/web/src/features/nft-minting/presentation/core-candy-machine-panel.tsx`
- Responsibility: Admin UI panel for Candy Machine deploy.
- Notable state transitions: Integrates with modern `@solana/kit` wallet connections.

Prepare route:
- File: `app/api/admin/core-candy-machine/deploy/prepare/route.ts`
- Responsibility: Metadata preparation.
- Inputs: Form metadata.
- Outputs: IPFS JSON URIs.

Submit route:
- File: `app/api/admin/core-candy-machine/submit/route.ts`
- Responsibility: Submit signed transactions.
- Inputs: Base64 signed transactions.
- Outputs: Signature summaries.

Core deploy service:
- File: `lib/core-candy-machine-admin.ts`
- Responsibility: Core Candy Machine deploy assembly.
- Important functions: `prepareCoreCandyMachineDeploy`, `submitCoreCandyMachineSignedTransactions`.

Snapshot/finalize:
- File: `lib/core-candy-machine-snapshot-service.ts`
- Responsibility: Snapshot verification.
- Gate condition: DAS group & items loaded verification.

Observability:
- Files: `lib/observability`
- Runtime log location: `store.ts`
- Markdown memory location: `knowledge/`

## Flow Diagram

```mermaid
flowchart TD
  A["Admin starts deploy"] --> B["Prepare deploy transactions"]
  B --> C["Wallet signs"]
  C --> D["Submit signed transactions"]
  D --> E["RPC confirms sequentially"]
  E --> F["Finalize snapshot"]
  F --> G{"canCreateAsset"}
  G -- "true" --> H["Create Asset enabled"]
  G -- "false" --> I["Create Asset blocked"]
```

## Transaction Assembly

Deploy transaction order:
1. Create Core Collection.
2. Create Core Candy Machine and Guard.
3. Load config lines in chunks.

## Metaplex Core Plugins

Plugin:
- Level: collection
- Creation point: Collection deploy
- Authority model: Admin wallet / Squads
- Why it exists: Freeze and transfer delegates for collection management.
- Security concern: Devnet authority verification.

## Security Contract

Allowed diagnostics:
- public keys, signatures, RPC host.

Forbidden diagnostics:
- private keys, wallet secrets.

## What Changed In This Iteration

- Change: Reverted `Promise.all` parallel deferred transaction confirmation back to sequential `for...of` iteration.
- Reason: Parallel polling saturated Devnet RPC rate limits (429 Too Many Requests), causing status timeouts and false negative snapshot verifications.
- Files: `lib/core-candy-machine-admin.ts`, `apps/web/src/lib/core-candy-machine-admin.ts`.
- Expected effect: Sequential RPC confirmation, eliminating 429 errors and ensuring accurate snapshot verification.

## What Did Not Work

- Attempt: Parallel deferred transaction confirmation via `Promise.all`.
- Result: Devnet RPC rate limit saturation (429).
- Why it failed: Too many concurrent RPC polling requests for transaction status.
- What future fixes should avoid: Avoid parallelizing RPC confirmation polling for bulk Solana transactions on Devnet.

## Manual Test Record

```text
Date: 2026-08-11
Wallet: devnet-admin
Quantity: 1
RPC host: devnet
Flow ID: eec2fa82-77c5-4a37-929b-0a266079bb60
Mint Signature: 3jkPkEQW7AwF6bbhcadyCHp47uWHC3j4fJuKBov4H7HULM7ssFRFFiTPcWimLaQ8UsorJwptD6JCsrAYYr4E5UKW
Solscan Explorer: https://solscan.io/tx/3jkPkEQW7AwF6bbhcadyCHp47uWHC3j4fJuKBov4H7HULM7ssFRFFiTPcWimLaQ8UsorJwptD6JCsrAYYr4E5UKW?cluster=devnet
Final UI message: Success (Mint complete)
Last successful log event: validate:knowledge
First failing log event: None
Conclusion: Passed (Verified on-chain in real Devnet transaction)
Next action: Merge to develop / main
```

## Open Questions

- Question: None.
- Evidence needed: N/A
- Owner: jeisonsosa
